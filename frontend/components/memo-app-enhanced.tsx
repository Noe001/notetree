import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Users, User, Plus, Settings, HelpCircle, LogOut, Search, ArrowUpDown, FilePenLine, Lock, Menu, X, Palette, Keyboard, Check, Trash2, Share2
} from "lucide-react";

// shadcn/uiコンポーネントのインポート
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-simple";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// 認証関連のインポート
import { useAuth } from "@/lib/auth-context";
import { UserProfileDialog } from "@/components/auth/user-profile-dialog";

// ダイアログコンポーネントのインポート
import { MemoEditDialog } from "@/components/memo/memo-edit-dialog";
import { MemoDeleteDialog } from "@/components/memo/memo-delete-dialog";
import { GroupSettingsDialog } from "@/components/group/group-settings-dialog";

// リアルタイム関連のインポート（一時的に無効化）
// import { useMemoRealtime } from "@/hooks/useRealtime";
// import { UserPresenceIndicator } from "@/components/realtime/user-presence-indicator";
// import { MemoRealtimeEvent } from "@/lib/realtime";
// import { useRealtimeNotifications } from "@/components/notification/notification-provider";

// APIクライアントのインポート
import { apiClient, Memo as ApiMemo, CreateMemoDto, UpdateMemoDto } from "@/lib/api";

// --- 型定義 ---
type Memo = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
};

// 現在のユーザーID（実際のアプリでは認証から取得）
const CURRENT_USER_ID = 'dc9282c0-707f-4030-888d-cb1d414108f7';

