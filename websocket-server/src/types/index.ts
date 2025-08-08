export interface WebSocketMessage<T extends string = string, P = any> {
  type: T;
  payload: P;
  senderId?: string;
  groupId?: string;
}

export interface AuthSuccessPayload {
  userId: string;
}

export interface MemoUpdatePayload {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  authorId: string;
  groupId?: string | null;
}

export interface MemoCreatePayload extends MemoUpdatePayload {}

export interface MemoDeletePayload {
  id: string;
  groupId?: string | null;
}

export interface GroupJoinPayload {
  groupId: string;
}

export interface GroupLeavePayload {
  groupId: string;
}

export interface ErrorPayload {
  message: string;
  code?: number;
}

// Add more specific event types as needed
export type WebSocketEvent = 
  | WebSocketMessage<'AUTH_SUCCESS', AuthSuccessPayload>
  | WebSocketMessage<'MEMO_UPDATE', MemoUpdatePayload>
  | WebSocketMessage<'MEMO_CREATE', MemoCreatePayload>
  | WebSocketMessage<'MEMO_DELETE', MemoDeletePayload>
  | WebSocketMessage<'GROUP_JOIN', GroupJoinPayload>
  | WebSocketMessage<'GROUP_LEAVE', GroupLeavePayload>
  | WebSocketMessage<'ERROR', ErrorPayload>
  | WebSocketMessage<'BROADCAST_MESSAGE', { text: string }>;

