import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'notetree-web'
    }
  },
  realtime: {
    // WebSocketエラーを防ぐために無効化
    params: {
      eventsPerSecond: 10
    }
  }
})

// 認証用の型定義
export interface AuthUser {
  id: string
  email: string
  created_at?: string
  user_metadata: {
    name?: string
    display_name?: string
    avatar_url?: string
    provider?: string
  }
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  user: AuthUser
} 
 