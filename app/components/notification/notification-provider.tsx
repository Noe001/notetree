'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setNotifyHandler, AppNotificationType } from '@/lib/notify'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  autoClose?: boolean
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // 自動削除
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Register global notify handler for non-React modules
  useEffect(() => {
    const handler = (
      type: AppNotificationType,
      title: string,
      message?: string,
      options?: { duration?: number; autoClose?: boolean; action?: { label: string; onClick: () => void } }
    ) => {
      addNotification({
        type,
        title,
        message,
        duration: options?.duration,
        autoClose: options?.autoClose,
        action: options?.action
      })
    }
    setNotifyHandler(handler)
    return () => setNotifyHandler(null)
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-l-green-500'
      case 'error': return 'border-l-red-500'
      case 'warning': return 'border-l-yellow-500'
      case 'info':
      default: return 'border-l-blue-500'
    }
  }

  return (
    <div className={`bg-background border border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 min-w-[300px] animate-in slide-in-from-right`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => onRemove(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {notification.message && (
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          )}
          {notification.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// リアルタイム通知用のヘルパーフック
export function useRealtimeNotifications() {
  const { addNotification } = useNotifications()

  const notifyMemoCreated = useCallback((userName: string, memoTitle: string) => {
    addNotification({
      type: 'info',
      title: '新しいメモが作成されました',
      message: `${userName}さんが「${memoTitle}」を作成しました`,
      autoClose: true,
      duration: 4000
    })
  }, [addNotification])

  const notifyMemoUpdated = useCallback((userName: string, memoTitle: string) => {
    addNotification({
      type: 'info',
      title: 'メモが更新されました',
      message: `${userName}さんが「${memoTitle}」を更新しました`,
      autoClose: true,
      duration: 3000
    })
  }, [addNotification])

  const notifyMemoDeleted = useCallback((userName: string, memoTitle: string) => {
    addNotification({
      type: 'warning',
      title: 'メモが削除されました',
      message: `${userName}さんが「${memoTitle}」を削除しました`,
      autoClose: true,
      duration: 4000
    })
  }, [addNotification])

  const notifyUserJoined = useCallback((userName: string) => {
    addNotification({
      type: 'success',
      title: 'ユーザーが参加しました',
      message: `${userName}さんがメモの編集に参加しました`,
      autoClose: true,
      duration: 3000
    })
  }, [addNotification])

  const notifyUserLeft = useCallback((userName: string) => {
    addNotification({
      type: 'info',
      title: 'ユーザーが離脱しました',
      message: `${userName}さんがメモの編集から離脱しました`,
      autoClose: true,
      duration: 3000
    })
  }, [addNotification])

  const notifyError = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: false
    })
  }, [addNotification])

  const notifySuccess = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 3000
    })
  }, [addNotification])

  return {
    notifyMemoCreated,
    notifyMemoUpdated,
    notifyMemoDeleted,
    notifyUserJoined,
    notifyUserLeft,
    notifyError,
    notifySuccess
  }
}

// アプリ全体で使う汎用的な通知ヘルパー
export function useAppNotifications() {
  const { addNotification } = useNotifications()

  const success = useCallback(
    (
      title: string,
      message?: string,
      options?: { duration?: number; action?: { label: string; onClick: () => void } }
    ) => {
      addNotification({
        type: 'success',
        title,
        message,
        autoClose: true,
        duration: options?.duration ?? 3000,
        action: options?.action
      })
    },
    [addNotification]
  )

  const error = useCallback(
    (
      title: string,
      message?: string,
      options?: { autoClose?: boolean; duration?: number; action?: { label: string; onClick: () => void } }
    ) => {
      addNotification({
        type: 'error',
        title,
        message,
        autoClose: options?.autoClose ?? false,
        duration: options?.duration ?? 5000,
        action: options?.action
      })
    },
    [addNotification]
  )

  const info = useCallback(
    (
      title: string,
      message?: string,
      options?: { duration?: number; action?: { label: string; onClick: () => void } }
    ) => {
      addNotification({
        type: 'info',
        title,
        message,
        autoClose: true,
        duration: options?.duration ?? 3000,
        action: options?.action
      })
    },
    [addNotification]
  )

  const warning = useCallback(
    (
      title: string,
      message?: string,
      options?: { duration?: number; action?: { label: string; onClick: () => void } }
    ) => {
      addNotification({
        type: 'warning',
        title,
        message,
        autoClose: true,
        duration: options?.duration ?? 4000,
        action: options?.action
      })
    },
    [addNotification]
  )

  return { success, error, info, warning }
}
