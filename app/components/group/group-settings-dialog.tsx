import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Users, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Shield, 
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useAppNotifications } from '@/components/notification/notification-provider'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface GroupMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: string
}

interface Group {
  id: string
  name: string
  description: string
  isPrivate: boolean
  memberCount: number
  createdAt: string
  updatedAt: string
}

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  members: GroupMember[]
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>
  onInviteMember: (groupId: string, email: string, role: string) => Promise<void>
  onRemoveMember: (groupId: string, memberId: string) => Promise<void>
  onUpdateMemberRole: (groupId: string, memberId: string, role: string) => Promise<void>
  onDeleteGroup: (id: string) => Promise<void>
  currentUserId: string
}

export function GroupSettingsDialog({ 
  open, 
  onOpenChange, 
  group,
  members,
  onUpdateGroup,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  onDeleteGroup,
  currentUserId
}: GroupSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'permissions' | 'danger'>('general')
  const [loading, setLoading] = useState(false)
  const notify = useAppNotifications()
  
  // グループ設定
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  
  // メンバー招待
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  
  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [removeTargetMemberId, setRemoveTargetMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (group && open) {
      setGroupName(group.name)
      setGroupDescription(group.description)
      setIsPrivate(group.isPrivate)
    }
  }, [group, open])

  const currentUserMember = members.find(m => m.id === currentUserId)
  const isOwner = currentUserMember?.role === 'owner'
  const isAdmin = currentUserMember?.role === 'admin' || isOwner

  const handleUpdateGroup = async () => {
    if (!group || !groupName.trim()) return

    setLoading(true)
    try {
      await onUpdateGroup(group.id, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        isPrivate
      })
      notify.success('グループ設定を更新しました')
    } catch (error) {
      console.error('グループ更新エラー:', error)
      notify.error('グループの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!group || !inviteEmail.trim()) return

    setLoading(true)
    try {
      await onInviteMember(group.id, inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      notify.success('招待を送信しました')
    } catch (error) {
      console.error('メンバー招待エラー:', error)
      notify.error('招待の送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!group) return
    setRemoveTargetMemberId(memberId)
  }

  const handleDeleteGroup = async () => {
    if (!group || !showDeleteConfirm) return

    setLoading(true)
    try {
      await onDeleteGroup(group.id)
      onOpenChange(false)
    } catch (error) {
      console.error('グループ削除エラー:', error)
      notify.error('グループの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
      case 'editor': return <Users className="h-4 w-4 text-green-500" />
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />
      default: return null
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'オーナー'
      case 'admin': return '管理者'
      case 'editor': return '編集者'
      case 'viewer': return '閲覧者'
      default: return role
    }
  }

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>グループ設定</DialogTitle>
          <DialogDescription>
            グループの設定とメンバー管理を行います。
          </DialogDescription>
        </DialogHeader>
        
        {/* タブナビゲーション */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'general', label: '一般', icon: Settings },
            { id: 'members', label: 'メンバー', icon: Users },
            { id: 'permissions', label: '権限', icon: Shield },
            { id: 'danger', label: '危険な操作', icon: AlertTriangle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6 py-4">
          {/* 一般設定 */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">グループ名 *</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={loading || !isAdmin}
                  placeholder="グループ名を入力..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-description">説明</Label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  disabled={loading || !isAdmin}
                  placeholder="グループの説明を入力..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="group-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={loading || !isAdmin}
                />
                <Label htmlFor="group-private">プライベートグループ</Label>
              </div>

              {isAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleUpdateGroup} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        更新中...
                      </>
                    ) : (
                      '設定を保存'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* メンバー管理 */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* メンバー招待 */}
              {isAdmin && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>メンバーを招待</span>
                  </h3>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="メールアドレス"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">編集者</SelectItem>
                        <SelectItem value="viewer">閲覧者</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleInviteMember} disabled={loading || !inviteEmail.trim()}>
                      招待
                    </Button>
                  </div>
                </div>
              )}

              {/* メンバー一覧 */}
              <div className="space-y-4">
                <h3 className="font-medium">メンバー ({members.length})</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span>{getRoleLabel(member.role)}</span>
                        </Badge>
                        {isOwner && member.role !== 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={loading}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 権限設定 */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium">権限について</h3>
                <div className="space-y-3">
                  {[
                    { role: 'owner', label: 'オーナー', description: 'すべての操作が可能（グループ削除含む）' },
                    { role: 'admin', label: '管理者', description: 'メンバー管理とグループ設定が可能' },
                    { role: 'editor', label: '編集者', description: 'メモの作成・編集・削除が可能' },
                    { role: 'viewer', label: '閲覧者', description: 'メモの閲覧のみ可能' }
                  ].map(({ role, label, description }) => (
                    <div key={role} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getRoleIcon(role)}
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 危険な操作 */}
          {activeTab === 'danger' && isOwner && (
            <div className="space-y-4">
              <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                <h3 className="font-medium text-destructive mb-2 flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>グループを削除</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  グループとすべてのメモが完全に削除されます。この操作は取り消せません。
                </p>
                
                {!showDeleteConfirm ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                  >
                    グループを削除
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-destructive">
                      本当にグループ「{group.name}」を削除しますか？
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={loading}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteGroup}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            削除中...
                          </>
                        ) : (
                          '削除を実行'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </div>

        {/* メンバー削除の確認ダイアログ */}
        <ConfirmDialog
          open={!!removeTargetMemberId}
          title="メンバー削除の確認"
          message="このメンバーをグループから削除しますか？"
          confirmText="削除する"
          onOpenChange={(o) => { if (!o) setRemoveTargetMemberId(null) }}
          onConfirm={async () => {
            if (!group || !removeTargetMemberId) return
            setLoading(true)
            try {
              await onRemoveMember(group.id, removeTargetMemberId)
              notify.success('メンバーを削除しました')
            } catch (error) {
              console.error('メンバー削除エラー:', error)
              notify.error('メンバーの削除に失敗しました')
            } finally {
              setLoading(false)
              setRemoveTargetMemberId(null)
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
} 
