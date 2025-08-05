import { useAuth } from './auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface Group {
  id: string
  name: string
  description: string
  isPrivate: boolean
  memberCount: number
  createdAt: string
  updatedAt: string
  ownerId: string
}

export interface GroupMember {
  id: string
  userId: string
  groupId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    profileImageUrl?: string
  }
}

export interface CreateGroupDto {
  name: string
  description: string
  isPrivate: boolean
}

export interface UpdateGroupDto {
  name?: string
  description?: string
  isPrivate?: boolean
}

export interface InviteMemberDto {
  email: string
  role: 'admin' | 'member'
}

class GroupApiClient {
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

  // グループ一覧取得
  async getGroups(): Promise<ApiResponse<Group[]>> {
    return this.request<Group[]>('/groups')
  }

  // グループ詳細取得
  async getGroup(id: string): Promise<ApiResponse<Group>> {
    return this.request<Group>(`/groups/${id}`)
  }

  // グループ作成
  async createGroup(data: CreateGroupDto): Promise<ApiResponse<Group>> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // グループ更新
  async updateGroup(id: string, data: UpdateGroupDto): Promise<ApiResponse<Group>> {
    return this.request<Group>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // グループ削除
  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/groups/${id}`, {
      method: 'DELETE'
    })
  }

  // グループメンバー一覧取得
  async getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    return this.request<GroupMember[]>(`/groups/${groupId}/members`)
  }

  // メンバー招待
  async inviteMember(groupId: string, data: InviteMemberDto): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // メンバー削除
  async removeMember(groupId: string, userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE'
    })
  }

  // メンバー権限更新
  async updateMemberRole(
    groupId: string, 
    userId: string, 
    role: 'admin' | 'member'
  ): Promise<ApiResponse<GroupMember>> {
    return this.request<GroupMember>(`/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    })
  }

  // 招待受諾
  async acceptInvitation(token: string): Promise<ApiResponse<Group>> {
    return this.request<Group>(`/invitations/accept?token=${token}`, {
      method: 'GET'
    });
  }

  // 招待拒否
  async rejectInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/invitations/reject?token=${token}`, {
      method: 'POST'
    })
  }

  // グループ参加
  async joinGroup(groupId: string, invitationToken?: string): Promise<ApiResponse<GroupMember>> {
    return this.request<GroupMember>(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ invitationToken })
    })
  }

  // グループ退会
  async leaveGroup(groupId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/groups/${groupId}/leave`, {
      method: 'POST'
    })
  }
}

export const groupApiClient = new GroupApiClient('http://localhost:3001');

// React Hook for Group Management
export function useGroupApi() {
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
    const originalRequest = groupApiClient['request']
    groupApiClient['request'] = async function<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
      return originalRequest.call(this, endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      }) as Promise<ApiResponse<T>>
    }

    return apiCall()
  }

  return {
    // グループ操作
    getGroups: () => withAuth(() => groupApiClient.getGroups()),
    getGroup: (id: string) => withAuth(() => groupApiClient.getGroup(id)),
    createGroup: (data: CreateGroupDto) => withAuth(() => groupApiClient.createGroup(data)),
    updateGroup: (id: string, data: UpdateGroupDto) => withAuth(() => groupApiClient.updateGroup(id, data)),
    deleteGroup: (id: string) => withAuth(() => groupApiClient.deleteGroup(id)),

    // メンバー操作
    getGroupMembers: (groupId: string) => withAuth(() => groupApiClient.getGroupMembers(groupId)),
    inviteMember: (groupId: string, data: InviteMemberDto) => withAuth(() => groupApiClient.inviteMember(groupId, data)),
    removeMember: (groupId: string, userId: string) => withAuth(() => groupApiClient.removeMember(groupId, userId)),
    updateMemberRole: (groupId: string, userId: string, role: 'admin' | 'member') => 
      withAuth(() => groupApiClient.updateMemberRole(groupId, userId, role)),

    // 招待・参加操作
    acceptInvitation: (token: string) => withAuth(() => groupApiClient.acceptInvitation(token)),
    rejectInvitation: (token: string) => withAuth(() => groupApiClient.rejectInvitation(token)),
    joinGroup: (groupId: string, invitationToken?: string) => withAuth(() => groupApiClient.joinGroup(groupId, invitationToken)),
    leaveGroup: (groupId: string) => withAuth(() => groupApiClient.leaveGroup(groupId)),

    // ユーザー情報
    currentUser: user,
    isAuthenticated: !!user
  }
}
