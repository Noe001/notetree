import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse, User, Group, Memo, Invitation } from '@/lib/api';

// Generic API Hook
export function useApiState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error || 'API call failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset, setData };
}

// Async Search Hook with Debouncing
export function useAsyncSearch<T>(
  searchFn: (query: string) => Promise<ApiResponse<T[]>>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchFn(searchQuery);
        if (response.success) {
          setResults(response.data || []);
        } else {
          setError(response.error || 'Search failed');
          setResults([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search error occurred');
        setResults([]);
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
  }, []);

  return { query, results, loading, error, search, clearSearch };
}

// Specific API Hooks
export function useGroups() {
  const { data, loading, error, execute, reset } = useApiState<Group[]>();

  const fetchGroups = useCallback(() => {
    execute(() => apiClient.getGroups());
  }, [execute]);

  const createGroup = useCallback(async (groupData: { name: string; description?: string }) => {
    try {
      const response = await apiClient.createGroup(groupData);
      if (response.success) {
        fetchGroups(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to create group');
    } catch (error) {
      throw error;
    }
  }, [fetchGroups]);

  const updateGroup = useCallback(async (id: string, groupData: Partial<Group>) => {
    try {
      const response = await apiClient.updateGroup(id, groupData);
      if (response.success) {
        fetchGroups(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to update group');
    } catch (error) {
      throw error;
    }
  }, [fetchGroups]);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteGroup(id);
      if (response.success) {
        fetchGroups(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to delete group');
      }
    } catch (error) {
      throw error;
    }
  }, [fetchGroups]);

  return {
    groups: data,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reset
  };
}

export function useMemos(userId?: string, groupId?: string) {
  const { data, loading, error, execute, reset, setData } = useApiState<Memo[]>();

  const fetchMemos = useCallback(() => {
    // groupIdがundefinedの場合はnullを渡して個人メモを取得
    const groupIdForApi = groupId === undefined ? null : groupId;
    execute(() => apiClient.getMemos(userId, groupIdForApi));
  }, [execute, userId, groupId]);

  const createMemo = useCallback(async (memoData: { title: string; content: string; tags?: string[]; isPrivate?: boolean; groupId?: string }) => {
    try {
      const response = await apiClient.createMemo(memoData);
      if (response.success) {
        fetchMemos(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to create memo');
    } catch (error) {
      throw error;
    }
  }, [fetchMemos]);

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
        return response.data;
      }
      throw new Error(response.error || 'Failed to update memo');
    } catch (error) {
      throw error;
    }
  }, [data, setData]);

  const deleteMemo = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteMemo(id);
      if (response.success) {
        // Remove from local state for immediate UI feedback
        if (data) {
          const filteredMemos = data.filter(memo => memo.id !== id);
          setData(filteredMemos);
        }
      } else {
        throw new Error(response.error || 'Failed to delete memo');
      }
    } catch (error) {
      throw error;
    }
  }, [data, setData]);

  return {
    memos: data,
    loading,
    error,
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
  const { data, loading, error, execute, reset } = useApiState<Invitation[]>();

  const fetchInvitations = useCallback(() => {
    if (groupId) {
      execute(() => apiClient.getGroupInvitations(groupId));
    }
  }, [execute, groupId]);

  const sendInvitation = useCallback(async (invitation: { email?: string; userId?: string; role?: 'admin' | 'member' }) => {
    try {
      const response = await apiClient.inviteMember(groupId, invitation);
      if (response.success) {
        fetchInvitations(); // Refresh the list
        return response.data;
      }
      throw new Error(response.error || 'Failed to send invitation');
    } catch (error) {
      throw error;
    }
  }, [groupId, fetchInvitations]);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      const response = await apiClient.acceptInvitation(token);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to accept invitation');
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    invitations: data,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    acceptInvitation,
    reset
  };
}
