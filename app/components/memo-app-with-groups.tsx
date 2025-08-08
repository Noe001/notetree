import React, { useState, useMemo, useEffect } from "react";
import {
  Users, User, Plus, Settings, HelpCircle, LogOut, Search, ArrowUpDown, FilePenLine, Lock, Menu, X, Palette, Keyboard, Check, Trash2, Share2, ChevronRight
} from "lucide-react";

// shadcn/uiコンポーネントのインポート
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// グループ関連コンポーネントのインポート
import { GroupManager } from "@/components/group-manager";
import { useMemos, useGroups } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { CreateMemoDto } from "@/lib/api"; // CreateMemoDtoをlib/apiからインポート
import { useAppNotifications } from "@/components/notification/notification-provider";

// --- 型定義とユーティリティ ---
const isValidDateString = (dateStr: string): boolean => {
  return !isNaN(Date.parse(dateStr));
};

type Memo = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
  authorId: string; // userIdをauthorIdに変更
  groupId?: string | null;
};

// =================================================================
// コンポーネント 1: 設定ダイアログ
// =================================================================
const SettingsDialog = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="ghost" className={`w-full justify-start ${isCollapsed ? 'justify-center' : ''}`}>
                <Settings className="w-4 h-4" />
                {!isCollapsed && <span className="ml-2">設定</span>}
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>設定</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div className="space-y-3">
                    <Label className="flex items-center"><Palette className="w-4 h-4 mr-2" />色設定</Label>
                    <div className="flex space-x-4">
                        <Button variant="outline">ライト</Button>
                        <Button variant="secondary">ダーク</Button>
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="flex items-center"><Keyboard className="w-4 h-4 mr-2" />キーボードショートカット</Label>
                     <div className="flex items-center space-x-2">
                        <Switch id="shortcuts-enabled" defaultChecked />
                        <Label htmlFor="shortcuts-enabled">有効にする</Label>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);

// =================================================================
// コンポーネント 2: 右サイドバー（スライドアニメーション対応）
// =================================================================
const RightSidebar = ({ 
  isOpen, 
  currentUserId,
  selectedGroupId,
  onGroupSelect
}: { 
  isOpen: boolean;
  currentUserId: string;
  selectedGroupId?: string;
  onGroupSelect: (groupId: string) => void;
}) => {
  const { signOut } = useAuth();
  return (
  <aside className={`${isOpen ? 'translate-x-0' : 'translate-x-full'} fixed right-0 top-0 h-full lg:flex-col border-l bg-background transition-transform duration-300 ease-in-out w-64 z-40`}>
    <div className="flex flex-col p-2 space-y-4 flex-1">
        <div className="flex items-center p-2">
            <Avatar className="mr-3">
                <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold text-sm">デモユーザー</p>
                <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
        </div>
        <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />グループ
            </h3>
            <GroupManager 
              currentUserId={currentUserId}
              selectedGroupId={selectedGroupId}
              onGroupSelect={onGroupSelect}
            />
        </div>
        <div className="flex-1" />
        <div className="space-y-1">
            <SettingsDialog isCollapsed={false} />
            <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                ヘルプ
            </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
            </Button>
        </div>
    </div>
  </aside>
);
}

// =================================================================
// コンポーネント 3: メモ一覧の各アイテム
// =================================================================
type MemoItemProps = {
  memo: Memo;
  isSelected: boolean;
  onSelect: (memo: Memo) => void;
};

