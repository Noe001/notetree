'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { apiClient, ApiResponse } from './api';
import { validators } from './security';

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Session {
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
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        console.log('fetchUser: response.ok:', response.ok, 'data.user:', data.data);
        const fetchedUser: User = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name || '',
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt || new Date().toISOString(),
        };
        setUser(fetchedUser);
        setSession({ user: fetchedUser });
      } else {
        console.log('fetchUser: response.ok:', response.ok, 'data:', data, 'Setting user/session to null.');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error fetching user session:', error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signInWithEmail = async (email: string, password: string) => {
    const { valid: emailValid, error: emailError } = validators.email(email);
    const { valid: passwordValid, error: passwordError } = validators.password(password);
    
    if (!emailValid) {
      return { error: { message: emailError || '無効なメールアドレスです' } };
    }
    if (!passwordValid) {
      return { error: { message: passwordError || '無効なパスワードです' } };
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('signInWithEmail failed:', { status: response.status, data });
        return { error: { message: data.error || 'ログインに失敗しました' } };
      }

      // ログイン成功後、ユーザー情報を再フェッチ
      await fetchUser();
      return { error: null };
    } catch (error: any) {
      console.error('ログインエラー:', error);
      return { error: { message: error.message || 'ログインに失敗しました' } };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { valid: emailValid, error: emailError } = validators.email(email);
    const { valid: passwordValid, error: passwordError } = validators.password(password);
    // const { valid: nameValid, error: nameError } = validators.name(name); // nameバリデーションは一旦削除
    
    if (!emailValid) {
      return { error: { message: emailError || '無効なメールアドレスです' } };
    }
    if (!passwordValid) {
      return { error: { message: passwordError || '無効なパスワードです' } };
    }
    // if (!nameValid) {
    //   return { error: { message: nameError || '無効なユーザー名です' } };
    // }
    
    try {
      setLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('signUpWithEmail failed:', { status: response.status, data });
        return { error: { message: data.error || 'アカウント作成に失敗しました' } };
      }

      // サインアップ成功後、ユーザー情報を再フェッチ
      await fetchUser();
      return { error: null };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      return { error: { message: error.message || 'アカウント作成に失敗しました' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.error || 'ログアウトに失敗しました' } };
      }

      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      return { error: { message: error.message || 'ログアウトに失敗しました' } };
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
    refreshSession: fetchUser, // refreshSessionをfetchUserにマッピング
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