// =================================================================
// コンポーネント 1: サイドバー（Sheetの中身）
// =================================================================
const SidebarContent = ({ onOpenSettings, onOpenProfile }: { onOpenSettings: () => void; onOpenProfile: () => void }) => {
  const { user } = useAuth();
  
  return (
  <aside className="flex flex-col h-full border-l bg-background">
    <div className="flex h-14 items-center border-b p-2 justify-between">
        <h2 className="font-bold text-lg ml-2">Notetree</h2>
        </div>
    <div className="flex flex-col p-2 space-y-2 flex-1">
          <button 
            onClick={onOpenProfile}
            className="flex items-center p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Avatar className="mr-3">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name || user?.email || 'ユーザー'} />
                  <AvatarFallback>{user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
              <div className="text-left">
                  <p className="font-semibold text-sm">{user?.user_metadata?.name || 'ユーザー'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          </button>
        <Separator/>
        <div>
            <h3 className="text-xs font-semibold text-muted-foreground my-2 px-2 flex items-center"><Users className="w-4 h-4 mr-2" />グループ</h3>
            <Button variant="secondary" className="w-full mb-2 justify-start">
                <User className="h-5 w-5" />
                <span className="ml-4">個人メモ</span>
                <Check className="w-4 h-4 ml-auto" />
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground justify-start">
                <Plus className="h-5 w-5" />
                <span className="ml-4">新しいグループ</span>
            </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 mt-2">
            <Button variant="ghost" className="w-full justify-start" onClick={onOpenSettings}>
                <Settings className="h-5 w-5" />
                <span className="ml-4">設定</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="h-5 w-5" />
                <span className="ml-4">ヘルプ</span>
            </Button>
        </nav>
        <Separator />
        <div className="mt-auto">
             <Button variant="ghost" className="w-full text-destructive hover:text-destructive justify-start">
                <LogOut className="h-5 w-5" />
                <span className="ml-4">ログアウト</span>
            </Button>
        </div>
    </div>
  </aside>
);
};

// =================================================================
// コンポーネント 2: メモ一覧の各アイテム
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
// コンポーネント 3: メモ一覧パネル（検索・ソート機能付き）
// =================================================================
type MemoListPanelProps = {
  memos: Memo[];
  selectedMemo: Memo | null;
  onSelectMemo: (memo: Memo) => void;
  onSearch: (query: string) => void;
  onSort: (key: keyof Memo) => void;
  onTagToggle: (tag: string) => void;
  activeTags: string[];
  onCreateMemo: () => void;
  allTags: string[];
};

const MemoListPanel = ({ memos, selectedMemo, onSelectMemo, onSearch, onSort, onTagToggle, activeTags, onCreateMemo, allTags }: MemoListPanelProps) => (
  <aside className="w-full md:w-80 border-r flex flex-col bg-background h-full">
    <div className="p-2 border-b flex items-center justify-between h-14">
        <h2 className="text-lg font-semibold px-2">メモ</h2>
        <Button variant="ghost" size="icon" aria-label="新しいメモを作成" title="新しいメモを作成" onClick={onCreateMemo}>
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
          <Select value="updatedAt" onValueChange={(value) => onSort(value as keyof Memo)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="ソート" />
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
);

// =================================================================
// コンポーネント 4: メモエディタ
// =================================================================
type MemoEditorProps = {
  memo: Memo | null;
  onUpdateMemo: (id: string, updates: UpdateMemoDto) => void;
};

const MemoEditor = ({ memo, onUpdateMemo }: MemoEditorProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    if (!memo || !hasChanges) return;

    const title = titleRef.current?.value || '';
    const tagsInput = tagsRef.current?.value || '';
    const content = contentRef.current?.value || '';
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    // 変更があった場合のみ更新
    if (title !== memo.title || content !== memo.content || JSON.stringify(tags) !== JSON.stringify(memo.tags)) {
      onUpdateMemo(memo.id, {
        title,
        content,
        tags,
      });
      setHasChanges(false);
    }
  };

  const handleInputChange = () => {
    setHasChanges(true);
  };

  // 入力値の変更を監視してデバウンス付きで保存
  useEffect(() => {
    if (!memo || !hasChanges) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // 2秒後に保存

    return () => clearTimeout(timeoutId);
  }, [hasChanges, memo?.id]);

  // メモが変更された時にhasChangesをリセット
  useEffect(() => {
    setHasChanges(false);
  }, [memo?.id]);

  if (!memo) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-muted/20">
        <div className="text-center">
          <FilePenLine className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">メモを選択してください</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            左のリストからメモを選ぶか、新しいメモを作成してください。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background">
        <div className="p-6 space-y-4 flex-1 flex flex-col overflow-y-auto">
            <Input
            ref={titleRef}
            key={`${memo.id}-title`}
            defaultValue={memo.title}
            placeholder="タイトル"
            className="text-2xl font-bold border-none focus-visible:ring-0 shadow-none p-0 h-auto"
            onChange={handleInputChange}
            onBlur={handleSave}
            />
            <Input
            ref={tagsRef}
            key={`${memo.id}-tags`}
            defaultValue={memo.tags.join(', ')}
            placeholder="カンマ区切りでタグを追加"
            className="border-none focus-visible:ring-0 shadow-none p-0 text-sm h-auto"
            onChange={handleInputChange}
            onBlur={handleSave}
            />
                  <Separator />
            <Textarea
            ref={contentRef}
            key={`${memo.id}-content`}
            defaultValue={memo.content}
            placeholder="内容を記述..."
            className="flex-1 w-full resize-none border-none focus-visible:ring-0 shadow-none p-0 text-base leading-relaxed"
            onChange={handleInputChange}
            onBlur={handleSave}
            />
        </div>
    </main>
  );
};

// =================================================================
// コンポーネント 5: ホバーで広がるプライバシーボタン
// =================================================================
const PrivacyToggleButton = ({ isPrivate, onClick }: { isPrivate: boolean; onClick: () => void; }) => {
    const [isHovered, setIsHovered] = useState(false);
    const text = isPrivate ? 'プライベート' : '共有可能';

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="transition-all duration-300 ease-in-out flex items-center justify-end overflow-hidden"
            style={{ width: isHovered ? '120px' : '40px', paddingRight: '10px' }}
        >
            <span
                className="mr-2 whitespace-nowrap text-sm font-medium"
                style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease-in-out 0.1s'
                }}
            >
                {text}
            </span>
            {isPrivate ? <Lock className="h-5 w-5 flex-shrink-0" /> : <Share2 className="h-5 w-5 flex-shrink-0" />}
        </Button>
    );
};


