import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateGroupDialog } from '@/components/group/create-group-dialog'

describe('CreateGroupDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnCreateGroup = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <CreateGroupDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    expect(screen.queryByText('新しいグループを作成')).not.toBeInTheDocument()
  })

  it('ダイアログが開いている場合はフォームが表示される', () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    expect(screen.getByText('新しいグループを作成')).toBeInTheDocument()
    expect(screen.getByLabelText('グループ名 *')).toBeInTheDocument()
    expect(screen.getByLabelText('グループの説明')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('フォームに入力できる', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const descriptionInput = screen.getByLabelText('グループの説明')

    await user.type(nameInput, 'テストグループ')
    await user.type(descriptionInput, 'これはテスト用のグループです')

    expect(nameInput).toHaveValue('テストグループ')
    expect(descriptionInput).toHaveValue('これはテスト用のグループです')
  })

  it('必須フィールドが空の場合は作成ボタンが無効', () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const createButton = screen.getByRole('button', { name: '作成' })
    expect(createButton).toBeDisabled()

    const nameInput = screen.getByLabelText('グループ名 *')
    expect(nameInput).toHaveValue('')
  })

  it('グループ名を入力すると作成ボタンが有効になる', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const createButton = screen.getByRole('button', { name: '作成' })

    await user.type(nameInput, 'テストグループ')
    expect(createButton).toBeEnabled()
  })

  it('グループを作成できる', async () => {
    mockOnCreateGroup.mockResolvedValue(undefined)

    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const descriptionInput = screen.getByLabelText('グループの説明')
    const createButton = screen.getByRole('button', { name: '作成' })

    await user.type(nameInput, 'テストグループ')
    await user.type(descriptionInput, 'テスト説明')
    await user.click(createButton)

    await waitFor(() => {
      expect(mockOnCreateGroup).toHaveBeenCalledWith({
        name: 'テストグループ',
        description: 'テスト説明'
      })
    })

    // フォームがリセットされる
    expect(nameInput).toHaveValue('')
    expect(descriptionInput).toHaveValue('')

    // ダイアログが閉じる
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('作成中にローディング状態が表示される', async () => {
    let resolveCreate: Function
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve
    })
    mockOnCreateGroup.mockReturnValue(createPromise)

    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const createButton = screen.getByRole('button', { name: '作成' })

    await user.type(nameInput, 'テストグループ')
    await user.click(createButton)

    // ローディング状態を確認
    expect(screen.getByText('作成中...')).toBeInTheDocument()
    expect(createButton).toBeDisabled()

    // 作成完了
    resolveCreate(undefined)

    await waitFor(() => {
      expect(screen.queryByText('作成中...')).not.toBeInTheDocument()
    })
  })

  it('作成エラー時にエラーメッセージが表示される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockOnCreateGroup.mockRejectedValue(new Error('作成失敗'))

    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const createButton = screen.getByRole('button', { name: '作成' })

    await user.type(nameInput, 'テストグループ')
    await user.click(createButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('グループ作成エラー:', expect.any(Error))
    })

    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('キャンセルボタンでフォームがリセットされダイアログが閉じる', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')
    const descriptionInput = screen.getByLabelText('グループの説明')
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })

    await user.type(nameInput, 'テストグループ')
    await user.type(descriptionInput, 'テスト説明')
    await user.click(cancelButton)

    // フォームがリセットされる
    expect(nameInput).toHaveValue('')
    expect(descriptionInput).toHaveValue('')

    // ダイアログが閉じる
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('グループ名が長すぎる場合、エラーメッセージが表示される', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')

    // 101文字の長いグループ名
    const longName = 'a'.repeat(101)
    await user.type(nameInput, longName)

    expect(screen.getByText('グループ名は100文字以内で入力してください')).toBeInTheDocument()
  })

  it('グループ説明が長すぎる場合、エラーメッセージが表示される', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const descriptionInput = screen.getByLabelText('グループの説明')

    // 501文字の長い説明
    const longDescription = 'a'.repeat(501)
    await user.type(descriptionInput, longDescription)

    expect(screen.getByText('説明は500文字以内で入力してください')).toBeInTheDocument()
  })

  it('ESCキーでダイアログが閉じる', async () => {
    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')

    await user.type(nameInput, 'テストグループ')
    await user.keyboard('{Escape}')

    // ダイアログが閉じる
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('Enterキーでグループを作成できる', async () => {
    mockOnCreateGroup.mockResolvedValue(undefined)

    render(
      <CreateGroupDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreateGroup={mockOnCreateGroup}
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText('グループ名 *')

    await user.type(nameInput, 'テストグループ')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockOnCreateGroup).toHaveBeenCalledWith({
        name: 'テストグループ',
        description: ''
      })
    })
  })
})
