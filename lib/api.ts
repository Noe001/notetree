import { withPerformanceMonitoring } from './performance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

// APIレスポンスの型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// 他の型定義...
export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
  userId: string;
  groupId?: string | null;
}

export interface CreateMemoDto {
  title: string;
  content: string;
  tags?: string[];
  isPrivate?: boolean;
  groupId?: string | null;
}

export interface UpdateMemoDto {
  title?: string;
  content?: string;
  tags?: string[];
  isPrivate?: boolean;
  groupId?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Invitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
}

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
    return withPerformanceMonitoring(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      
      // ローカルストレージから認証トークンを取得
      let authToken = null;
      try {
        const storedAuth = localStorage.getItem('notetree_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          authToken = authData.session?.access_token;
        }
      } catch (error) {
        console.warn('セッション取得エラー:', error);
      }
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          ...options.headers,
        },
      };

      const requestFn = async () => {
        const response = await this.timeoutPromise(
          fetch(url, config),
          this.config.timeout
        );
        
        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // JSONパースに失敗した場合はテキストとして取得
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch (e2) {
              // それでも失敗したらデフォルトメッセージ
            }
          }
          
          // ステータスコードに応じたエラー処理
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

        return await response.json();
      };

      try {
        return await this.retryRequest(requestFn, this.config.retryAttempts);
      } catch (error: any) {
        console.error('API request failed:', url, error);
        
        // ネットワークエラーの場合、モックデータまたは再スロー
        if (this.config.enableMock || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('timeout') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ECONNREFUSED')) {
          console.log('API unavailable, using fallback behavior');
          throw error; // モックデータは各メソッドで処理
        }
        
        throw error;
      }
    }, `API Request: ${endpoint}`);
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
  async getMemos(userId?: string, groupId?: string): Promise<ApiResponse<Memo[]>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (groupId) params.append('groupId', groupId);
      const result = await this.request(`/memos?${params.toString()}`);
      
      return result;
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      throw error;
    }
  }

  // メモ作成
  async createMemo(memoData: CreateMemoDto): Promise<ApiResponse<Memo>> {
    try {
      const result = await this.request('/memos', {
        method: 'POST',
        body: JSON.stringify(memoData)
      });
      
      return result;
    } catch (error) {
      console.error('Failed to create memo:', error);
      throw error;
    }
  }

  async getMemo(id: string): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/memos/${id}`);
    } catch (error) {
      console.error('Failed to fetch memo:', error);
      throw error;
    }
  }

  async updateMemo(id: string, updates: Partial<CreateMemoDto>): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/memos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update memo:', error);
      throw error;
    }
  }

  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/memos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete memo:', error);
      throw error;
    }
  }

  async searchMemos(query: string, userId?: string, groupId?: string): Promise<ApiResponse<Memo[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (userId) params.append('userId', userId);
    if (groupId) params.append('groupId', groupId);
    return this.request(`/memos/search?${params.toString()}`);
  }

  // Groups
  async getGroups(): Promise<ApiResponse<Group[]>> {
    return this.request('/groups');
  }

  async createGroup(groupData: { name: string; description?: string }): Promise<ApiResponse<Group>> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<ApiResponse<Group>> {
    return this.request(`/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
  }

  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    return this.request(`/groups/${id}`, {
        method: 'DELETE'
    });
  }

  async getGroupInvitations(groupId: string): Promise<ApiResponse<Invitation[]>> {
    return this.request(`/groups/${groupId}/invitations`);
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.request(`/users/search?q=${query}`);
  }

  async inviteMember(groupId: string, invitation: { email?: string; userId?: string; role?: 'admin' | 'member' }): Promise<ApiResponse<Invitation>> {
    return this.request(`/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify(invitation)
    });
  }

  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request(`/invitations/accept/${token}`, {
        method: 'POST'
    });
  }

  async joinGroupByGroupId(groupId: string): Promise<ApiResponse<GroupMember>> {
    return this.request(`/groups/${groupId}/join`, {
        method: 'POST'
    });
  }

  async joinGroupByInvitation(invitationToken: string): Promise<ApiResponse<GroupMember>> {
    return this.request(`/invitations/${invitationToken}/accept`, {
        method: 'POST'
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
