// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ローカルストレージフォールバック機能をインポート
import { LocalMemoStorage, LocalMemo } from './local-memo-storage';

// APIレスポンスの型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

// メモの型定義
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

// メモ作成用のDTO
export interface CreateMemoDto {
  title: string;
  content: string;
  tags?: string[];
  isPrivate?: boolean;
  groupId?: string | null;
}

// メモ更新用のDTO
export interface UpdateMemoDto {
  title?: string;
  content?: string;
  tags?: string[];
  isPrivate?: boolean;
  groupId?: string | null;
}

// ユーザーの型定義
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// グループ関連の型定義（一時的な実装）
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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // メモ一覧を取得
  async getMemos(userId?: string, groupId?: string): Promise<ApiResponse<Memo[]>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (groupId) params.append('groupId', groupId);
    
    const query = params.toString();
    const endpoint = `/memos${query ? `?${query}` : ''}`;
    
    return await this.request<ApiResponse<Memo[]>>(endpoint);
  }

  // メモを作成
  async createMemo(memo: CreateMemoDto): Promise<ApiResponse<Memo>> {
    return await this.request<ApiResponse<Memo>>('/memos', {
      method: 'POST',
      body: JSON.stringify(memo),
    });
  }

  // メモを取得
  async getMemo(id: string): Promise<ApiResponse<Memo>> {
    return this.request<ApiResponse<Memo>>(`/memos/${id}`);
  }

  // メモを更新
  async updateMemo(id: string, updates: Partial<CreateMemoDto>): Promise<ApiResponse<Memo>> {
    return await this.request<ApiResponse<Memo>>(`/memos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // メモを削除
  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    return await this.request<ApiResponse<void>>(`/memos/${id}`, {
      method: 'DELETE',
    });
  }

  // メモを検索
  async searchMemos(query: string, userId?: string, groupId?: string): Promise<ApiResponse<Memo[]>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (userId) params.append('userId', userId);
    if (groupId) params.append('groupId', groupId);
    
    return this.request<ApiResponse<Memo[]>>(`/memos/search?${params.toString()}`);
  }

  // グループ関連のメソッド
  async getGroups(): Promise<ApiResponse<Group[]>> {
    return this.request<ApiResponse<Group[]>>('/groups');
  }

  async createGroup(groupData: { name: string; description?: string }): Promise<ApiResponse<Group>> {
    return this.request<ApiResponse<Group>>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<ApiResponse<Group>> {
    // 一時的にモックデータを返す
    return {
      success: true,
      data: {
        id,
        name: 'Updated Group',
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'current_user',
        members: [],
        ...updates
      }
    };
  }

  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    // 一時的にモックデータを返す
    return {
      success: true
    };
  }

  async getInvitations(): Promise<ApiResponse<Invitation[]>> {
    // 一時的にモックデータを返す
    return {
      success: true,
      data: [],
      count: 0
    };
  }

  async getGroupInvitations(groupId: string): Promise<ApiResponse<Invitation[]>> {
    // 一時的にモックデータを返す
    return {
      success: true,
      data: [],
      count: 0
    };
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    // 一時的にモックデータを返す
    return {
      success: true,
      data: [],
      count: 0
    };
  }

  async inviteMember(groupId: string, invitation: { email?: string; userId?: string; role?: 'admin' | 'member' }): Promise<ApiResponse<Invitation>> {
    // 一時的にモックデータを返す
    const mockInvitation: Invitation = {
      id: `invitation_${Date.now()}`,
      groupId,
      inviterId: 'current_user',
      inviteeEmail: invitation.email || 'test@example.com',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
    
    return {
      success: true,
      data: mockInvitation
    };
  }

  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    // 一時的にモックデータを返す
    return {
      success: true
    };
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 
