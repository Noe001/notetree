import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (groupData: { name: string; description?: string }) => Promise<void>;
  loading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  isPrivate: boolean;
}

export function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  onCreateGroup,
  loading = false 
}: CreateGroupDialogProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', description: '', isPrivate: false });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('グループ名は必須です');
      return;
    }

    try {
      setError(null);
      const { isPrivate, ...groupData } = formData;
      await onCreateGroup(groupData);
      setFormData({ name: '', description: '', isPrivate: false });
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'グループの作成に失敗しました');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', isPrivate: false });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新しいグループを作成
          </DialogTitle>
          <DialogDescription>
            グループを作成して、メンバーとメモを共有できます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="groupName">グループ名 *</Label>
            <Input
              id="groupName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="グループ名を入力"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="groupDescription">説明（任意）</Label>
            <Textarea
              id="groupDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="グループの説明を入力"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              disabled={loading}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isPrivate">プライベートグループ</Label>
          </div>

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