const MemoItem = ({ memo, isSelected, onSelect }: MemoItemProps) => (
  <div
    onClick={() => onSelect(memo)}
    className={`p-4 border-b cursor-pointer hover:bg-accent ${isSelected ? 'bg-secondary' : ''}`}
  >
    <div className="flex justify-between items-start">
      <h4 className="font-semibold truncate pr-2">{memo.title || '無題'}</h4>
      <time className="text-xs text-muted-foreground flex-shrink-0">
        {new Date(memo.updatedAt).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
      </time>
    </div>
    <p className="text-sm text-muted-foreground truncate mt-1">
      {memo.content}
    </p>
    <div className="flex items-center justify-between mt-2">
      <div className="flex gap-1.5 overflow-hidden">
        {memo.tags.map(tag => <Badge key={tag} variant="outline" className="flex-shrink-0">{tag}</Badge>)}
      </div>
      {memo.isPrivate && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
    </div>
  </div>
);

// =================================================================
// コンポーネント 4: メモ一覧パネル（検索・ソート機能付き）
// =================================================================
type MemoListPanelProps = {
  memos: Memo[];
  selectedMemo: Memo | null;
  onSelectMemo: (memo: Memo) => void;
  onSearch: (query: string) => void;
  onSort: (key: 'updatedAt' | 'createdAt' | 'title') => void;
  onTagToggle: (tag: string) => void;
  activeTags: string[];
  sortKey: 'updatedAt' | 'createdAt' | 'title'; // ソート可能なキーに制限
  onCreateMemo: () => void;
  currentUserId: string;
};

const MemoListPanel = ({ 
  memos, 
  selectedMemo, 
  onSelectMemo, 
  onSearch, 
  onSort, 
  onTagToggle, 
  activeTags, 
  sortKey,
  onCreateMemo,
  currentUserId
}: MemoListPanelProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { createMemo } = useMemos();
  const notify = useAppNotifications();

  const handleCreateMemo = async (memoData: any) => {
    try {
      // グループIDが空文字列またはundefinedの場合はnullに変換
      const groupId = memoData.groupId === '' || memoData.groupId === undefined ? null : memoData.groupId;
      await createMemo({
        ...memoData,
        groupId,
        authorId: currentUserId
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('メモ作成エラー:', error);
      notify.error('メモの作成に失敗しました');
    }
  };

  // すべてのタグを取得
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    memos.forEach(memo => {
      memo.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [memos]);

  return (
    <>
      <aside className="w-full md:w-80 border-r flex flex-col bg-background">
        <div className="p-2 border-b flex items-center justify-between h-14">
            <h2 className="text-lg font-semibold px-2">メモ</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowCreateDialog(true)}
              aria-label="新しいメモを作成"
            >
                <FilePenLine className="w-5 h-5" />
            </Button>
        </div>
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="メモを検索..." className="pl-9" onChange={(e) => onSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">並べ替え</Label>
            <div className="flex items-center space-x-2">
              <Select value={sortKey} onValueChange={(value) => onSort(value as 'updatedAt' | 'createdAt' | 'title')}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="並べ替え" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">更新日時</SelectItem>
                  <SelectItem value="createdAt">作成日時</SelectItem>
                  <SelectItem value="title">タイトル</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-2">タグ</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={activeTags.includes(tag) ? "default" : "secondary"}
                onClick={() => onTagToggle(tag)}
                className="cursor-pointer"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {memos.length > 0 ? (
            memos.map(memo => (
              <MemoItem
                key={memo.id}
                memo={memo}
                isSelected={selectedMemo?.id === memo.id}
                onSelect={onSelectMemo}
              />
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">メモが見つかりません。</p>
          )}
        </div>
      </aside>

      {/* MemoCreateDialogWithGroupは削除 */}
    </>
  );
};

// =================================================================
// コンポーネント 5: メモエディタ（右上ヘッダー対応）
// =================================================================
type MemoEditorProps = {
  memo: Memo | null;
  onToggleSidebar: () => void;
  onDeleteMemo?: () => void;
  onShareMemo?: () => void;
  isRightSidebarOpen: boolean;
  onUpdateMemo?: (id: string, updates: Partial<Memo>) => Promise<Memo | undefined>;
  onCreateMemo?: (memoData: CreateMemoDto) => Promise<Memo | undefined>;
};

const MemoEditor = ({ memo, onToggleSidebar, onDeleteMemo, onShareMemo, isRightSidebarOpen, onUpdateMemo, onCreateMemo }: MemoEditorProps) => {
  const [title, setTitle] = useState(memo?.title || '');
  const [tags, setTags] = useState(memo?.tags.join(', ') || '');
  const [content, setContent] = useState(memo?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // メモが変更されたときにローカルステートを更新
  useEffect(() => {
    if (memo) {
      setTitle(memo.title);
      setTags(memo.tags.join(', '));
      setContent(memo.content);
    }
  }, [memo]);

  // 自動保存機能
  useEffect(() => {
    if (!memo || !onUpdateMemo) return;

    const saveTimeout = setTimeout(async () => {
      // 変更がある場合のみ保存
      const hasChanges = 
        title !== memo.title || 
        tags !== memo.tags.join(', ') || 
        content !== memo.content;

      if (hasChanges) {
        try {
          setIsSaving(true);
          const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          await onUpdateMemo(memo.id, {
            title,
            content,
            tags: tagArray
          });
          setLastSaved(new Date().toLocaleTimeString('ja-JP'));
        } catch (error) {
          console.error('自動保存エラー:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000); // 1秒後に自動保存

    return () => clearTimeout(saveTimeout);
  }, [title, tags, content, memo, onUpdateMemo]);

  if (!memo) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
        <div className="text-center">
          <FilePenLine className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">メモを選択してください</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            左のリストからメモを選ぶか、新しいメモを作成してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background">
        <header className="flex items-center justify-between p-2 border-b h-14 flex-shrink-0 relative">
            <div className="text-xs text-muted-foreground ml-2">
              {isSaving ? '保存中...' : lastSaved ? `保存済み: ${lastSaved}` : ''}
            </div>
            <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onShareMemo}
                    title="共有設定"
                >
                    <Share2 className="w-5 h-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onDeleteMemo}
                    title="メモを削除"
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onToggleSidebar} 
                    title={isRightSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                    className="transition-all duration-300 ease-in-out"
                >
                    {isRightSidebarOpen ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </Button>
            </div>
        </header>
        <div className="p-6 space-y-4 flex-1 flex flex-col overflow-y-auto">
            <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            className="text-2xl font-bold border-none focus-visible:ring-0 shadow-none p-0 h-auto"
            />
            <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="カンマ区切りでタグを追加"
            className="border-none focus-visible:ring-0 shadow-none p-0 text-sm h-auto"
            />
            <Separator />
            <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="内容を記述..."
            className="flex-1 w-full resize-none border-none focus-visible:ring-0 shadow-none p-0 text-base leading-relaxed"
            />
        </div>
    </main>
  );
};

// =================================================================
// メインのAppコンポーネント (全体の司令塔)
// =================================================================
export default function MemoAppWithGroups() {
  const { user } = useAuth();
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isMobileMemoListOpen, setMobileMemoListOpen] = useState(false);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  const { memos, loading, error, fetchMemos, updateMemo, createMemo } = useMemos(user?.id, selectedGroupId);
  const { groups } = useGroups();

  useEffect(() => {
    if (user?.id) {
      fetchMemos();
    }
  }, [user?.id, selectedGroupId, fetchMemos]);

  const handleCreateNewMemo = () => {
    setSelectedMemo({
      id: 'new-memo',
      title: '',
      content: '',
      tags: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isPrivate: false,
      authorId: user!.id, // userIdをauthorIdにマッピング
      groupId: selectedGroupId || null,
    });
  };

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setMobileMemoListOpen(false); // モバイルでメモを選択したらサイドバーを閉じる
  }

  const filteredAndSortedMemos = useMemo(() => {
    if (!memos) return [];
    
    let filteredMemos = memos.filter(memo =>
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTags.length > 0) {
      filteredMemos = filteredMemos.filter(memo => activeTags.every(tag => memo.tags.includes(tag)));
    }

    return filteredMemos.sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title, 'ja');
      }
      const dateA = new Date(String(a[sortKey]));
      const dateB = new Date(String(b[sortKey]));
      return dateB.getTime() - dateA.getTime();
    });
  }, [memos, searchQuery, sortKey, activeTags]);

  const handleDeleteMemo = () => {
    if (selectedMemo) {
      console.log('Delete memo:', selectedMemo.id);
    }
  };

  const handleShareMemo = () => {
    if (selectedMemo) {
      console.log('Share memo:', selectedMemo.id);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedMemo(null); // グループ変更時に選択中のメモをクリア
  };

  if (!user) {
    return <div>ログインしてください</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      <div className="flex flex-1 min-w-0">
        {/* モバイル用メモリスト */}
        <div className="md:hidden">
            <Sheet open={isMobileMemoListOpen} onOpenChange={setMobileMemoListOpen}>
                <SheetTrigger>
                    <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-10">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent className="p-0 w-80">
                    <MemoListPanel
                        memos={filteredAndSortedMemos}
                        selectedMemo={selectedMemo}
                        onSelectMemo={handleSelectMemo}
                        onSearch={setSearchQuery}
                        onSort={setSortKey}
                        onTagToggle={handleTagToggle}
                        activeTags={activeTags}
                        sortKey={sortKey}
                        onCreateMemo={handleCreateNewMemo}
                        currentUserId={user.id}
                    />
                </SheetContent>
            </Sheet>
        </div>

        {/* PC用メモリスト */}
        <div className="hidden md:flex">
            <MemoListPanel
                memos={filteredAndSortedMemos}
                selectedMemo={selectedMemo}
                onSelectMemo={handleSelectMemo}
                onSearch={setSearchQuery}
                onSort={setSortKey}
                onTagToggle={handleTagToggle}
                activeTags={activeTags}
                sortKey={sortKey}
                onCreateMemo={handleCreateNewMemo}
                currentUserId={user.id}
            />
        </div>

        <MemoEditor 
            memo={selectedMemo} 
            onToggleSidebar={() => setRightSidebarOpen(!isRightSidebarOpen)}
            onDeleteMemo={handleDeleteMemo}
            onShareMemo={handleShareMemo}
            isRightSidebarOpen={isRightSidebarOpen}
            onUpdateMemo={updateMemo}
            onCreateMemo={createMemo}
        />
      </div>
      {/* 右サイドバー */}
      <RightSidebar 
        isOpen={isRightSidebarOpen} 
        currentUserId={user.id}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleGroupSelect}
      />
      {/* オーバーレイ（メモエディタエリアのみ） */}
      {isRightSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 z-30 md:left-80"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}
    </div>
  );
}
