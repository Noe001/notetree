import React, { useState, useEffect } from 'react';
import { Users, Plus, Settings, UserPlus, Mail, Crown, Shield, Trash2, Edit, X, LogIn, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGroups, useInvitations, useUserSearch } from '@/hooks/useApi';
import { Group, GroupMember, Invitation } from '@/lib/api';
import { JoinGroupDialog } from './group/join-group-dialog';
import { CreateGroupDialog } from './group/create-group-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface GroupManagerProps {
  currentUserId: string;
  selectedGroupId?: string;
  onGroupSelect: (groupId: string) => void;
}

export function GroupManager({ currentUserId, selectedGroupId, onGroupSelect }: GroupManagerProps) {
  const { groups, loading, error, fetchGroups, createGroup, updateGroup, deleteGroup } = useGroups();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' as 'admin' | 'member' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{ email: string; token: string } | null>(null);
  const [deleteTargetGroupId, setDeleteTargetGroupId] = useState<string | null>(null);

  const { invitations, fetchInvitations, sendInvitation } = useInvitations(selectedGroup?.id || '');
  const { query: searchQuery, results: searchResults, loading: searchLoading, search: searchUsers, clearSearch } = useUserSearch();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroup?.id) {
      fetchInvitations();
    }
  }, [selectedGroup?.id, fetchInvitations]);

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      await createGroup(formData);
      setFormData({ name: '', description: '' });
      setShowCreateDialog(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'グループの作成に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !formData.name.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      await updateGroup(selectedGroup.id, formData);
      setSelectedGroup(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'グループの更新に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeleteTargetGroupId(groupId);
  };

  const handleSendInvitation = async () => {
    if (!selectedGroup || !inviteData.email.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      const created = await sendInvitation({
        email: inviteData.email,
        role: inviteData.role
      });
      setInviteData({ email: '', role: 'member' });
      if (created && (created as any).token) {
        setLastInvite({ email: (created as any).email, token: (created as any).token });
      }
      fetchInvitations();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '招待の送信に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
  };

  const openInviteDialog = (group: Group) => {
    setSelectedGroup(group);
    setShowInviteDialog(true);
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>グループを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">グループ管理</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <JoinGroupDialog 
            trigger={
              <Button variant="outline" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>グループに参加</span>
              </Button>
            }
            onSuccess={fetchGroups}
          />
          
          <CreateGroupDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreateGroup={async (groupData) => {
              try {
                setActionLoading(true);
                setActionError(null);
                await createGroup(groupData);
                setFormData({ name: '', description: '' });
                setShowCreateDialog(false);
              } catch (error) {
                setActionError(error instanceof Error ? error.message : 'グループの作成に失敗しました');
              } finally {
                setActionLoading(false);
              }
            }}
            loading={actionLoading}
          />
      </div>
    </div>

      {error && (
        <Alert>
          <AlertDescription>グループの読み込みに失敗しました: {error}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Groups List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group) => (
          <div
            key={group.id}
            className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
              selectedGroupId === group.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => onGroupSelect(group.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInviteDialog(group);
                  }}
                  title="メンバーを招待"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditDialog(group);
                  }}
                  title="グループを編集"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {group.ownerId === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    title="グループを削除"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">メンバー</span>
                <span className="text-xs text-gray-500">{group.members.length}人</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {group.members.slice(0, 3).map((member: GroupMember) => (
                  <Badge
                    key={member.id}
                    variant={getRoleBadgeVariant(member.role)}
                    className="text-xs flex items-center space-x-1"
                  >
                    {getRoleIcon(member.role)}
                    <span>{member.user.name}</span>
                  </Badge>
                ))}
                {group.members.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{group.members.length - 3}人
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>グループを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">グループ名</Label>
              <Input
                id="editGroupName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="グループ名を入力"
              />
            </div>
            <div>
              <Label htmlFor="editGroupDescription">説明（任意）</Label>
              <Textarea
                id="editGroupDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="グループの説明を入力"
                rows={3}
              />
            </div>
          </div>
          {actionError && (
            <Alert>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGroup(null)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateGroup} disabled={actionLoading || !formData.name.trim()}>
              {actionLoading ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを招待</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">メールアドレス</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="招待するユーザーのメールアドレス"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">役割</Label>
              <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value as 'admin' | 'member' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">メンバー</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lastInvite && (
              <div className="p-3 border rounded-md bg-muted/30">
                <p className="text-sm mb-2">直近に発行した招待</p>
                <div className="text-sm grid gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">メール</span>
                    <span>{lastInvite.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">トークン</span>
                    <code className="text-xs break-all">{lastInvite.token}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="トークンをコピー"
                      onClick={() => navigator.clipboard.writeText(lastInvite.token)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {invitations && invitations.length > 0 && (
              <div className="p-3 border rounded-md">
                <p className="text-sm mb-2">未参加の招待一覧</p>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {invitations.map((inv) => (
                    <div key={(inv as any).id ?? (inv as any).token} className="text-xs flex items-center gap-2 justify-between">
                      <span>{(inv as any).email}</span>
                      <div className="flex items-center gap-1">
                        <code className="truncate max-w-[140px]">{(inv as any).token}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="トークンをコピー"
                          onClick={() => navigator.clipboard.writeText((inv as any).token)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="招待を失効"
                          onClick={async () => {
                            if (!selectedGroup) return;
                            try {
                              setActionLoading(true);
                              setActionError(null);
                              await (await import('@/lib/api')).apiClient.revokeInvitation(selectedGroup.id, (inv as any).token);
                              fetchInvitations();
                            } catch (e) {
                              setActionError(e instanceof Error ? e.message : '招待の失効に失敗しました');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {actionError && (
            <Alert>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSendInvitation} disabled={actionLoading || !inviteData.email.trim()}>
              {actionLoading ? '送信中...' : '招待を送信'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* グループ削除の確認ダイアログ */}
      <ConfirmDialog
        open={!!deleteTargetGroupId}
        title="グループ削除の確認"
        message="このグループを削除してもよろしいですか？この操作は取り消せません。"
        confirmText="削除する"
        onOpenChange={(o) => { if (!o) setDeleteTargetGroupId(null) }}
        onConfirm={async () => {
          if (!deleteTargetGroupId) return;
          try {
            setActionLoading(true);
            setActionError(null);
            await deleteGroup(deleteTargetGroupId);
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'グループの削除に失敗しました');
          } finally {
            setActionLoading(false);
            setDeleteTargetGroupId(null);
          }
        }}
      />
    </div>
  );
}
