import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, ApiResponse } from './api';
import { validators } from './security';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  created_at?: string;
}

interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at: number;
}

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

// モックユーザーストレージ
const mockUsers: Record<string, { id: string; email: string; username: string; passwordHash: string; created_at: string }> = {}

// パスワードハッシュ化関数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// パスワード検証関数
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// セッション作成関数
function createSession(userData: any): Session {
  const now = Date.now()
  return {
    user: userData,
    access_token: `mock_jwt_${userData.id}_${now}`,
    refresh_token: `mock_refresh_${userData.id}_${now}`,
    expires_in: 3600, // 1時間
    token_type: 'bearer',
    expires_at: Math.floor((now + 3600000) / 1000) // 1時間後
  }
}

// セッション有効性チェック関数
function isSessionValid(session: Session | null): boolean {
  if (!session) return false
  const now = Date.now()
  const expiresAt = session.expires_in * 1000 // 秒をミリ秒に変換
  const sessionStart = session.user.created_at ? new Date(session.user.created_at).getTime() : now
  return (sessionStart + expiresAt) > now
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // セッション更新関数
  const refreshSession = useCallback(async () => {
    if (!session) return
    
    try {
      // モックセッション更新（実際の実装ではトークンを更新）
      const updatedSession = {
        ...session,
        access_token: `mock_token_${session.user.id}_${Date.now()}`,
        expires_at: Math.floor((Date.now() + 3600000) / 1000)
      }
      
      setSession(updatedSession)
      localStorage.setItem('notetree_session', JSON.stringify(updatedSession))
    } catch (error) {
      console.error('セッション更新エラー:', error)
    }
  }, [session])

  // 初期化時にローカルストレージからユーザーとセッションを復元
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('notetree_user')
      const savedSession = localStorage.getItem('notetree_session')
      
      if (savedUser && savedSession) {
        const userData = JSON.parse(savedUser)
        const sessionData = JSON.parse(savedSession)
        
        if (isSessionValid(sessionData)) {
          setUser(userData)
          setSession(sessionData)
        } else {
          // セッションが期限切れの場合はクリア
          localStorage.removeItem('notetree_user')
          localStorage.removeItem('notetree_session')
        }
      }
    } catch (error) {
      console.error('ユーザー情報の復元に失敗しました:', error)
      localStorage.removeItem('notetree_user')
      localStorage.removeItem('notetree_session')
    } finally {
      setLoading(false)
    }
  }, [])

  // セッション監視と自動更新
  useEffect(() => {
    if (!session) return

    const checkSession = () => {
      if (!isSessionValid(session)) {
        console.log('セッションが期限切れです')
        signOut()
      }
    }

    // 5分ごとにセッション有効性をチェック
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    
    // 初回チェック
    checkSession()
    
    return () => clearInterval(interval)
  }, [session])

  // セッション自動更新
  useEffect(() => {
    if (!session || !user) return

    const autoRefreshSession = async () => {
      try {
        // セッションが30分以内に期限切れになる場合は更新
        const now = Date.now()
        const expiresAt = session.expires_in * 1000
        const sessionStart = session.user.created_at ? new Date(session.user.created_at).getTime() : now
        const timeUntilExpiry = (sessionStart + expiresAt) - now
        
        if (timeUntilExpiry < 30 * 60 * 1000) { // 30分以内
          await refreshSession()
        }
      } catch (error) {
        console.error('セッション自動更新エラー:', error)
      }
    }

    // 10分ごとにセッション自動更新をチェック
    const refreshInterval = setInterval(autoRefreshSession, 10 * 60 * 1000)
    
    return () => clearInterval(refreshInterval)
  }, [session, user, refreshSession])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // メールアドレスを正規化
      const normalizedEmail = email.toLowerCase()
      
      // ユーザーを検索
      const userData = mockUsers[normalizedEmail]
      if (!userData) {
        return { error: { message: 'メールアドレスまたはパスワードが正しくありません' } }
      }

      // パスワードを検証
      const isValidPassword = await verifyPassword(password, userData.passwordHash)
      if (!isValidPassword) {
        return { error: { message: 'メールアドレスまたはパスワードが正しくありません' } }
      }

      // セッションを作成
      const session = createSession(userData)

      // ローカルストレージに保存
      localStorage.setItem('notetree_user', JSON.stringify(userData))
      localStorage.setItem('notetree_session', JSON.stringify(session))

      // 状態を更新
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.username,
        username: userData.username,
        created_at: userData.created_at
      })
      setSession(session)

      return { error: null }
    } catch (error: any) {
      console.error('ログインエラー:', error)
      return { error: { message: 'ログインに失敗しました' } }
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      // パスワード強度チェック
      const passwordValidation = validators.password(password);
      if (!passwordValidation.valid) {
        return { error: { message: passwordValidation.error! } };
      }

      // ユーザー名バリデーション
      const usernameValidation = validators.username(username);
      if (!usernameValidation.valid) {
        return { error: { message: usernameValidation.error! } };
      }

      // メールアドレスバリデーション
      const emailValidation = validators.email(email);
      if (!emailValidation.valid) {
        return { error: { message: emailValidation.error! } };
      }

      // 既存ユーザーチェック
      if (mockUsers[email.toLowerCase()]) {
        return { error: { message: 'このメールアドレスは既に使用されています' } };
      }

      // パスワードをハッシュ化
      const passwordHash = await hashPassword(password);

      // 新しいユーザーを作成
      const newUser = {
        id: `user_${Date.now()}`,
        email: email.toLowerCase(),
        name: username,
        username: username,
        passwordHash: passwordHash,
        created_at: new Date().toISOString()
      };

      // モックユーザーストレージに保存
      mockUsers[email.toLowerCase()] = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        passwordHash: newUser.passwordHash,
        created_at: newUser.created_at
      };

      // セッションを作成
      const session = createSession(newUser);

      // ローカルストレージに保存
      localStorage.setItem('notetree_user', JSON.stringify(newUser));
      localStorage.setItem('notetree_session', JSON.stringify(session));

      // 状態を更新
      setUser({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        created_at: newUser.created_at
      });
      setSession(session);

      return { error: null };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      return { error: { message: 'アカウント作成に失敗しました' } };
    }
  };

  const signOut = async () => {
    try {
      setUser(null)
      setSession(null)
      localStorage.removeItem('notetree_user')
      localStorage.removeItem('notetree_session')
      return { error: null }
    } catch (error: any) {
      console.error('ログアウトエラー:', error)
      return { error: { message: 'ログアウトに失敗しました' } }
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

