import React from 'react'
import { useAuth } from './auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// バージョン履歴関連
export interface MemoVersion {
  id: string
  memoId: string
  title: string
  content: string
  tags: string[]
  version: number
  createdAt: string
  createdBy: string
  changeType: 'create' | 'update' | 'restore'
  changeSummary?: string
}

// 下書き関連
export interface MemoDraft {
  id: string
  memoId?: string
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
  lastSavedAt: string
  userId: string
}

// お気に入り関連
export interface MemoFavorite {
  id: string
  memoId: string
  userId: string
  createdAt: string
  memo: {
    id: string
    title: string
    content: string
    updatedAt: string
  }
}

class MemoFeaturesApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get session from localStorage for authentication
    let authHeader = '';
    try {
      const savedSession = localStorage.getItem('notetree_session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        // セッションの有効性をチェック
        const now = Date.now();
        const expiresAt = sessionData.expires_in * 1000;
        const sessionStart = sessionData.user.created_at ? new Date(sessionData.user.created_at).getTime() : now;
        
        if ((sessionStart + expiresAt) > now) {
          authHeader = `Bearer ${sessionData.access_token}`;
        } else {
          // セッションが期限切れの場合はクリア
          localStorage.removeItem('notetree_session');
          localStorage.removeItem('notetree_user');
        }
      }
    } catch (error) {
      console.warn('Failed to get authentication token:', error);
      // エラーが発生した場合は認証情報をクリア
      localStorage.removeItem('notetree_session');
      localStorage.removeItem('notetree_user');
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 認証エラーの場合はセッションをクリア
        if (response.status === 401) {
          localStorage.removeItem('notetree_session');
          localStorage.removeItem('notetree_user');
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // バージョン履歴API
  async getMemoVersions(memoId: string): Promise<ApiResponse<MemoVersion[]>> {
    return this.request<MemoVersion[]>(`/memos/${memoId}/versions`)
  }

  async restoreMemoVersion(memoId: string, versionId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/memos/${memoId}/versions/${versionId}/restore`, {
      method: 'POST'
    })
  }

  async getVersionDiff(memoId: string, fromVersion: number, toVersion: number): Promise<ApiResponse<{
    added: string[]
    removed: string[]
    modified: string[]
  }>> {
    return this.request(`/memos/${memoId}/versions/diff?from=${fromVersion}&to=${toVersion}`)
  }

  // 下書きAPI
  async getDrafts(): Promise<ApiResponse<MemoDraft[]>> {
    return this.request<MemoDraft[]>('/drafts')
  }

  async getDraft(id: string): Promise<ApiResponse<MemoDraft>> {
    return this.request<MemoDraft>(`/drafts/${id}`)
  }

  async saveDraft(draft: Omit<MemoDraft, 'id' | 'lastSavedAt' | 'userId'>): Promise<ApiResponse<MemoDraft>> {
    return this.request<MemoDraft>('/drafts', {
      method: 'POST',
      body: JSON.stringify(draft)
    })
  }

  async updateDraft(id: string, draft: Partial<Omit<MemoDraft, 'id' | 'lastSavedAt' | 'userId'>>): Promise<ApiResponse<MemoDraft>> {
    return this.request<MemoDraft>(`/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(draft)
    })
  }

  async deleteDraft(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/drafts/${id}`, {
      method: 'DELETE'
    })
  }

  async publishDraft(id: string): Promise<ApiResponse<{ memoId: string }>> {
    return this.request<{ memoId: string }>(`/drafts/${id}/publish`, {
      method: 'POST'
    })
  }

  // お気に入りAPI
  async getFavorites(): Promise<ApiResponse<MemoFavorite[]>> {
    return this.request<MemoFavorite[]>('/favorites')
  }

  async addToFavorites(memoId: string): Promise<ApiResponse<MemoFavorite>> {
    return this.request<MemoFavorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ memoId })
    })
  }

  async removeFromFavorites(memoId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/favorites/${memoId}`, {
      method: 'DELETE'
    })
  }

  async isFavorite(memoId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    return this.request<{ isFavorite: boolean }>(`/favorites/${memoId}/check`)
  }
}

