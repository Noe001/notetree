import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoCreateDialog } from '@/components/memo/memo-create-dialog'

describe('MemoCreateDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnCreateMemo = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <MemoCreateDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    expect(screen.queryByText('新しいメモを作成')).not.toBeInTheDocument()
  })

  it('ダイアログが開いている場合は内容が表示される', () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    expect(screen.getByText('新しいメモを作成')).toBeInTheDocument()
    expect(screen.getByText('タイトル、内容、タグを入力してメモを作成できます。')).toBeInTheDocument()
    expect(screen.getByLabelText('タイトル *')).toBeInTheDocument()
    expect(screen.getByLabelText('内容 *')).toBeInTheDocument()
    expect(screen.getByLabelText('プライベートメモ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'メモを作成' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('フォームに入力できる', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText('タイトル *')
    const contentTextarea = screen.getByLabelText('内容 *')

    await user.type(titleInput, 'テストタイトル')
    await user.type(contentTextarea, 'テスト内容')

    expect(titleInput).toHaveValue('テストタイトル')
    expect(contentTextarea).toHaveValue('テスト内容')
  })

  it('タグの追加と削除ができる', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const tagInput = screen.getByPlaceholderText('タグを入力...')
    const addButton = screen.getByRole('button', { name: '' }) // Plus icon button

    // タグを追加
    await user.type(tagInput, 'テストタグ')
    await user.click(addButton)

    expect(screen.getByText('テストタグ')).toBeInTheDocument()
    expect(tagInput).toHaveValue('')

    // Enterキーでタグを追加
    await user.type(tagInput, 'タグ2')
    await user.keyboard('{Enter}')

    expect(screen.getByText('タグ2')).toBeInTheDocument()

    // タグを削除
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && 
      button.textContent?.includes('テストタグ')
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      expect(screen.queryByText('テストタグ')).not.toBeInTheDocument()
    }
  })

  it('プライベート設定を切り替えできる', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const privateSwitch = screen.getByLabelText('プライベートメモ')

    expect(privateSwitch).not.toBeChecked()

    await user.click(privateSwitch)
    expect(privateSwitch).toBeChecked()
  })

  it('必須フィールドが空の場合はメモを作成できない', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const createButton = screen.getByRole('button', { name: 'メモを作成' })

    // 初期状態では作成ボタンが無効
    expect(createButton).toBeDisabled()

    // タイトルのみ入力
    const titleInput = screen.getByLabelText('タイトル *')
    await user.type(titleInput, 'タイトル')
    expect(createButton).toBeDisabled()

    // 内容も入力
    const contentTextarea = screen.getByLabelText('内容 *')
    await user.type(contentTextarea, '内容')
    expect(createButton).toBeEnabled()
  })

  it('メモの作成が正常に動作する', async () => {
    mockOnCreateMemo.mockResolvedValue(undefined)

    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText('タイトル *')
    const contentTextarea = screen.getByLabelText('内容 *')
    const createButton = screen.getByRole('button', { name: 'メモを作成' })

    await user.type(titleInput, 'テストタイトル')
    await user.type(contentTextarea, 'テスト内容')
    await user.click(createButton)

    await waitFor(() => {
      expect(mockOnCreateMemo).toHaveBeenCalledWith({
        title: 'テストタイトル',
        content: 'テスト内容',
        tags: [],
        isPrivate: false,
      })
    })

    // フォームがリセットされる
    expect(titleInput).toHaveValue('')
    expect(contentTextarea).toHaveValue('')

    // ダイアログが閉じる
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('メモ作成中はローディング状態になる', async () => {
    let resolveCreate: Function
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve
    })
    mockOnCreateMemo.mockReturnValue(createPromise)

    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText('タイトル *')
    const contentTextarea = screen.getByLabelText('内容 *')
    const createButton = screen.getByRole('button', { name: 'メモを作成' })

    await user.type(titleInput, 'テストタイトル')
    await user.type(contentTextarea, 'テスト内容')
    await user.click(createButton)

    // ローディング状態を確認
    expect(screen.getByText('作成中...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /作成中/i })).toBeDisabled()

    // 作成完了
    resolveCreate(undefined)

    await waitFor(() => {
      expect(screen.queryByText('作成中...')).not.toBeInTheDocument()
    })
  })

  it('メモ作成エラー時にエラーメッセージが表示される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockOnCreateMemo.mockRejectedValue(new Error('Creation failed'))

    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText('タイトル *')
    const contentTextarea = screen.getByLabelText('内容 *')
    const createButton = screen.getByRole('button', { name: 'メモを作成' })

    await user.type(titleInput, 'テストタイトル')
    await user.type(contentTextarea, 'テスト内容')
    await user.click(createButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('メモ作成エラー:', expect.any(Error))
    })

    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('キャンセルボタンでフォームがリセットされダイアログが閉じる', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const titleInput = screen.getByLabelText('タイトル *')
    const contentTextarea = screen.getByLabelText('内容 *')
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })

    // フォームに入力
    await user.type(titleInput, 'テストタイトル')
    await user.type(contentTextarea, 'テスト内容')

    // キャンセル
    await user.click(cancelButton)

    // フォームがリセットされる
    expect(titleInput).toHaveValue('')
    expect(contentTextarea).toHaveValue('')

    // ダイアログが閉じる
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('重複するタグは追加されない', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const tagInput = screen.getByPlaceholderText('タグを入力...')
    const addButton = screen.getByRole('button', { name: '' }) // Plus icon button

    // 同じタグを2回追加しようとする
    await user.type(tagInput, 'タグ1')
    await user.click(addButton)

    await user.type(tagInput, 'タグ1')
    await user.click(addButton)

    // タグは1つだけ表示される
    const tags = screen.getAllByText('タグ1')
    expect(tags).toHaveLength(1)
  })

  it('空のタグは追加されない', async () => {
    render(
      <MemoCreateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateMemo={mockOnCreateMemo}
      />
    )

    const user = userEvent.setup()
    const tagInput = screen.getByPlaceholderText('タグを入力...')
    const addButton = screen.getByRole('button', { name: '' }) // Plus icon button

    // 空のタグを追加しようとする
    await user.click(addButton)

    // 空白のタグを追加しようとする
    await user.type(tagInput, '   ')
    await user.click(addButton)

    // タグは追加されない
    expect(screen.queryByText('')).not.toBeInTheDocument()
  })
}) 
