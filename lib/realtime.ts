import { getWebSocketClient } from './websocket'
import type { Memo } from './api'

export interface MemoRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'memo_created' | 'memo_updated' | 'memo_deleted'
  memo?: {
    id: string
    title: string
    content: string
    tags: string[]
    isPrivate: boolean
    updatedAt: string
    createdAt: string
    userId: string
    groupId?: string
  }
  data?: any
}

export interface GroupMemberEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  member: {
    id: string
    userId: string
    groupId: string
    role: string
    joinedAt: string
  }
}

export interface UserPresenceEvent {
  userId: string
  memoId?: string
  action: 'editing' | 'viewing' | 'left'
  timestamp: string
  cursor?: {
    position: number
    selection?: { start: number; end: number }
  }
}

export class RealtimeManager {
  private listeners: Map<string, Function[]> = new Map()
  private wsClient = getWebSocketClient()

  constructor() {
    // WebSocketメッセージのリスナーを設定
    this.wsClient.on('message', (data: any) => {
      this.handleWebSocketMessage(data)
    })
  }

  private handleWebSocketMessage(data: any) {
    console.log('🔄 リアルタイムメッセージ受信:', data)
    
    switch (data.type) {
      case 'memo_created':
      case 'memo_updated':
      case 'memo_deleted':
        this.emit('memo_change', {
          type: data.type,
          memo: data.data,
          data: data.data
        })
        break
      case 'broadcast':
        // 他のセッションからのブロードキャストメッセージ
        this.handleWebSocketMessage(data.data)
        break
      default:
        // 他のリアルタイムイベント
        this.emit('message', data)
    }
  }

  // メモのリアルタイム購読
  subscribeMemoChanges(
    groupId: string | null,
    onMemoChange: (event: MemoRealtimeEvent) => void
  ): () => void {
    const listener = (event: MemoRealtimeEvent) => {
      // グループフィルタリング（必要に応じて）
      if (event.memo || event.data) {
        const memo = event.memo || event.data
        if (groupId && memo.groupId !== groupId) {
          return // グループが一致しない場合は無視
        }
        if (!groupId && memo.groupId) {
          return // 個人メモのみを対象とする場合、グループメモは無視
        }
        onMemoChange(event)
      }
    }

    this.on('memo_change', listener)
    
    return () => {
      this.off('memo_change', listener)
    }
  }

  // グループメンバーのリアルタイム購読
  subscribeGroupMembers(
    groupId: string,
    onMemberChange: (event: GroupMemberEvent) => void
  ): () => void {
    // 現在はグループメンバーのリアルタイム更新は実装しない
    // 必要に応じてWebSocketメッセージを追加
    return () => {}
  }

  // ユーザープレゼンス（誰が何を編集しているか）
  subscribeUserPresence(
    memoId: string,
    currentUserId: string,
    onPresenceChange: (presences: Map<string, UserPresenceEvent>) => void
  ): {
    updatePresence: (action: 'editing' | 'viewing', cursor?: { position: number; selection?: { start: number; end: number } }) => void
    unsubscribe: () => void
  } {
    // 現在はユーザープレゼンスは実装しない
    // 必要に応じてWebSocketメッセージを追加
    return {
      updatePresence: () => {},
      unsubscribe: () => {}
    }
  }

  // 全チャンネルの購読解除
  unsubscribeAll(): void {
    this.listeners.clear()
  }

  // イベントリスナーの追加
  private on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  // イベントリスナーの削除
  private off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // イベントの発火
  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // ハートビートを送信して接続を維持
  sendHeartbeat() {
    this.wsClient.send({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })
  }
}

// シングルトンインスタンス
export const realtimeManager = new RealtimeManager()
