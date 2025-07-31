import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MemberManagementDialog } from '@/components/group/member-management-dialog'

// モックデータの定義
const mockMembers = [
  {
    id: '1',
    name: 'ユーザー1',
    email: 'user1@example.com',
    role: 'admin' as const,
    joinedAt: '2023-01-01'
  },
  {
    id: '2',
    name: 'ユーザー2',
    email: 'user2@example.com',
    role: 'member' as const,
    joinedAt: '2023-01-02'
  }
]

describe('MemberManagementDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnRemoveMember = jest.fn()
  const mockOnInviteMember = jest.fn()
  const mockOnUpdateMemberRole = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <MemberManagementDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={[]}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    expect(screen.queryByText('メンバー管理')).not.toBeInTheDocument()
  })

  it('メンバー一覧が表示される', () => {
    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    expect(screen.getByText('メンバー管理')).toBeInTheDocument()
    
    // メンバーが表示されていることを確認
    expect(screen.getByText('ユーザー1')).toBeInTheDocument()
    expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    expect(screen.getByText('管理者')).toBeInTheDocument()
    
    expect(screen.getByText('ユーザー2')).toBeInTheDocument()
    expect(screen.getByText('user2@example.com')).toBeInTheDocument()
    expect(screen.getByText('メンバー')).toBeInTheDocument()
  })

  it('メンバーを招待できる', async () => {
    mockOnInviteMember.mockResolvedValue(undefined)

    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    const inviteButton = screen.getByRole('button', { name: /招待/i })
    await user.click(inviteButton)

    // 招待フォームが表示される
    expect(screen.getByText('メンバーを招待')).toBeInTheDocument()
    const emailInput = screen.getByLabelText('メールアドレス')
    const inviteSubmitButton = screen.getByRole('button', { name: '招待' })

    await user.type(emailInput, 'newuser@example.com')
    await user.click(inviteSubmitButton)

    await waitFor(() => {
      expect(mockOnInviteMember).toHaveBeenCalledWith('newuser@example.com', 'member')
    })
  })

  it('メンバーを削除できる', async () => {
    mockOnRemoveMember.mockResolvedValue(undefined)

    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    const removeButton = screen.getByLabelText('ユーザー2を削除')
    await user.click(removeButton)

    // 確認ダイアログが表示される
    expect(screen.getByText('メンバー削除の確認')).toBeInTheDocument()
    
    const confirmButton = screen.getByRole('button', { name: '削除' })
    await user.click(confirmButton)

    expect(mockOnRemoveMember).toHaveBeenCalledWith('2')
  })

  it('メンバーの権限を変更できる', async () => {
    mockOnUpdateMemberRole.mockResolvedValue(undefined)

    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    const changeRoleButton = screen.getByLabelText('ユーザー2の権限を変更')
    await user.click(changeRoleButton)

    // 権限変更メニューが表示される
    const adminOption = screen.getByText('管理者')
    await user.click(adminOption)

    expect(mockOnUpdateMemberRole).toHaveBeenCalledWith('2', 'admin')
  })

  it('ESCキーでダイアログが閉じる', async () => {
    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    await user.keyboard('{Escape}')

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('閉じるボタンでダイアログが閉じる', async () => {
    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    const closeButton = screen.getByRole('button', { name: '閉じる' })
    await user.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('メンバー検索が機能する', async () => {
    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={mockMembers}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('メンバーを検索...')
    await user.type(searchInput, 'ユーザー1')

    // ユーザー1のみが表示される
    expect(screen.getByText('ユーザー1')).toBeInTheDocument()
    expect(screen.queryByText('ユーザー2')).not.toBeInTheDocument()
  })

  it('メンバーがいない場合、適切なメッセージが表示される', () => {
    render(
      <MemberManagementDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        groupId="group1"
        members={[]}
        onInviteMember={mockOnInviteMember}
        onRemoveMember={mockOnRemoveMember}
        onUpdateMemberRole={mockOnUpdateMemberRole}
      />
    )

    expect(screen.getByText('メンバーがいません')).toBeInTheDocument()
    expect(screen.getByText('メンバーを招待してグループに参加させましょう')).toBeInTheDocument()
  })
})
