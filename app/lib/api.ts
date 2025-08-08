import { withPerformanceMonitoring } from './performance';
import type { ApiResponse, User, Group, GroupMember, Invitation, Memo, CreateMemoDto } from '@/types';
import { notifyError } from '@/lib/notify';

export type { ApiResponse, User, Group, GroupMember, Invitation, Memo, CreateMemoDto } from '@/types';

// 実行環境に応じてベースURLを決定（ブラウザでは現在のオリジンを優先）
const API_BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 環境に応じたAPI設定
const getApiConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    baseUrl: API_BASE_URL,
    timeout: isProduction ? 15000 : 8000, // 本番環境ではタイムアウトを長く
    retryAttempts: isProduction ? 3 : 2, // リトライ回数を調整
    enableMock: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true'
  };
};

// 型は '@/types' に集約

class ApiClient {
  private baseUrl: string;
  private config: ReturnType<typeof getApiConfig>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.config = getApiConfig();
  }

  private async retryRequest(fn: () => Promise<any>, attempts: number): Promise<any> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // 最後のリトライでなければ待機
        if (i < attempts - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 10000); // 指数バックオフ（最大10秒）
          console.log(`Retry attempt ${i + 1}/${attempts} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private async timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([promise, timeout]);
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // クッキーを送信
    };

    // reduce verbose logging in production
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e2) {
          
        }
      }
      console.error('API Client: Fetch error details:', errorMessage);

      switch (response.status) {
        case 401:
          throw new Error('認証が必要です');
        case 403:
          throw new Error('アクセス権限がありません');
        case 404:
          throw new Error('リソースが見つかりません');
        case 500:
          throw new Error('サーバーエラーが発生しました');
        default:
          throw new Error(errorMessage);
      }
    }

    const data = await response.json();
    return data;
  }

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<{ access_token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: any): Promise<ApiResponse<{ access_token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Memos
  async getMemos(userId?: string, groupId?: string | null): Promise<ApiResponse<Memo[]>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (groupId) params.append('groupId', groupId);
      const result = await this.request(`/api/memos?${params.toString()}`);

      return result;
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      notifyError('メモ取得に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  // メモ作成
  async createMemo(memoData: CreateMemoDto): Promise<ApiResponse<Memo>> {
    try {
      console.log('apiClient.createMemo: Calling this.request...');
      const result = await this.request('/api/memos', {
        method: 'POST',
        body: JSON.stringify(memoData)
      });

      return result;
    } catch (error) {
      console.error('Failed to create memo:', error);
      notifyError('メモ作成に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async getMemo(id: string): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/api/memos/${id}`);
    } catch (error) {
      console.error('Failed to fetch memo:', error);
      notifyError('メモ取得に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async updateMemo(id: string, updates: Partial<CreateMemoDto>): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/api/memos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update memo:', error);
      notifyError('メモ更新に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/api/memos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete memo:', error);
      notifyError('メモ削除に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async searchMemos(query: string, userId?: string, groupId?: string): Promise<ApiResponse<Memo[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (userId) params.append('userId', userId);
    if (groupId) params.append('groupId', groupId);
    return this.request(`/api/memos/search?${params.toString()}`);
  }

  // Groups
  async getGroups(): Promise<ApiResponse<Group[]>> {
    try {
      return await this.request('/api/groups');
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      notifyError('グループ取得に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    try {
      return await this.request(`/api/groups/${groupId}/members`);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      notifyError('メンバー取得に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async createGroup(groupData: { name: string; description?: string }): Promise<ApiResponse<Group>> {
    try {
      return await this.request('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      notifyError('グループ作成に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<ApiResponse<Group>> {
    try {
      return await this.request(`/api/groups/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Failed to update group:', error);
      notifyError('グループ更新に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request(`/api/groups/${id}`, {
          method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete group:', error);
      notifyError('グループ削除に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async getGroupInvitations(groupId: string): Promise<ApiResponse<Invitation[]>> {
    try {
      return await this.request(`/api/groups/${groupId}/invitations`);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      notifyError('招待一覧の取得に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async revokeInvitation(groupId: string, token: string): Promise<ApiResponse<void>> {
    try {
      return await this.request(`/api/groups/${groupId}/invitations/${token}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      notifyError('招待の失効に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      return await this.request(`/api/users/search?q=${query}`);
    } catch (error) {
      console.error('Failed to search users:', error);
      notifyError('ユーザー検索に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async inviteMember(groupId: string, invitation: { email?: string; userId?: string; role?: 'admin' | 'member' }): Promise<ApiResponse<Invitation>> {
    try {
      return await this.request(`/api/groups/${groupId}/invitations`, {
          method: 'POST',
          body: JSON.stringify(invitation)
      });
    } catch (error) {
      console.error('Failed to invite member:', error);
      notifyError('メンバー招待に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async updateGroupMemberRole(groupId: string, memberId: string, role: 'admin' | 'member'): Promise<ApiResponse<GroupMember>> {
    try {
      return await this.request(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: role.toUpperCase() })
      });
    } catch (error) {
      console.error('Failed to update member role:', error);
      notifyError('メンバーロール更新に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async removeGroupMember(groupId: string, memberId: string): Promise<ApiResponse<void>> {
    try {
      return await this.request(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
      notifyError('メンバー削除に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    try {
      // サーバー実装: /api/groups/join/[token]
      return await this.request(`/api/groups/join/${token}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      notifyError('招待の承認に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async rejectInvitation(token: string): Promise<ApiResponse<void>> {
    try {
      return await this.request(`/api/invitations/reject/${token}`, {
          method: 'POST'
      });
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      notifyError('招待の拒否に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async joinGroupByGroupId(groupId: string): Promise<ApiResponse<GroupMember>> {
    try {
      return await this.request(`/api/groups/${groupId}/join`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to join group by id:', error);
      notifyError('グループ参加に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }

  async joinGroupByInvitation(invitationToken: string): Promise<ApiResponse<GroupMember>> {
    try {
      // サーバー実装に合わせる: /api/groups/join/[token]
      return await this.request(`/api/groups/join/${invitationToken}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to join group by invitation:', error);
      notifyError('招待からの参加に失敗しました', error instanceof Error ? error.message : undefined);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