export const memoFeaturesApiClient = new MemoFeaturesApiClient('http://localhost:3001');

// React Hooks for Memo Features
export function useMemoFeatures() {
  const { user, session } = useAuth()

  const withAuth = async <T>(
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> => {
    if (!user || !session) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Add auth headers to the API client
    const originalRequest = memoFeaturesApiClient['request']
    memoFeaturesApiClient['request'] = async function<T>(endpoint: string, options: RequestInit = {}) {
      return originalRequest.call(this, endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      })
    }

    return apiCall()
  }

  return {
    // バージョン履歴
    getMemoVersions: (memoId: string) => withAuth(() => memoFeaturesApiClient.getMemoVersions(memoId)),
    restoreMemoVersion: (memoId: string, versionId: string) => withAuth(() => memoFeaturesApiClient.restoreMemoVersion(memoId, versionId)),
    getVersionDiff: (memoId: string, fromVersion: number, toVersion: number) => withAuth(() => memoFeaturesApiClient.getVersionDiff(memoId, fromVersion, toVersion)),

    // 下書き
    getDrafts: () => withAuth(() => memoFeaturesApiClient.getDrafts()),
    getDraft: (id: string) => withAuth(() => memoFeaturesApiClient.getDraft(id)),
    saveDraft: (draft: Omit<MemoDraft, 'id' | 'lastSavedAt' | 'userId'>) => withAuth(() => memoFeaturesApiClient.saveDraft(draft)),
    updateDraft: (id: string, draft: Partial<Omit<MemoDraft, 'id' | 'lastSavedAt' | 'userId'>>) => withAuth(() => memoFeaturesApiClient.updateDraft(id, draft)),
    deleteDraft: (id: string) => withAuth(() => memoFeaturesApiClient.deleteDraft(id)),
    publishDraft: (id: string) => withAuth(() => memoFeaturesApiClient.publishDraft(id)),

    // お気に入り
    getFavorites: () => withAuth(() => memoFeaturesApiClient.getFavorites()),
    addToFavorites: (memoId: string) => withAuth(() => memoFeaturesApiClient.addToFavorites(memoId)),
    removeFromFavorites: (memoId: string) => withAuth(() => memoFeaturesApiClient.removeFromFavorites(memoId)),
    isFavorite: (memoId: string) => withAuth(() => memoFeaturesApiClient.isFavorite(memoId)),

    // ユーザー情報
    currentUser: user,
    isAuthenticated: !!user
  }
}

// 下書き自動保存Hook
export function useAutoDraft(
  content: { title: string; content: string; tags: string[]; isPrivate: boolean },
  memoId?: string,
  autoSaveInterval: number = 10000 // 10秒間隔
) {
  const { saveDraft, updateDraft } = useMemoFeatures()
  const [draftId, setDraftId] = React.useState<string | null>(null)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const saveCurrentDraft = React.useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      if (draftId) {
        // 既存の下書きを更新
        const response = await updateDraft(draftId, content)
        if (response.success) {
          setLastSaved(new Date())
        }
      } else {
        // 新しい下書きを作成
        const response = await saveDraft({
          ...content,
          memoId
        })
        if (response.success && response.data) {
          setDraftId(response.data.id)
          setLastSaved(new Date())
        }
      }
    } catch (error) {
      console.error('Draft save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, memoId, draftId, saveDraft, updateDraft, isSaving])

  // 自動保存タイマー
  React.useEffect(() => {
    if (content.title || content.content) {
      const timer = setTimeout(() => {
        saveCurrentDraft()
      }, autoSaveInterval)

      return () => clearTimeout(timer)
    }
  }, [content, saveCurrentDraft, autoSaveInterval])

  return {
    draftId,
    lastSaved,
    isSaving,
    saveCurrentDraft
  }
}
