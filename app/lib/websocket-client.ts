import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { WebSocketMessage, MemoCreatePayload, MemoUpdatePayload, MemoDeletePayload, GroupJoinPayload } from '@websocket-server/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket() {
  const { user, loading } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<any, any> | null>(null);
  const [error, setError] = useState<Event | null>(null);

  const sendMessage = useCallback((message: WebSocketMessage<any, any>) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }, []);

  const joinGroup = useCallback((groupId: string) => {
    sendMessage({
      type: 'GROUP_JOIN',
      payload: { groupId } as GroupJoinPayload,
    });
  }, [sendMessage]);

  const leaveGroup = useCallback((groupId: string) => {
    sendMessage({
      type: 'GROUP_LEAVE',
      payload: { groupId } as GroupJoinPayload, // Re-use payload type
    });
  }, [sendMessage]);

  const sendMemoCreate = useCallback((memo: MemoCreatePayload) => {
    sendMessage({
      type: 'MEMO_CREATE',
      payload: memo,
      groupId: memo.groupId || undefined, // グループメモの場合のみgroupIdを設定
      senderId: user?.id, // 送信者IDを設定
    });
  }, [sendMessage, user?.id]);

  const sendMemoUpdate = useCallback((memo: MemoUpdatePayload) => {
    sendMessage({
      type: 'MEMO_UPDATE',
      payload: memo,
      groupId: memo.groupId || undefined,
      senderId: user?.id,
    });
  }, [sendMessage, user?.id]);

  const sendMemoDelete = useCallback((memo: MemoDeletePayload) => {
    sendMessage({
      type: 'MEMO_DELETE',
      payload: memo,
      groupId: memo.groupId || undefined,
      senderId: user?.id,
    });
  }, [sendMessage, user?.id]);

  useEffect(() => {
    if (loading) return; // 認証情報がロードされるまで待つ

    if (user && !ws.current) {
      // 認証済みユーザーがいる場合のみWebSocketに接続
      console.log('Attempting to connect to WebSocket...');
      const websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket connected.');
      };

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage<any, any> = JSON.parse(event.data);
          setLastMessage(message);
          console.log('Received message:', message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      websocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
      };

      websocket.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected:', event.code, event.reason);
        // 再接続ロジック
        if (event.code !== 1000 && event.code !== 1001) { // 1000: 通常終了, 1001: 離脱
          // 認証情報がある場合のみ再接続を試みる
          if (user) {
            console.log('Attempting to reconnect WebSocket in 3 seconds...');
            setTimeout(() => {
              // `ws.current`をnullにすることで、useEffectの次の実行で新しい接続を確立させる
              ws.current = null;
              // userが変更されていない場合でもuseEffectを再実行させるために、
              // 依存配列に含められたダミーの状態やカウンターを更新することもできるが、
              // ここではuserの存在のみでトリガーされることを期待する
            }, 3000);
          } else {
            console.log('User not authenticated, not attempting to reconnect.');
          }
        }
      };

      ws.current = websocket;

    } else if (!user && ws.current) {
      // ユーザーがログアウトした場合、WebSocket接続を切断
      console.log('User logged out, closing WebSocket connection.');
      ws.current.close();
      ws.current = null;
    }

    return () => {
      if (ws.current) {
        console.log('Cleaning up WebSocket connection.');
        ws.current.close();
        ws.current = null;
      }
    };
  }, [user, loading, sendMessage]); // sendMessageを依存配列に追加

  return { isConnected, lastMessage, error, sendMessage, joinGroup, leaveGroup, sendMemoCreate, sendMemoUpdate, sendMemoDelete };
}
