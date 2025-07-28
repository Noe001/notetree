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
import { X, Plus, Loader2 } from 'lucide-react'

interface Memo {
  id: string
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
  updatedAt: string
  createdAt: string
}

interface MemoEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memo: Memo | null
  onUpdateMemo: (id: string, memoData: UpdateMemoData) => Promise<void>
}

interface UpdateMemoData {
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
}

export function MemoEditDialog({ 
  open, 
  onOpenChange, 
  memo,
  onUpdateMemo 
}: MemoEditDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)

  // メモが変更されたときにフォームを初期化
  useEffect(() => {
    if (memo && open) {
      setTitle(memo.title)
      setContent(memo.content)
      setTags([...memo.tags])
      setIsPrivate(memo.isPrivate)
      setCurrentTag('')
    }
  }, [memo, open])

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleUpdate = async () => {
    if (!memo || !title.trim() || !content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    setLoading(true)
    try {
      await onUpdateMemo(memo.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
        isPrivate
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('メモ更新エラー:', error)
      alert('メモの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (memo) {
      setTitle(memo.title)
      setContent(memo.content)
      setTags([...memo.tags])
      setIsPrivate(memo.isPrivate)
      setCurrentTag('')
    }
    onOpenChange(false)
  }

  if (!memo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>メモを編集</DialogTitle>
          <DialogDescription>
            メモの内容を変更できます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="edit-memo-title">タイトル *</Label>
            <Input
              id="edit-memo-title"
              placeholder="メモのタイトルを入力..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label htmlFor="edit-memo-content">内容 *</Label>
            <Textarea
              id="edit-memo-content"
              placeholder="メモの内容を入力..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              rows={6}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* タグ */}
          <div className="space-y-3">
            <Label>タグ</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="タグを入力..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!currentTag.trim() || loading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* プライベート設定 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-memo-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="edit-memo-private">プライベートメモ</Label>
          </div>

          {/* メタ情報 */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>作成日: {new Date(memo.createdAt).toLocaleString('ja-JP')}</p>
            <p>最終更新: {new Date(memo.updatedAt).toLocaleString('ja-JP')}</p>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              'メモを更新'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