// =================================================================
// メインのAppコンポーネント (全体の司令塔)
// =================================================================
export default function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Memo>('updatedAt');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  // メモダイアログの状態
  const [isMemoEditDialogOpen, setMemoEditDialogOpen] = useState(false);
  const [isMemoDeleteDialogOpen, setMemoDeleteDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [deletingMemo, setDeletingMemo] = useState<Memo | null>(null);

  // グループダイアログの状態
  const [isGroupSettingsDialogOpen, setGroupSettingsDialogOpen] = useState(false);

  // リアルタイム機能の状態
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [userPresences, setUserPresences] = useState<Map<string, any>>(new Map());
  const [connectedUsers, setConnectedUsers] = useState<Map<string, { name: string; email: string; avatar?: string }>>(new Map());

  // 全タグを更新する関数
  const updateAllTags = (memos: Memo[]) => {
    const tagSet = new Set<string>();
    memos.forEach(memo => {
      memo.tags.forEach(tag => {
        if (tag.trim()) { // 空のタグは除外
          tagSet.add(tag);
        }
      });
    });
    const newTags = Array.from(tagSet);
    setAllTags(newTags);
    
    // アクティブタグからも存在しないタグを削除
    setActiveTags(prev => prev.filter(tag => newTags.includes(tag)));
  };

  // メモ一覧を取得
  const fetchMemos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMemos(CURRENT_USER_ID);
      if (response.success && response.data) {
        const convertedMemos: Memo[] = response.data.map(apiMemo => ({
          id: apiMemo.id,
          title: apiMemo.title,
          content: apiMemo.content,
          tags: apiMemo.tags,
          updatedAt: apiMemo.updatedAt,
          createdAt: apiMemo.createdAt,
          isPrivate: apiMemo.isPrivate,
        }));
        setMemos(convertedMemos);
        
        // 実際に使用されているタグのみを収集
        updateAllTags(convertedMemos);

        // 選択中のメモがない場合、最初のメモを選択
        if (!selectedMemo && convertedMemos.length > 0) {
          setSelectedMemo(convertedMemos[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 新しいメモを作成（既存の空メモ作成）
  const createMemo = async () => {
    try {
      const newMemoData: CreateMemoDto = {
        title: '',
        content: '',
        tags: [],
        isPrivate: true,
      };
      
      const response = await apiClient.createMemo(newMemoData);
      if (response.success && response.data) {
        const newMemo: Memo = {
          id: response.data.id,
          title: response.data.title,
          content: response.data.content,
          tags: response.data.tags,
          updatedAt: response.data.updatedAt,
          createdAt: response.data.createdAt,
          isPrivate: response.data.isPrivate,
        };
        
        const newMemos = [newMemo, ...memos];
        setMemos(newMemos);
        setSelectedMemo(newMemo);
        
        // タグリストを更新
        updateAllTags(newMemos);
      }
    } catch (error) {
      console.error('Failed to create memo:', error);
    }
  };



  // メモを更新
  const updateMemo = async (id: string, updates: UpdateMemoDto) => {
    try {
      const response = await apiClient.updateMemo(id, updates);
      if (response.success && response.data) {
        const updatedMemo: Memo = {
          id: response.data.id,
          title: response.data.title,
          content: response.data.content,
          tags: response.data.tags,
          updatedAt: response.data.updatedAt,
          createdAt: response.data.createdAt,
          isPrivate: response.data.isPrivate,
        };
        
        const newMemos = memos.map(memo => memo.id === id ? updatedMemo : memo);
        setMemos(newMemos);
        if (selectedMemo?.id === id) {
          setSelectedMemo(updatedMemo);
        }

        // 使用されているタグのみを更新
        updateAllTags(newMemos);
      }
    } catch (error) {
      console.error('Failed to update memo:', error);
    }
  };

  // メモを削除
  const deleteMemo = async (id: string) => {
    try {
      const response = await apiClient.deleteMemo(id);
      if (response.success) {
        const newMemos = memos.filter(memo => memo.id !== id);
        setMemos(newMemos);
        
        if (selectedMemo?.id === id) {
          setSelectedMemo(newMemos.length > 0 ? newMemos[0] : null);
        }

        // タグリストを更新（使用されていないタグを削除）
        updateAllTags(newMemos);
      }
    } catch (error) {
      console.error('Failed to delete memo:', error);
    }
  };

  // 初回ロード時にメモを取得
  useEffect(() => {
    fetchMemos();
  }, []);

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setSidebarOpen(false); 
  }

  const handleOpenSettings = () => {
    setSidebarOpen(false); 
    setTimeout(() => {
        setSettingsDialogOpen(true);
    }, 150);
  };

  const handleOpenProfile = () => {
    setSidebarOpen(false); 
    setTimeout(() => {
        setProfileDialogOpen(true);
    }, 150);
  };

  // メモダイアログハンドラー
  const handleOpenMemoCreate = () => {
    // ダイアログを表示せずに直接メモを作成
    createMemo();
  };

  const handleOpenMemoEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setMemoEditDialogOpen(true);
  };

  const handleOpenMemoDelete = (memo: Memo) => {
    setDeletingMemo(memo);
    setMemoDeleteDialogOpen(true);
  };

  // グループダイアログハンドラー
  const handleOpenGroupSettings = () => {
    setSidebarOpen(false);
    setTimeout(() => {
        setGroupSettingsDialogOpen(true);
    }, 150);
  };

  // リアルタイム機能は一時的に無効化

  // リアルタイム購読（一時的に無効化）
  // const { isConnected } = useMemoRealtime(currentGroupId, handleMemoRealtimeEvent);
  
  // リアルタイム通知（一時的に無効化）
  // const {
  //   notifyMemoCreated,
  //   notifyMemoUpdated,
  //   notifyMemoDeleted,
  //   notifyError,
  //   notifySuccess
  // } = useRealtimeNotifications();

  const handleDeleteMemo = () => {
    if (!selectedMemo) return;
    handleOpenMemoDelete(selectedMemo);
  };

  const handleTogglePrivacy = () => {
    if (!selectedMemo) return;
    updateMemo(selectedMemo.id, { isPrivate: !selectedMemo.isPrivate });
  };

  const filteredAndSortedMemos = useMemo(() => {
    let filtered = memos.filter(memo =>
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTags.length > 0) {
      filtered = filtered.filter(memo => activeTags.every(tag => memo.tags.includes(tag)));
    }

    return filtered.sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title, 'ja');
      }
      if (sortKey === 'updatedAt' || sortKey === 'createdAt') {
        return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
      }
      return 0;
    });
  }, [memos, searchQuery, sortKey, activeTags]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      <div className="flex flex-1 min-w-0">
        {/* メモ一覧は常に表示（デスクトップ） */}
        <div className="flex">
      <MemoListPanel
                memos={filteredAndSortedMemos}
        selectedMemo={selectedMemo}
                onSelectMemo={setSelectedMemo}
                onSearch={setSearchQuery}
                onSort={setSortKey}
                onTagToggle={handleTagToggle}
                activeTags={activeTags}
                onCreateMemo={handleOpenMemoCreate}
                allTags={allTags}
            />
        </div>
        <MemoEditor memo={selectedMemo} onUpdateMemo={updateMemo} />
      </div>
      
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
        {selectedMemo && (
          <>
            {/* ユーザープレゼンスインジケーター（一時的に無効化） */}
            {/* <UserPresenceIndicator 
              presences={userPresences} 
              users={connectedUsers}
              className="mr-4"
            /> */}

            <PrivacyToggleButton isPrivate={selectedMemo.isPrivate} onClick={handleTogglePrivacy} />

            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteMemo} title="メモを削除">
                <Trash2 className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {/* ハンバーガーメニューは常に表示 */}
        <Button 
          variant="ghost" 
          size="icon" 
          title="メニューを開く"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* サイドバーSheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="p-0 w-80">
          <SheetHeader className="sr-only">
            <SheetTitle>メニュー</SheetTitle>
            <SheetDescription>
              メインメニューと設定オプション
            </SheetDescription>
          </SheetHeader>
          {/* デスクトップでは常にサイドバーコンテンツを表示 */}
          <SidebarContent onOpenSettings={handleOpenSettings} onOpenProfile={handleOpenProfile} />
        </SheetContent>
      </Sheet>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>設定</DialogTitle>
                <DialogDescription>
                    アプリの表示や動作に関する設定を変更します。
                </DialogDescription>
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

      <UserProfileDialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen} />

      {/* メモ作成ダイアログは削除（直接メモ作成に変更） */}

      <MemoEditDialog 
        open={isMemoEditDialogOpen} 
        onOpenChange={setMemoEditDialogOpen}
        memo={editingMemo}
        onUpdateMemo={async (id, memoData) => {
          await updateMemo(id, memoData);
          setEditingMemo(null);
        }}
      />

      <MemoDeleteDialog 
        open={isMemoDeleteDialogOpen} 
        onOpenChange={setMemoDeleteDialogOpen}
        memo={deletingMemo}
        onDeleteMemo={async (id) => {
          await deleteMemo(id);
          setDeletingMemo(null);
        }}
      />

      {/* グループダイアログ */}
      <GroupSettingsDialog 
        open={isGroupSettingsDialogOpen} 
        onOpenChange={setGroupSettingsDialogOpen}
        group={null} // TODO: 現在のグループを渡す
        members={[]} // TODO: グループメンバーを渡す
        currentUserId="current-user-id" // TODO: 現在のユーザーIDを渡す
        onUpdateGroup={async (id, data) => {
          // TODO: グループ更新API呼び出し
          console.log('Update group:', id, data);
        }}
        onInviteMember={async (groupId, email, role) => {
          // TODO: メンバー招待API呼び出し
          console.log('Invite member:', groupId, email, role);
        }}
        onRemoveMember={async (groupId, memberId) => {
          // TODO: メンバー削除API呼び出し
          console.log('Remove member:', groupId, memberId);
        }}
        onUpdateMemberRole={async (groupId, memberId, role) => {
          // TODO: メンバーロール更新API呼び出し
          console.log('Update member role:', groupId, memberId, role);
        }}
        onDeleteGroup={async (id) => {
          // TODO: グループ削除API呼び出し
          console.log('Delete group:', id);
        }}
      />
    </div>
  );
} 
