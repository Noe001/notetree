import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api' // apiClientをインポート
import { useAppNotifications } from '@/components/notification/notification-provider'

interface JoinGroupDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function JoinGroupDialog({ trigger, onSuccess }: JoinGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [groupId, setGroupId] = useState('')
  const [invitationToken, setInvitationToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // useGroupApiの代わりにapiClientを直接使用
  const notify = useAppNotifications()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!groupId.trim()) {
      notify.error('入力エラー', 'グループIDを入力してください')
      return
    }

    setIsLoading(true)
    try {
      let result; 
      if (invitationToken.trim()) {
        result = await apiClient.joinGroupByInvitation(invitationToken);
      } else {
        result = await apiClient.joinGroupByGroupId(groupId);
      }
      
      if (result.success) {
        notify.success('成功', 'グループに参加しました')
        setIsOpen(false)
        setGroupId('')
        setInvitationToken('')
        onSuccess?.()
      } else {
        notify.error('参加エラー', result.error || 'グループへの参加に失敗しました')
      }
    } catch (error) {
      notify.error('エラー', 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">グループに参加</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>グループに参加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupId">グループID *</Label>
            <Input
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="グループIDを入力"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invitationToken">招待トークン（オプション）</Label>
            <Input
              id="invitationToken"
              value={invitationToken}
              onChange={(e) => setInvitationToken(e.target.value)}
              placeholder="招待トークンを入力（あれば）"
            />
            <p className="text-sm text-muted-foreground">
              招待トークンがある場合は入力してください。ない場合は空欄のままにしてください。
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '参加中...' : '参加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
