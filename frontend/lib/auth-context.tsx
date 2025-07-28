import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ローカルストレージから認証情報を復元
    const storedUser = localStorage.getItem('auth_user')
    const storedSession = localStorage.getItem('auth_session')
    
    if (storedUser && storedSession) {
      try {
        setUser(JSON.parse(storedUser))
        setSession(JSON.parse(storedSession))
      } catch (error) {
        console.error('認証情報の復元に失敗しました:', error)
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_session')
      }
    }
    
    setLoading(false)
  }, [])

  const signInWithGoogle = async () => {
    try {
      // 一時的な実装：Google認証のモック
      const mockGoogleUser = {
        id: `google_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: 'demo.google@example.com',
        user_metadata: {
          name: 'Google Demo User',
          display_name: 'Google Demo User',
          avatar_url: 'https://via.placeholder.com/150/4285f4/ffffff?text=G',
          provider: 'google'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User

      const mockSession = {
        access_token: 'mock_google_access_token',
        refresh_token: 'mock_google_refresh_token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockGoogleUser,
      } as Session

      setUser(mockGoogleUser)
      setSession(mockSession)
      
      localStorage.setItem('auth_user', JSON.stringify(mockGoogleUser))
      localStorage.setItem('auth_session', JSON.stringify(mockSession))
      
      return { error: null }
    } catch (error: any) {
      console.error('Googleログインエラー:', error)
      return { error: { message: 'Googleログインに失敗しました' } as AuthError }
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // 一時的な実装：ローカルストレージベースの認証
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
      const user = storedUsers.find((u: any) => u.email === email && u.password === password)
      
      if (user) {
        const mockUser = {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: user.username,
            display_name: user.username,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        } as User

        const mockSession = {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: mockUser,
        } as Session

        setUser(mockUser)
        setSession(mockSession)
        
        localStorage.setItem('auth_user', JSON.stringify(mockUser))
        localStorage.setItem('auth_session', JSON.stringify(mockSession))
        
        return { error: null }
      } else {
        return { error: { message: 'メールアドレスまたはパスワードが正しくありません' } as AuthError }
      }
    } catch (error: any) {
      console.error('ログインエラー:', error)
      return { error: { message: 'ログインに失敗しました' } as AuthError }
    }
  }

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      // 一時的な実装：ローカルストレージベースの認証
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
      
      // 既存ユーザーチェック
      if (storedUsers.find((u: any) => u.email === email)) {
        return { error: { message: 'このメールアドレスは既に登録されています' } as AuthError }
      }

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password, // 実際の実装では暗号化が必要
        username,
        created_at: new Date().toISOString(),
      }

      storedUsers.push(newUser)
      localStorage.setItem('registered_users', JSON.stringify(storedUsers))

      const mockUser = {
        id: newUser.id,
        email: newUser.email,
        user_metadata: {
          name: newUser.username,
          display_name: newUser.username,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: newUser.created_at,
        updated_at: new Date().toISOString(),
      } as User

      const mockSession = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      localStorage.setItem('auth_session', JSON.stringify(mockSession))

      return { error: null }
    } catch (error: any) {
      console.error('サインアップエラー:', error)
      return { error: { message: 'アカウント作成に失敗しました' } as AuthError }
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      setSession(null)
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_session')
      return { error: null }
    } catch (error: any) {
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
 