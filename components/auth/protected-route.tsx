import React, { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthForm } from './auth-form'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading, session } = useAuth()

  // セッション切れ時の自動リダイレクト
  useEffect(() => {
    if (!loading && !user && session === null) {
      // セッションが切れている場合は認証情報をクリア
      localStorage.removeItem('notetree_user')
      localStorage.removeItem('notetree_session')
    }
  }, [user, loading, session])

  // ローディング中は読み込み画面を表示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 認証されていない場合
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    // 直接認証フォームを表示
    return <AuthForm />
  }

  // 認証されている場合は子コンポーネントを表示
  return <>{children}</>
} 
