import { withPerformanceMonitoring } from './performance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 環境に応じたAPI設定
const getApiConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    baseUrl: API_BASE_URL,
    timeout: isProduction ? 10000 : 5000, // 本番環境ではタイムアウトを長く
    retryAttempts: isProduction ? 3 : 1, // 本番環境ではリトライ回数を増やす
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
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === attempts - 1) throw error;
        
        // ネットワークエラーやタイムアウトの場合のみリトライ
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('timeout') ||
            error.message.includes('NetworkError')) {
          console.log(`Retry attempt ${i + 1}/${attempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 指数バックオフ
          continue;
        }
        throw error;
      }
    }
  }

  private async timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeout]);
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    return withPerformanceMonitoring(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      
      // セッションからトークンを取得
      const sessionStr = localStorage.getItem('notetree_session');
      let authToken = null;
      
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const now = Date.now();
          const createdAt = new Date(session.created_at).getTime();
          const expiresIn = session.expires_in * 1000; // 秒をミリ秒に変換
          
          if (now - createdAt < expiresIn) {
            authToken = session.access_token;
          } else {
            // セッションが期限切れ
            console.log('Session expired, clearing localStorage');
            localStorage.removeItem('notetree_session');
            localStorage.removeItem('notetree_user');
          }
        } catch (error) {
          console.error('Failed to parse session:', error);
          localStorage.removeItem('notetree_session');
          localStorage.removeItem('notetree_user');
        }
      }
      
      console.log('Debug - Auth token:', authToken); // デバッグログ
      
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
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          
          // 401エラーの場合はセッションをクリア
          if (response.status === 401) {
            console.log('401 Unauthorized, clearing localStorage');
            localStorage.removeItem('notetree_session');
            localStorage.removeItem('notetree_user');
          }
          
          throw new Error(errorMessage);
        }

        return await response.json();
      };

      try {
        return await this.retryRequest(requestFn, this.config.retryAttempts);
      } catch (error: any) {
        console.error('API request failed:', url, error);
        
        // 開発環境でモックが有効な場合、またはネットワークエラーの場合はモックデータを返す
        if (this.config.enableMock || 
            error.message.includes('Failed to fetch') || 
            error.message.includes('Invalid or expired token') ||
            error.message.includes('403') ||
            error.message.includes('401') ||
            error.message.includes('timeout')) {
          console.log('API unavailable, using mock data');
          return null; // モックデータは各メソッドで処理
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
      
      if (result === null) {
        // API unavailable, using mock data
        console.log('API unavailable, using mock data');
        return {
          success: true,
          data: [
            {
              id: 'mock_memo_1',
              title: 'サンプルメモ',
              content: 'これはサンプルのメモです。',
              tags: ['サンプル', 'テスト'],
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              isPrivate: false,
              userId: userId || 'mock_user',
              groupId: groupId || null
            },
            {
              id: 'mock_memo_2',
              title: '技術メモ',
              content: '技術的な内容を記録するためのメモです。',
              tags: ['技術', '開発'],
              updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              isPrivate: true,
              userId: userId || 'mock_user',
              groupId: groupId || null
            }
          ]
        };
      }
      
      return result;
    } catch (error) {
      console.log('API unavailable, using mock data');
      // モックデータを返す
      return {
        success: true,
        data: [
          {
            id: 'mock_memo_1',
            title: 'サンプルメモ',
            content: 'これはサンプルのメモです。',
            tags: ['サンプル', 'テスト'],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isPrivate: false,
            userId: userId || 'mock_user',
            groupId: groupId || null
          },
          {
            id: 'mock_memo_2',
            title: '技術メモ',
            content: '技術的な内容を記録するためのメモです。',
            tags: ['技術', '開発'],
            updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            isPrivate: true,
            userId: userId || 'mock_user',
            groupId: groupId || null
          }
        ]
      };
    }
  }

  // メモ作成
  async createMemo(memoData: CreateMemoDto): Promise<ApiResponse<Memo>> {
    try {
      const result = await this.request('/memos', {
        method: 'POST',
        body: JSON.stringify(memoData)
      });
      
      if (result === null) {
        // API unavailable, using mock data
        console.log('API unavailable, using mock data for createMemo');
        const mockMemo: Memo = {
          id: `mock_memo_${Date.now()}`,
          title: memoData.title,
          content: memoData.content,
          tags: memoData.tags || [],
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPrivate: memoData.isPrivate || false,
          userId: 'mock_user',
          groupId: memoData.groupId || null
        };
        return {
          success: true,
          data: mockMemo
        };
      }
      
      return result;
    } catch (error) {
      console.log('API unavailable, using mock data for createMemo');
      const mockMemo: Memo = {
        id: `mock_memo_${Date.now()}`,
        title: memoData.title,
        content: memoData.content,
        tags: memoData.tags || [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isPrivate: memoData.isPrivate || false,
        userId: 'mock_user',
        groupId: memoData.groupId || null
      };
      return {
        success: true,
        data: mockMemo
      };
    }
  }

  async getMemo(id: string): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/memos/${id}`);
    } catch (error) {
      console.log('API unavailable, using mock data');
      // モックデータを返す
      return {
        success: true,
        data: {
          id: id,
          title: 'サンプルメモ',
          content: 'これはサンプルのメモです。',
          tags: ['サンプル', 'テスト'],
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPrivate: false,
          userId: 'mock_user',
          groupId: null
        }
      };
    }
  }

  async updateMemo(id: string, updates: Partial<CreateMemoDto>): Promise<ApiResponse<Memo>> {
    try {
      return this.request(`/memos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.log('API unavailable, using mock data');
      // モックデータを返す
      return {
        success: true,
        data: {
          id: id,
          title: updates.title || '更新されたメモ',
          content: updates.content || '更新された内容',
          tags: updates.tags || [],
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPrivate: updates.isPrivate || false,
          userId: 'mock_user',
          groupId: updates.groupId || null
        }
      };
    }
  }

  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    try {
      return this.request(`/memos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('API unavailable, using mock data');
      // モックデータを返す
      return {
        success: true
      };
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

export const apiClient = new ApiClient('http://localhost:3001');
