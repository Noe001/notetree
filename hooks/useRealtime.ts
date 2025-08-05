import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { realtimeManager, MemoRealtimeEvent, GroupMemberEvent, UserPresenceEvent } from '@/lib/realtime'

// メモのリアルタイム変更を監視するHook
export function useMemoRealtime(
  groupId: string | null,
  onMemoChange: (event: MemoRealtimeEvent) => void
) {
  const { user } = useAuth()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user) return

    // 既存の購読があれば解除
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // 新しい購読を開始
    unsubscribeRef.current = realtimeManager.subscribeMemoChanges(
      groupId,
      onMemoChange
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [groupId, user, onMemoChange])

  return {
    isConnected: !!user && !!unsubscribeRef.current
  }
}

// グループメンバーのリアルタイム変更を監視するHook
export function useGroupMembersRealtime(
  groupId: string | null,
  onMemberChange: (event: GroupMemberEvent) => void
) {
  const { user } = useAuth()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user || !groupId) return

    // 既存の購読があれば解除
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // 新しい購読を開始
    unsubscribeRef.current = realtimeManager.subscribeGroupMembers(
      groupId,
      onMemberChange
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [groupId, user, onMemberChange])

  return {
    isConnected: !!user && !!groupId && !!unsubscribeRef.current
  }
}

// ユーザープレゼンス（編集中ユーザー表示）のHook
export function useUserPresence(memoId: string | null) {
  const { user } = useAuth()
  const presenceRef = useRef<{
    updatePresence: (action: 'editing' | 'viewing', cursor?: { position: number; selection?: { start: number; end: number } }) => void
    unsubscribe: () => void
  } | null>(null)
  
  const presenceStateRef = useRef<Map<string, UserPresenceEvent>>(new Map())

  const startPresence = useCallback((
    onPresenceChange: (presences: Map<string, UserPresenceEvent>) => void
  ) => {
    if (!user || !memoId) return

    // 既存のプレゼンスがあれば解除
    if (presenceRef.current) {
      presenceRef.current.unsubscribe()
    }

    // 新しいプレゼンスを開始
    presenceRef.current = realtimeManager.subscribeUserPresence(
      memoId,
      user.id,
      (presences) => {
        presenceStateRef.current = presences
        onPresenceChange(presences)
      }
    )

    return presenceRef.current
  }, [user, memoId])

  const updatePresence = useCallback((
    action: 'editing' | 'viewing',
    cursor?: { position: number; selection?: { start: number; end: number } }
  ) => {
    if (presenceRef.current) {
      presenceRef.current.updatePresence(action, cursor)
    }
  }, [])

  const stopPresence = useCallback(() => {
    if (presenceRef.current) {
      presenceRef.current.unsubscribe()
      presenceRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopPresence()
    }
  }, [stopPresence])

  return {
    startPresence,
    updatePresence,
    stopPresence,
    currentPresences: presenceStateRef.current
  }
}

// デバウンス機能付きのリアルタイム編集Hook
export function useRealtimeEditor(
  memoId: string | null,
  onContentChange: (content: string) => void,
  debounceMs: number = 500
) {
  const { user } = useAuth()
  const { updatePresence } = useUserPresence(memoId)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')

  const handleContentChange = useCallback((content: string, cursorPosition?: number) => {
    if (!user || !memoId) return

    // プレゼンス更新（編集中の通知）
    updatePresence('editing', cursorPosition ? { position: cursorPosition } : undefined)

    // デバウンス処理
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (content !== lastContentRef.current) {
        lastContentRef.current = content
        onContentChange(content)
      }
    }, debounceMs)
  }, [user, memoId, onContentChange, debounceMs, updatePresence])

  const handleCursorChange = useCallback((cursorPosition: number, selection?: { start: number; end: number }) => {
    if (!user || !memoId) return
    
    updatePresence('editing', { position: cursorPosition, selection })
  }, [user, memoId, updatePresence])

  const switchToViewMode = useCallback(() => {
    if (!user || !memoId) return
    
    updatePresence('viewing')
  }, [user, memoId, updatePresence])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    handleContentChange,
    handleCursorChange,
    switchToViewMode
  }
} 
