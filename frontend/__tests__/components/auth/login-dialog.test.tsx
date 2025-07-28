import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginDialog } from '@/components/auth/login-dialog'
import { AuthProvider } from '@/lib/auth-context'

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

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('LoginDialog', () => {
  const mockSupabase = require('@/lib/supabase').supabase
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
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

  it('ダイアログが開いていない場合は何も表示されない', () => {
    renderWithAuth(
      <LoginDialog open={false} onOpenChange={mockOnOpenChange} />
    )

    expect(screen.queryByText('Notetreeにログイン')).not.toBeInTheDocument()
  })

  it('ダイアログが開いている場合は内容が表示される', () => {
    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    expect(screen.getByText('Notetreeにログイン')).toBeInTheDocument()
    expect(screen.getByText('Googleアカウントでログインして、メモの作成と共有を始めましょう。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /googleでログイン/i })).toBeInTheDocument()
  })

  it('Googleログインボタンをクリックするとサインイン処理が実行される', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://google.com/auth' },
      error: null,
    })

    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    const user = userEvent.setup()
    const googleButton = screen.getByRole('button', { name: /googleでログイン/i })

    await user.click(googleButton)

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost',
      },
    })
  })

  it('ログイン成功時にダイアログが閉じる', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://google.com/auth' },
      error: null,
    })

    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    const user = userEvent.setup()
    const googleButton = screen.getByRole('button', { name: /googleでログイン/i })

    await user.click(googleButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('ログインエラー時にエラーメッセージが表示される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'Google login failed' },
    })

    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    const user = userEvent.setup()
    const googleButton = screen.getByRole('button', { name: /googleでログイン/i })

    await user.click(googleButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('ログインエラー:', 'Google login failed')
    })

    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('ログイン中はローディング状態が表示される', async () => {
    // ログイン処理を遅延させるPromiseを作成
    let resolveLogin: Function
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })

    mockSupabase.auth.signInWithOAuth.mockReturnValue(loginPromise)

    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    const user = userEvent.setup()
    const googleButton = screen.getByRole('button', { name: /googleでログイン/i })

    await user.click(googleButton)

    // ローディング状態を確認
    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ログイン中/i })).toBeDisabled()

    // ログイン完了
    resolveLogin({ data: { provider: 'google' }, error: null })

    await waitFor(() => {
      expect(screen.queryByText('ログイン中...')).not.toBeInTheDocument()
    })
  })

  it('利用規約とプライバシーポリシーのテキストが表示される', () => {
    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    expect(screen.getByText(/ログインすることで、利用規約とプライバシーポリシーに同意したことになります/)).toBeInTheDocument()
  })

  it('予期しないエラーが適切に処理される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockSupabase.auth.signInWithOAuth.mockRejectedValue(new Error('Unexpected error'))

    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    const user = userEvent.setup()
    const googleButton = screen.getByRole('button', { name: /googleでログイン/i })

    await user.click(googleButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('予期しないエラー:', expect.any(Error))
    })

    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })
}) 
