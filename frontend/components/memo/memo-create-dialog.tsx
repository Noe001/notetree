import React, { useState } from 'react'
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

interface MemoCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateMemo: (memoData: CreateMemoData) => Promise<void>
}

interface CreateMemoData {
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
}

export function MemoCreateDialog({ 
  open, 
  onOpenChange, 
  onCreateMemo 
}: MemoCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    setLoading(true)
    try {
      await onCreateMemo({
        title: title.trim(),
        content: content.trim(),
        tags,
        isPrivate
      })
      
      // フォームをリセット
      setTitle('')
      setContent('')
      setTags([])
      setCurrentTag('')
      setIsPrivate(false)
      onOpenChange(false)
    } catch (error) {
      console.error('メモ作成エラー:', error)
      alert('メモの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setContent('')
    setTags([])
    setCurrentTag('')
    setIsPrivate(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいメモを作成</DialogTitle>
          <DialogDescription>
            タイトル、内容、タグを入力してメモを作成できます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="memo-title">タイトル *</Label>
            <Input
              id="memo-title"
              placeholder="メモのタイトルを入力..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label htmlFor="memo-content">内容 *</Label>
            <Textarea
              id="memo-content"
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
              id="memo-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="memo-private">プライベートメモ</Label>
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
            onClick={handleCreate}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                作成中...
              </>
            ) : (
              'メモを作成'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
