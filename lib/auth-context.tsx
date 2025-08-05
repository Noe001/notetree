import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, ApiResponse } from './api';
import { validators } from './security';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

interface Session {
  access_token: string;
  user: User;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ローカルストレージキー
const AUTH_STORAGE_KEY = 'notetree_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // セッション更新関数
  const refreshSession = useCallback(async () => {
    // ローカルストレージベースでは特別な更新処理は不要
    console.log('セッション更新（ローカルストレージベース）');
  }, []);

  // 初期化時にローカルストレージからセッションを取得
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('ローカルストレージからセッションを取得');
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          // APIサーバーにプロフィールを確認してトークンの有効性を検証
          try {
            const profileResponse = await apiClient.getProfile(authData.session.access_token);
            if (profileResponse.success && profileResponse.data) {
              const userData: User = {
                id: profileResponse.data.id,
                email: profileResponse.data.email,
                name: profileResponse.data.name,
                createdAt: profileResponse.data.createdAt
              };
              setUser(userData);
              setSession({
                access_token: authData.session.access_token,
                user: userData
              });
            } else {
              // トークンが無効な場合は削除
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } catch (error) {
            console.error('トークン検証エラー:', error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('セッション取得エラー:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      
      if (!response.success) {
        return { error: { message: response.error || 'ログインに失敗しました' } };
      }

      // APIサーバーから返されたトークンを使用
      const token = response.data.access_token;
      
      // プロフィール情報を取得
      const profileResponse = await apiClient.getProfile(token);
      if (!profileResponse.success) {
        return { error: { message: 'プロフィール取得に失敗しました' } };
      }

      const user: User = {
        id: profileResponse.data.id,
        email: profileResponse.data.email,
        name: profileResponse.data.name,
        createdAt: profileResponse.data.createdAt
      };

      const newSession: Session = {
        access_token: token,
        user: user
      };

      // ローカルストレージに保存
      const authData = {
        session: newSession,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      setUser(user);
      setSession(newSession);

      return { error: null };
    } catch (error: any) {
      console.error('ログインエラー:', error);
      return { error: { message: 'ログインに失敗しました' } };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      const response = await apiClient.register({ email, password, name: username });
      
      if (!response.success) {
        return { error: { message: response.error || 'アカウント作成に失敗しました' } };
      }

      // APIサーバーから返されたトークンを使用
      const token = response.data.access_token;
      
      // プロフィール情報を取得
      const profileResponse = await apiClient.getProfile(token);
      if (!profileResponse.success) {
        return { error: { message: 'プロフィール取得に失敗しました' } };
      }

      const user: User = {
        id: profileResponse.data.id,
        email: profileResponse.data.email,
        name: profileResponse.data.name,
        createdAt: profileResponse.data.createdAt
      };

      const newSession: Session = {
        access_token: token,
        user: user
      };

      // ローカルストレージに保存
      const authData = {
        session: newSession,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      setUser(user);
      setSession(newSession);

      return { error: null };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      return { error: { message: 'アカウント作成に失敗しました' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // ローカルストレージから削除
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error('ログアウトエラー:', error);
      return { error: { message: 'ログアウトに失敗しました' } };
    } finally {
      setLoading(false);
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
