import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, ApiResponse } from './api';
import { validators } from './security';
import { supabase, AuthUser, AuthSession } from './supabase';

// Types
type User = AuthUser;
type Session = AuthSession;

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  // セッション更新関数
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('セッション更新エラー:', error);
        return;
      }

      if (data.session) {
        setSession(data.session as AuthSession);
      }
    } catch (error) {
      console.error('セッション更新エラー:', error);
    }
  }, [])

  // 初期化時にSupabaseのセッションを取得
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Debug - Getting session from Supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('セッション取得エラー:', error);
        } else if (session) {
          console.log('Debug - Session found', session);
          setUser(session.user as AuthUser);
          setSession(session as AuthSession);
        } else {
          console.log('Debug - No session found');
        }
      } catch (error) {
        console.error('セッション取得エラー:', error);
      } finally {
        console.log('Debug - Finished getting session');
        setLoading(false);
      }
    };

    initializeAuth();
    
    // セッション状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Debug - Auth state changed', { _event, session });
      if (session) {
        setUser(session.user as AuthUser);
        setSession(session as AuthSession);
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // セッション監視と自動更新
  useEffect(() => {
    console.log('Debug - Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Debug - Auth state changed', { event, session });
        if (session) {
          setUser(session.user as AuthUser);
          setSession(session as AuthSession);
        } else {
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      console.log('Debug - Removing auth state change listener');
      subscription.unsubscribe();
    };
  }, []);


  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('ログインエラー:', error);
        return { error: { message: error.message } };
      }

      if (data.user) {
        setUser(data.user as AuthUser);
        setSession(data.session as AuthSession);
      }

      return { error: null };
    } catch (error: any) {
      console.error('ログインエラー:', error);
      return { error: { message: 'ログインに失敗しました' } };
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: username,
          },
        },
      });

      if (error) {
        console.error('サインアップエラー:', error);
        return { error: { message: error.message } };
      }

      if (data.user) {
        setUser(data.user as AuthUser);
        setSession(data.session as AuthSession);
      }

      return { error: null };
    } catch (error: any) {
      console.error('サインアップエラー:', error);
      return { error: { message: 'アカウント作成に失敗しました' } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ログアウトエラー:', error);
        return { error: { message: error.message } };
      }

      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      return { error: { message: 'ログアウトに失敗しました' } };
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
