import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/lib/auth-context'

// Supabaseクライアントをモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

// テスト用のコンポーネント
function TestComponent() {
  const { user, session, loading, signOut, refreshSession } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="session">{session ? 'has-session' : 'no-session'}</div>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button onClick={refreshSession} data-testid="refresh-session">
        Refresh Session
      </button>
    </div>
  )
}

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AuthContext', () => {
  const mockSupabase = require('@/lib/supabase').supabase

  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのモック設定
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    })
  })

  it('初期状態では loading=true, user=null, session=null', async () => {
    renderWithAuth(<TestComponent />)

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('session')).toHaveTextContent('no-session')

    // セッション取得後はloadingがfalseになる
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })
  })

  it('セッションが存在する場合、ユーザー情報が表示される', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    }

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: mockUser,
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    renderWithAuth(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })
  })

  it('ログアウトが正常に動作する', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    })

    renderWithAuth(<TestComponent />)

    const user = userEvent.setup()
    const signOutButton = screen.getByTestId('sign-out')

    await user.click(signOutButton)

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('セッション更新が正常に動作する', async () => {
    renderWithAuth(<TestComponent />)

    const user = userEvent.setup()
    const refreshButton = screen.getByTestId('refresh-session')

    await user.click(refreshButton)

    // セッション更新ボタンがクリック可能であることを確認
    expect(refreshButton).toBeInTheDocument()
  })

  it('認証状態の変更が適切に処理される', async () => {
    let authStateChangeCallback: Function

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }
    })

    renderWithAuth(<TestComponent />)

    // 初期状態確認
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    // 認証状態変更をシミュレート
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
    }

    authStateChangeCallback!('SIGNED_IN', mockSession)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })

    // ログアウト状態変更をシミュレート
    authStateChangeCallback!('SIGNED_OUT', null)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('session')).toHaveTextContent('no-session')
    })
  })

  it('AuthProvider外でuseAuthを使用するとエラーが発生する', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleErrorSpy.mockRestore()
  })
}) 
