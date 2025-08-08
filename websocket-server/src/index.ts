import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
import http from 'http';
import { WebSocketMessage, WebSocketEvent, AuthSuccessPayload, MemoUpdatePayload, MemoCreatePayload, MemoDeletePayload, GroupJoinPayload, ErrorPayload } from './types';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  groupIds: Set<string>; // ユーザーが参加しているグループのIDのセット
}

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001; // WebSocketサーバーのポート
const JWT_SECRET = process.env.JWT_SECRET;
// Prefer explicit API_URL; fall back to localhost for local dev (compose will set API_URL explicitly)
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocketServer({ server });

// 接続済みクライアントを管理するMap (userId -> WebSocket)
const clients = new Map<string, AuthenticatedWebSocket>();

wss.on('connection', (ws: AuthenticatedWebSocket, request: http.IncomingMessage) => {
  console.log('New client connected, attempting authentication...');
  ws.groupIds = new Set<string>(); // 初期化

  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    ws.close(1011, 'Server configuration error');
    return;
  }

  const cookieHeader = request.headers.cookie;
  let token: string | null = null;

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(s => s.trim());
    const authTokenCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
    if (authTokenCookie) {
      token = authTokenCookie.split('=')[1];
    }
  }

  if (!token) {
    console.log('No auth_token found in cookies. Closing connection.');
    ws.close(1008, 'Unauthorized: No auth_token');
    return;
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string };
    ws.userId = decoded.userId;
    clients.set(ws.userId, ws);
    console.log(`Client connected and authenticated: ${ws.userId}`);

    const authSuccessMessage: WebSocketMessage<'AUTH_SUCCESS', AuthSuccessPayload> = {
      type: 'AUTH_SUCCESS',
      payload: { userId: ws.userId },
    };
    ws.send(JSON.stringify(authSuccessMessage));

    ws.on('message', message => {
      console.log(`Received message from ${ws.userId}: ${message}`);
      try {
        const parsedMessage: WebSocketEvent = JSON.parse(message.toString());
        handleWebSocketMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        } as WebSocketMessage<'ERROR', ErrorPayload>));
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
      }
      console.log(`Client disconnected: ${ws.userId}`);
    });

    ws.on('error', error => {
      console.error(`WebSocket error for ${ws.userId}:`, error);
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });
  } catch (error) {
    console.error('JWT verification failed for WebSocket connection:', error);
    ws.close(1008, 'Unauthorized: Invalid or expired token');
  }
});

/**
 * 特定のグループにメッセージをブロードキャストする
 * @param groupId ブロードキャスト対象のグループID
 * @param message 送信するWebSocketMessageオブジェクト
 * @param excludeSenderId メッセージを送信しないユーザーのID (オプション)
 */
export function broadcastMessageToGroup(
  groupId: string,
  message: WebSocketMessage,
  excludeSenderId?: string
) {
  clients.forEach((clientWs, userId) => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.groupIds.has(groupId) && userId !== excludeSenderId) {
      clientWs.send(JSON.stringify(message));
    }
  });
}

/**
 * WebSocketメッセージを処理するハンドラ
 * @param ws 受信したWebSocket接続
 * @param message 受信したWebSocketMessage
 */
async function handleWebSocketMessage(ws: AuthenticatedWebSocket, message: WebSocketEvent) {
  if (!ws.userId) {
    console.warn('Received message from unauthenticated client.');
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Authentication required' }
    } as WebSocketMessage<'ERROR', ErrorPayload>));
    return;
  }

  switch (message.type) {
    case 'MEMO_CREATE':
    case 'MEMO_UPDATE':
    case 'MEMO_DELETE':
      // メモ関連のイベントはgroupIdが必須
      if (!message.groupId) {
        console.warn(`Memo event received without groupId from ${ws.userId}:`, message);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Group ID is required for memo operations' }
        } as WebSocketMessage<'ERROR', ErrorPayload>));
        return;
      }
      try {
        const method = message.type === 'MEMO_CREATE' ? 'POST' :
                       message.type === 'MEMO_UPDATE' ? 'PATCH' :
                       message.type === 'MEMO_DELETE' ? 'DELETE' : '';
        
        let endpoint = `/api/memos`;
        if (message.type !== 'MEMO_CREATE') {
          endpoint = `/api/memos/${(message.payload as MemoUpdatePayload | MemoDeletePayload).id}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            // WebSocket経由でのAPI呼び出しの場合、認証が必要な場合は別途考慮
            // 例えば、内部APIキーやサービスアカウントトークンなど
            'X-User-Id': ws.userId || '', // 例としてユーザーIDをヘッダーに含める
            ...(INTERNAL_API_TOKEN ? { 'X-Internal-Api-Token': INTERNAL_API_TOKEN } : {}),
          },
          body: method !== 'DELETE' ? JSON.stringify(message.payload) : undefined,
        });
        
        if (!response.ok) {
          const errorData: any = await response.json(); // 'unknown'型エラーを解決するためにanyにキャスト
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        console.log(`Successfully called backend API for ${message.type}`);
        broadcastMessageToGroup(message.groupId, message, ws.userId);
      } catch (apiError) {
        console.error(`Failed to interact with backend API for ${message.type}:`, apiError);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: `Failed to process memo operation: ${(apiError as Error).message}` }
        } as WebSocketMessage<'ERROR', ErrorPayload>));
      }
      break;
    case 'GROUP_JOIN':
      const joinPayload = message.payload as GroupJoinPayload;
      if (joinPayload.groupId) {
        ws.groupIds.add(joinPayload.groupId);
        console.log(`Client ${ws.userId} joined group ${joinPayload.groupId}. Current groups:`, Array.from(ws.groupIds));
        // 参加成功の確認メッセージなど、必要であれば実装
      } else {
        console.warn(`GROUP_JOIN event received without groupId from ${ws.userId}:`, message);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Group ID is required for joining a group' }
        } as WebSocketMessage<'ERROR', ErrorPayload>));
      }
      break;
    case 'GROUP_LEAVE':
      const leavePayload = message.payload as GroupJoinPayload; // 同じペイロード型を使用
      if (leavePayload.groupId) {
        ws.groupIds.delete(leavePayload.groupId);
        console.log(`Client ${ws.userId} left group ${leavePayload.groupId}. Current groups:`, Array.from(ws.groupIds));
      } else {
        console.warn(`GROUP_LEAVE event received without groupId from ${ws.userId}:`, message);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Group ID is required for leaving a group' }
        } as WebSocketMessage<'ERROR', ErrorPayload>));
      }
      break;
    case 'BROADCAST_MESSAGE':
      // 汎用ブロードキャストメッセージ（テスト用など）
      console.log(`Broadcasting message from ${ws.userId}: ${message.payload.text}`);
      clients.forEach((clientWs, clientId) => {
        if (clientWs.readyState === WebSocket.OPEN && clientId !== ws.userId) {
          clientWs.send(JSON.stringify(message));
        }
      });
      break;
    default:
      console.warn(`Unknown message type received from ${ws.userId}: ${message.type}`);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: `Unknown message type: ${message.type}` }
      } as WebSocketMessage<'ERROR', ErrorPayload>));
      break;
  }
}

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
