import { apiClient, ApiResponse, User, Group, Memo, Invitation, CreateMemoDto } from '@/lib/api';
import { useState, useEffect, useCallback, useRef } from 'react';
import { notifyError } from '@/lib/notify';

// Generic API Hook with enhanced error handling and caching
export function useApiState<T>(cacheKey?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // キャッシュの実装
  const cache = useRef(new Map<string, { data: T, timestamp: number }>());

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>, useCache: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // キャッシュのチェック
      if (useCache && cacheKey && cache.current.has(cacheKey)) {
        const cached = cache.current.get(cacheKey)!;
        const now = Date.now();
        // 5分以内のキャッシュは有効
        if (now - cached.timestamp < 5 * 60 * 1000) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          setLoading(false);
          return;
        }
      }
      
      const response = await apiCall();
      if (response.success) {
        const result = response.data || null;
        setData(result);
        setLastUpdated(Date.now());
        
        // キャッシュに保存
        if (cacheKey && result) {
          cache.current.set(cacheKey, { data: result, timestamp: Date.now() });
        }
      } else {
        const errorMessage = response.error || 'API call failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('API Error:', errorMessage);
      notifyError('エラーが発生しました', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setLastUpdated(null);
    if (cacheKey) {
      cache.current.delete(cacheKey);
    }
  }, [cacheKey]);

  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      cache.current.delete(cacheKey);
    }
  }, [cacheKey]);

  return { data, loading, error, lastUpdated, execute, reset, setData, invalidateCache };
}

// Async Search Hook with Debouncing and enhanced error handling
export function useAsyncSearch<T>(
  searchFn: (query: string) => Promise<ApiResponse<T[]>>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchFn(searchQuery);
        if (response.success) {
          setResults(response.data || []);
          setHasSearched(true);
        } else {
          const errorMessage = response.error || 'Search failed';
          setError(errorMessage);
          setResults([]);
          throw new Error(errorMessage);
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search error occurred';
      setError(errorMessage);
      setResults([]);
      console.error('Search Error:', errorMessage);
      notifyError('検索に失敗しました', errorMessage);
    } finally {
        setLoading(false);
      }
    },
    [searchFn]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debouncedSearch, debounceMs]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  }, []);

  return { query, results, loading, error, hasSearched, search, clearSearch };
}

// Specific API Hooks with enhanced functionality
export function useGroups() {
  const { data, loading, error, execute, reset, invalidateCache, lastUpdated } = useApiState<Group[]>('groups');

  const fetchGroups = useCallback((useCache: boolean = false) => {
    execute(() => apiClient.getGroups(), useCache);
  }, [execute]);

  const createGroup = useCallback(async (groupData: { name: string; description?: string }) => {
    try {
      const response = await apiClient.createGroup(groupData);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        fetchGroups(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to create group');
    } catch (error) {
      console.error('Create group error:', error);
      notifyError('グループ作成に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [fetchGroups, invalidateCache]);

  const updateGroup = useCallback(async (id: string, groupData: Partial<Group>) => {
    try {
      const response = await apiClient.updateGroup(id, groupData);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        fetchGroups(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to update group');
    } catch (error) {
      console.error('Update group error:', error);
      notifyError('グループ更新に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [fetchGroups, invalidateCache]);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteGroup(id);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        fetchGroups(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Delete group error:', error);
      notifyError('グループ削除に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [fetchGroups, invalidateCache]);

  return {
    groups: data,
    loading,
    error,
    lastUpdated,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reset
  };
}

export function useMemos(userId?: string, groupId?: string) {
  const cacheKey = `memos-${userId || 'all'}-${groupId || 'all'}`;
  const { data, loading, error, execute, reset, setData, invalidateCache, lastUpdated } = useApiState<Memo[]>(cacheKey);

  const fetchMemos = useCallback((useCache: boolean = false) => {
    // groupIdがundefinedの場合はnullを渡して個人メモを取得
    const groupIdForApi = groupId === undefined ? null : groupId;
    execute(() => apiClient.getMemos(userId, groupIdForApi), useCache);
  }, [execute, userId, groupId]);

  const createMemo = useCallback(async (memoData: CreateMemoDto) => {
    try {
      const response = await apiClient.createMemo(memoData);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        fetchMemos(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to create memo');
    } catch (error) {
      console.error('Create memo error:', error);
      notifyError('メモ作成に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [fetchMemos, invalidateCache]);

  const updateMemo = useCallback(async (id: string, memoData: Partial<Memo>) => {
    try {
      const response = await apiClient.updateMemo(id, memoData);
      if (response.success) {
        // Update local state for immediate UI feedback
        if (data) {
          const updatedMemos = data.map(memo => 
            memo.id === id ? { ...memo, ...response.data } : memo
          );
          setData(updatedMemos);
        }
        invalidateCache(); // キャッシュを無効化
        return response.data;
      }
      throw new Error(response.error || 'Failed to update memo');
    } catch (error) {
      console.error('Update memo error:', error);
      notifyError('メモ更新に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [data, setData, invalidateCache]);

  const deleteMemo = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteMemo(id);
      if (response.success) {
        // Remove from local state for immediate UI feedback
        if (data) {
          const filteredMemos = data.filter(memo => memo.id !== id);
          setData(filteredMemos);
        }
        invalidateCache(); // キャッシュを無効化
      } else {
        throw new Error(response.error || 'Failed to delete memo');
      }
    } catch (error) {
      console.error('Delete memo error:', error);
      notifyError('メモ削除に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [data, setData, invalidateCache]);

  return {
    memos: data,
    loading,
    error,
    lastUpdated,
    fetchMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    reset
  };
}

export function useMemoSearch() {
  return useAsyncSearch<Memo>((query) => apiClient.searchMemos(query));
}

export function useUserSearch() {
  return useAsyncSearch<User>((query) => apiClient.searchUsers(query));
}

export function useInvitations(groupId: string) {
  const { data, loading, error, execute, reset, invalidateCache, lastUpdated } = useApiState<Invitation[]>(`invitations-${groupId}`);

  const fetchInvitations = useCallback((useCache: boolean = false) => {
    if (groupId) {
      execute(() => apiClient.getGroupInvitations(groupId), useCache);
    }
  }, [execute, groupId]);

  const sendInvitation = useCallback(async (invitation: { email?: string; userId?: string; role?: 'admin' | 'member' }) => {
    try {
      const response = await apiClient.inviteMember(groupId, invitation);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        fetchInvitations(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to send invitation');
    } catch (error) {
      console.error('Send invitation error:', error);
      notifyError('招待の送信に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [groupId, fetchInvitations, invalidateCache]);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      const response = await apiClient.acceptInvitation(token);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        return response.data;
      }
      throw new Error(response.error || 'Failed to accept invitation');
    } catch (error) {
      console.error('Accept invitation error:', error);
      notifyError('招待の承認に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [invalidateCache]);

  const rejectInvitation = useCallback(async (token: string) => {
    try {
      const response = await apiClient.rejectInvitation(token);
      if (response.success) {
        invalidateCache(); // キャッシュを無効化
        return response.data;
      }
      throw new Error(response.error || 'Failed to reject invitation');
    } catch (error) {
      console.error('Reject invitation error:', error);
      notifyError('招待の拒否に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }, [invalidateCache]);

  return {
    invitations: data,
    loading,
    error,
    lastUpdated,
    fetchInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    reset
  };
}
