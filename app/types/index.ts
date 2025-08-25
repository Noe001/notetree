export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMemberUser {
  id: string;
  email: string;
  name: string | null;
}

export type GroupMemberRole = 'admin' | 'owner' | 'editor' | 'viewer';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt?: string;
  user: GroupMemberUser;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  members: GroupMember[];
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPrivate: boolean;
  authorId: string;
  groupId: string | null;
  tags: string[];
}

export interface CreateMemoDto {
  title: string;
  content: string;
  isPrivate: boolean;
  groupId: string | null;
  tags?: string[];
}

export interface UpdateMemoDto {
  title?: string;
  content?: string;
  isPrivate?: boolean;
  groupId?: string | null;
  tags?: string[];
}

export interface Invitation {
  id: string;
  groupId: string;
  inviterId?: string;
  inviteeEmail?: string;
  email?: string; // for compatibility
  status?: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
}

export interface SearchResult extends Memo {
  score: number;
}

export interface RealtimeMessage {
  type: 'memo_update' | 'memo_create' | 'group_chat';
  payload: unknown;
  senderId: string;
  groupId?: string;
}

export interface RealtimeMemoPayload {
  memoId: string;
  content: string;
  updatedAt: string; // ISO string
}

export interface RealtimeGroupChatPayload {
  groupId: string;
  senderName: string;
  message: string;
  timestamp: string; // ISO string
}
