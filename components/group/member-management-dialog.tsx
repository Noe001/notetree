import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-simple';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, UserPlus, Mail, MoreVertical, Trash2, Edit } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  joinedAt: string;
}

interface MemberManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: Member[];
  onInviteMember: (email: string, role: 'admin' | 'member') => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateMemberRole: (memberId: string, role: 'admin' | 'member') => Promise<void>;
}

export function MemberManagementDialog({
  open,
  onOpenChange,
  groupId,
  members,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
}: MemberManagementDialogProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail) return;
    
    setIsInviting(true);
    try {
      await onInviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'オーナー';
      case 'admin': return '管理者';
      case 'member': return 'メンバー';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>メンバー管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 招待フォーム */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">メンバーを招待</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="メールアドレスを入力"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="member">メンバー</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleInvite} 
                disabled={!inviteEmail || isInviting}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                招待
              </Button>
            </div>
          </div>

          <Separator />

          {/* メンバーリスト */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <h3 className="text-lg font-medium">メンバー ({members.length})</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="メンバーを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name?.[0] || member.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleColor(member.role) as any}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                    </span>
                    {member.role !== 'owner' && (
                      <>
                        <Select 
                          value={member.role} 
                          onValueChange={(value: 'admin' | 'member') => 
                            onUpdateMemberRole(member.id, value)
                          }
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">管理者</SelectItem>
                            <SelectItem value="member">メンバー</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveMember(member.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? '検索結果がありません' : 'メンバーがいません'}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
