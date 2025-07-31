import { supabase } from './supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface MemoRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  memo: {
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
  private channels: Map<string, RealtimeChannel> = new Map()
  
  // メモのリアルタイム購読（一時的に無効化）
  subscribeMemoChanges(
    groupId: string | null,
    onMemoChange: (event: MemoRealtimeEvent) => void
  ): () => void {
    // 一時的に無効化
    return () => {};
    // const channelName = groupId ? `memos:group:${groupId}` : 'memos:personal'
    
    // if (this.channels.has(channelName)) {
    //   this.channels.get(channelName)?.unsubscribe()
    // }

    // const channel = supabase
    //   .channel(channelName)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'memos',
    //       filter: groupId ? `group_id=eq.${groupId}` : 'group_id=is.null'
    //     },
    //     (payload: RealtimePostgresChangesPayload<any>) => {
    //       const event: MemoRealtimeEvent = {
    //         type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
    //         memo: {
    //           id: payload.new?.id || payload.old?.id,
    //           title: payload.new?.title || payload.old?.title,
    //           content: payload.new?.content || payload.old?.content,
    //           tags: payload.new?.tags || payload.old?.tags || [],
    //           isPrivate: payload.new?.is_private || payload.old?.is_private,
    //           updatedAt: payload.new?.updated_at || payload.old?.updated_at,
    //           createdAt: payload.new?.created_at || payload.old?.created_at,
    //           userId: payload.new?.user_id || payload.old?.user_id,
    //           groupId: payload.new?.group_id || payload.old?.group_id
    //         }
    //       }
    //       onMemoChange(event)
    //     }
    //   )
    //   .subscribe()

    // this.channels.set(channelName, channel)

    // return () => {
    //   channel.unsubscribe()
    //   this.channels.delete(channelName)
    // }
  }

  // グループメンバーのリアルタイム購読（一時的に無効化）
  subscribeGroupMembers(
    groupId: string,
    onMemberChange: (event: GroupMemberEvent) => void
  ): () => void {
    // 一時的に無効化
    return () => {};
    // const channelName = `group_members:${groupId}`
    
    // if (this.channels.has(channelName)) {
    //   this.channels.get(channelName)?.unsubscribe()
    // }

    // const channel = supabase
    //   .channel(channelName)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*',
    //       schema: 'public',
    //       table: 'group_members',
    //       filter: `group_id=eq.${groupId}`
    //     },
    //     (payload: RealtimePostgresChangesPayload<any>) => {
    //       const event: GroupMemberEvent = {
    //         type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
    //         member: {
    //           id: payload.new?.id || payload.old?.id,
    //           userId: payload.new?.user_id || payload.old?.user_id,
    //           groupId: payload.new?.group_id || payload.old?.group_id,
    //           role: payload.new?.role || payload.old?.role,
    //           joinedAt: payload.new?.joined_at || payload.old?.joined_at
    //         }
    //       }
    //       onMemberChange(event)
    //     }
    //   )
    //   .subscribe()

    // this.channels.set(channelName, channel)

    // return () => {
    //   channel.unsubscribe()
    //   this.channels.delete(channelName)
    // }
  }

  // ユーザープレゼンス（誰が何を編集しているか）（一時的に無効化）
  subscribeUserPresence(
    memoId: string,
    currentUserId: string,
    onPresenceChange: (presences: Map<string, UserPresenceEvent>) => void
  ): {
    updatePresence: (action: 'editing' | 'viewing', cursor?: { position: number; selection?: { start: number; end: number } }) => void
    unsubscribe: () => void
  } {
    // 一時的に無効化
    return {
      updatePresence: () => {},
      unsubscribe: () => {}
    };
    // const channelName = `presence:memo:${memoId}`
    
    //   if (this.channels.has(channelName)) {
    //     this.channels.get(channelName)?.unsubscribe()
    //   }

    //   const presenceState = new Map<string, UserPresenceEvent>()

    //   const channel = supabase
    //     .channel(channelName)
    //     .on('presence', { event: 'sync' }, () => {
    //       const state = channel.presenceState()
    //       presenceState.clear()
        
    //       Object.entries(state).forEach(([userId, presences]) => {
    //         const latestPresence = (presences as any[])[0] as UserPresenceEvent
    //         if (latestPresence && userId !== currentUserId) {
    //           presenceState.set(userId, latestPresence)
    //         }
    //       })
        
    //       onPresenceChange(new Map(presenceState))
    //     })
    //     .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    //       if (key !== currentUserId) {
    //         const presence = (newPresences as any[])[0] as UserPresenceEvent
    //         presenceState.set(key, presence)
    //         onPresenceChange(new Map(presenceState))
    //       }
    //     })
    //     .on('presence', { event: 'leave' }, ({ key }) => {
    //       if (key !== currentUserId) {
    //         presenceState.delete(key)
    //         onPresenceChange(new Map(presenceState))
    //       }
    //     })
    //     .subscribe()

    //   this.channels.set(channelName, channel)

    //   const updatePresence = (
    //     action: 'editing' | 'viewing', 
    //     cursor?: { position: number; selection?: { start: number; end: number } }
    //   ) => {
    //     const presenceData: UserPresenceEvent = {
    //       userId: currentUserId,
    //       memoId,
    //       action,
    //       timestamp: new Date().toISOString(),
    //       cursor
    //     }
      
    //     channel.track(presenceData)
    //   }

    //   const unsubscribe = () => {
    //     // 離脱を通知
    //     channel.track({
    //       userId: currentUserId,
    //       memoId,
    //       action: 'left' as const,
    //       timestamp: new Date().toISOString()
    //     })
      
    //     setTimeout(() => {
    //       channel.unsubscribe()
    //       this.channels.delete(channelName)
    //     }, 100)
    //   }

    //   return { updatePresence, unsubscribe }
  }

  // 全チャンネルの購読解除
  unsubscribeAll(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }
}

// シングルトンインスタンス
export const realtimeManager = new RealtimeManager() 
