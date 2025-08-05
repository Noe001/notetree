import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, AlertCircle } from 'lucide-react'

interface Memo {
  id: string
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
  updatedAt: string
  createdAt: string
}

interface MemoDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memo: Memo | null
  onDeleteMemo: (id: string) => Promise<void>
}

export function MemoDeleteDialog({ 
  open, 
  onOpenChange, 
  memo,
  onDeleteMemo 
}: MemoDeleteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!memo) return

    setLoading(true)
    setError(null)
    
    try {
      await onDeleteMemo(memo.id)
      onOpenChange(false)
    } catch (error: any) {
      console.error('メモ削除エラー:', error)
      setError(error.message || 'メモの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!memo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>メモを削除</span>
          </DialogTitle>
          <DialogDescription>
            この操作は取り消すことができません。本当にこのメモを削除しますか？
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* メモ情報プレビュー */}
          <div className="p-4 bg-muted rounded-lg border space-y-3">
            <div>
              <p className="font-medium text-sm">タイトル</p>
              <p className="text-sm text-muted-foreground break-words">
                {memo.title}
              </p>
            </div>
            
            <div>
              <p className="font-medium text-sm">内容プレビュー</p>
              <p className="text-sm text-muted-foreground break-words line-clamp-3">
                {memo.content.substring(0, 100)}{memo.content.length > 100 ? '...' : ''}
              </p>
            </div>

            {memo.tags.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">タグ</p>
                <div className="flex flex-wrap gap-1">
                  {memo.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>作成日: {new Date(memo.createdAt).toLocaleString('ja-JP')}</p>
              <p>最終更新: {new Date(memo.updatedAt).toLocaleString('ja-JP')}</p>
            </div>
          </div>

          {/* 警告メッセージ */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ 削除されたメモは復元できません
            </p>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              'メモを削除'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
