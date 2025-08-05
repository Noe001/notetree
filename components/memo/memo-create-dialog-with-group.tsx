import React, { useState } from 'react';
import { Plus, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGroups } from '@/hooks/useApi';

interface MemoCreateDialogWithGroupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (memo: { title: string; content: string; tags: string[]; groupId?: string | null }) => Promise<void>;
  loading?: boolean;
}

export function MemoCreateDialogWithGroup({ 
  open, 
  onOpenChange, 
  onCreate,
  loading = false 
}: MemoCreateDialogWithGroupProps) {
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' });
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { groups, loading: groupsLoading } = useGroups();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    try {
      setError(null);
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      // グループIDがundefinedの場合はnullに変換
      const groupId = selectedGroupId === undefined ? null : selectedGroupId;
      await onCreate({
        title: formData.title,
        content: formData.content,
        tags,
        groupId
      });
      setFormData({ title: '', content: '', tags: '' });
      setSelectedGroupId(undefined);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'メモの作成に失敗しました');
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '', tags: '' });
    setSelectedGroupId(undefined);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新しいメモを作成
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="メモのタイトルを入力"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="メモの内容を入力"
              rows={4}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="tags">タグ</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="タグをカンマ区切りで入力"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">例: 仕事,個人,重要</p>
          </div>

          <div>
            <Label htmlFor="group">グループ</Label>
            <Select 
              value={selectedGroupId || ''} 
              onValueChange={(value) => setSelectedGroupId(value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="グループを選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">グループなし</SelectItem>
                {groups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? '作成中...' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
