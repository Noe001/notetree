// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  tags: string[];
  isPrivate: boolean;
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
    
    return this.request<ApiResponse<Memo[]>>(endpoint);
  }

  // メモを作成
  async createMemo(memo: CreateMemoDto): Promise<ApiResponse<Memo>> {
    return this.request<ApiResponse<Memo>>('/memos', {
      method: 'POST',
      body: JSON.stringify(memo),
    });
  }

  // メモを取得
  async getMemo(id: string): Promise<ApiResponse<Memo>> {
    return this.request<ApiResponse<Memo>>(`/memos/${id}`);
  }

  // メモを更新
  async updateMemo(id: string, memo: UpdateMemoDto): Promise<ApiResponse<Memo>> {
    return this.request<ApiResponse<Memo>>(`/memos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(memo),
    });
  }

  // メモを削除
  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/memos/${id}`, {
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
}

export const apiClient = new ApiClient(API_BASE_URL); 
