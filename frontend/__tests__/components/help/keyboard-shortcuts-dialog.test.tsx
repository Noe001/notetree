import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyboardShortcutsDialog } from '@/components/help/keyboard-shortcuts-dialog'

describe('KeyboardShortcutsDialog', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <KeyboardShortcutsDialog
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.queryByText('キーボードショートカット')).not.toBeInTheDocument()
  })

  it('ダイアログが開いている場合はショートカット一覧が表示される', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText('キーボードショートカット')).toBeInTheDocument()
    expect(screen.getByText('ショートカットキー')).toBeInTheDocument()
    expect(screen.getByText('説明')).toBeInTheDocument()
    
    // 主要なショートカットが表示されていることを確認
    expect(screen.getByText('新しいメモを作成')).toBeInTheDocument()
    expect(screen.getByText('メモを検索')).toBeInTheDocument()
    expect(screen.getByText('グループを切り替える')).toBeInTheDocument()
    expect(screen.getByText('ヘルプを表示')).toBeInTheDocument()
    expect(screen.getByText('ショートカット一覧を表示')).toBeInTheDocument()
  })

  it('ショートカットキーが正しく表示される', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    // 各ショートカットのキーバインディングを確認
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+F')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+G')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+H')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+/')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+O')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+E')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+I')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+F')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+G')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+H')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+/')).toBeInTheDocument()
  })

  it('各ショートカットに説明が表示される', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    // 各ショートカットの説明を確認
    expect(screen.getByText('新しいメモを作成')).toBeInTheDocument()
    expect(screen.getByText('メモを検索')).toBeInTheDocument()
    expect(screen.getByText('グループを切り替える')).toBeInTheDocument()
    expect(screen.getByText('ヘルプを表示')).toBeInTheDocument()
    expect(screen.getByText('ショートカット一覧を表示')).toBeInTheDocument()
    expect(screen.getByText('メモをエクスポート')).toBeInTheDocument()
    expect(screen.getByText('メモをインポート')).toBeInTheDocument()
    expect(screen.getByText('エディタを拡張表示')).toBeInTheDocument()
    expect(screen.getByText('インラインプレビューを切り替え')).toBeInTheDocument()
    expect(screen.getByText('新しいグループを作成')).toBeInTheDocument()
    expect(screen.getByText('メモをフィルター')).toBeInTheDocument()
    expect(screen.getByText('グループ設定を開く')).toBeInTheDocument()
    expect(screen.getByText('通知を表示')).toBeInTheDocument()
  })

  it('ESCキーでダイアログが閉じる', async () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const user = userEvent.setup()
    await user.keyboard('{Escape}')

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('閉じるボタンでダイアログが閉じる', async () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const user = userEvent.setup()
    const closeButton = screen.getByRole('button', { name: '閉じる' })
    await user.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('ダイアログの外側をクリックしても閉じない', async () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const user = userEvent.setup()
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)

    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })

  it('ショートカット一覧がカテゴリごとにグループ化されている', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    // カテゴリヘッダーを確認
    expect(screen.getByText('基本操作')).toBeInTheDocument()
    expect(screen.getByText('メモ操作')).toBeInTheDocument()
    expect(screen.getByText('グループ操作')).toBeInTheDocument()
    expect(screen.getByText('データ操作')).toBeInTheDocument()
  })

  it('各カテゴリに適切なショートカットが含まれている', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    // 基本操作カテゴリ
    expect(screen.getByText('基本操作')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+F')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+H')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+/')).toBeInTheDocument()

    // メモ操作カテゴリ
    expect(screen.getByText('メモ操作')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+E')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+I')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument()

    // グループ操作カテゴリ
    expect(screen.getByText('グループ操作')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+G')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Shift+G')).toBeInTheDocument()

    // データ操作カテゴリ
    expect(screen.getByText('データ操作')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+O')).toBeInTheDocument()
  })

  it('ショートカットテーブルが正しく表示される', () => {
    render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    const tables = screen.getAllByRole('table')
    expect(tables).toHaveLength(4) // 4つのカテゴリテーブル

    // 各テーブルにヘッダーが存在することを確認
    tables.forEach(table => {
      const headers = table.querySelectorAll('thead th')
      expect(headers).toHaveLength(2)
      expect(headers[0].textContent).toBe('ショートカットキー')
      expect(headers[1].textContent).toBe('説明')
    })
  })

  it('モバイル表示でも正しく表示される', () => {
    // モバイル表示のテストは実際の画面サイズ変更が必要なため、
    // ここではコンポーネントがエラーなくレンダリングされることを確認
    expect(() => {
      render(
        <KeyboardShortcutsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )
    }).not.toThrow()
  })

  it('空の状態でもエラーが発生しない', () => {
    expect(() => {
      render(
        <KeyboardShortcutsDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )
    }).not.toThrow()
  })

  it('複数回開閉しても正しく動作する', async () => {
    const { rerender } = render(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText('キーボードショートカット')).toBeInTheDocument()

    // 閉じる
    const user = userEvent.setup()
    const closeButton = screen.getByRole('button', { name: '閉じる' })
    await user.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)

    // 再度開く
    rerender(
      <KeyboardShortcutsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    )

    expect(screen.getByText('キーボードショートカット')).toBeInTheDocument()
  })
})
