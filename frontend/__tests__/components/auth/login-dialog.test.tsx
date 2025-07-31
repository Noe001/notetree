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

    expect(screen.queryByText('Notetreeへようこそ')).not.toBeInTheDocument()
  })

  it('ダイアログが開いている場合は内容が表示される', () => {
    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    expect(screen.getByText('Notetreeへようこそ')).toBeInTheDocument()
    expect(screen.getByText('アカウントにログインするか、新しくアカウントを作成してください。')).toBeInTheDocument()
  })

  it('利用規約とプライバシーポリシーのテキストが表示される', () => {
    renderWithAuth(
      <LoginDialog open={true} onOpenChange={mockOnOpenChange} />
    )

    expect(screen.getByText(/ログイン・サインアップすることで、利用規約とプライバシーポリシーに同意したことになります/)).toBeInTheDocument()
  })
}) 
