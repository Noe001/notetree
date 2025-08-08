"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title = '確認',
  message = 'この操作を実行しますか？',
  confirmText = 'OK',
  cancelText = 'キャンセル',
  onOpenChange,
  onConfirm
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await Promise.resolve(onConfirm())
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {message}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? '実行中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


