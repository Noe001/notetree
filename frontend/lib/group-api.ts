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
  role: 'owner' | 'admin' | 'editor' | 'viewer'
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
  role: 'admin' | 'editor' | 'viewer'
}

class GroupApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
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
    role: 'admin' | 'editor' | 'viewer'
  ): Promise<ApiResponse<GroupMember>> {
    return this.request<GroupMember>(`/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    })
  }

  // 招待受諾
  async acceptInvitation(token: string): Promise<ApiResponse<Group>> {
    return this.request<Group>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }

  // 招待拒否
  async rejectInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request<void>('/groups/reject', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }

  // グループ退会
  async leaveGroup(groupId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/groups/${groupId}/leave`, {
      method: 'POST'
    })
  }
}

export const groupApiClient = new GroupApiClient()

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
    groupApiClient['request'] = async function<T>(endpoint: string, options: RequestInit = {}) {
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
    updateMemberRole: (groupId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => 
      withAuth(() => groupApiClient.updateMemberRole(groupId, userId, role)),

    // 招待・参加操作
    acceptInvitation: (token: string) => withAuth(() => groupApiClient.acceptInvitation(token)),
    rejectInvitation: (token: string) => withAuth(() => groupApiClient.rejectInvitation(token)),
    leaveGroup: (groupId: string) => withAuth(() => groupApiClient.leaveGroup(groupId)),

    // ユーザー情報
    currentUser: user,
    isAuthenticated: !!user
  }
} 
