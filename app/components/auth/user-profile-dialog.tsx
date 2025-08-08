import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { UserIcon, LogOut, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface UserProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any | null
}

export function UserProfileDialog({ open, onOpenChange, user }: UserProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signOut()
      if (result.error) {
        setError('ログアウトに失敗しました: ' + result.error.message)
      } else {
        // ダイアログを閉じる
        onOpenChange(false)
        
        // ページをリロードして状態をリセット
        window.location.reload()
      }
    } catch (error) {
      setError('ログアウト中にエラーが発生しました')
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>プロフィール</DialogTitle>
          <DialogDescription>
            アカウント情報とログアウト
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-6 mt-4">
          {/* プロフィール情報 */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user.avatar_url} 
                alt={user.name || user.email || 'ユーザー'}
              />
              <AvatarFallback>
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <Label className="text-sm font-medium">
                {user.name || 'ユーザー'}
              </Label>
              <Label className="text-sm text-muted-foreground">
                {user.email}
              </Label>
            </div>
          </div>

          <Separator />

          {/* アカウント情報 */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">ユーザーID</Label>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {user.id}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">登録日時</Label>
              <p className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '不明'}
              </p>
            </div>
          </div>

          <Separator />

          {/* エラーメッセージ */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ログアウトボタン */}
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ログアウト中...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
