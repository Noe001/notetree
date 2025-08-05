import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Users, User, Plus, Settings, HelpCircle, LogOut, Search, ArrowUpDown, FilePenLine, Lock, Menu, X, Palette, Keyboard, Check, Trash2, Share2
} from "lucide-react";
import Link from 'next/link';

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
import { MemoCreateDialog } from "@/components/memo/memo-create-dialog";
import { MemoEditDialog } from "@/components/memo/memo-edit-dialog";
import { MemoDeleteDialog } from "@/components/memo/memo-delete-dialog";
import { GroupSettingsDialog } from "@/components/group/group-settings-dialog";
import { MemberManagementDialog } from "@/components/group/member-management-dialog";
import { SearchResultsDialog } from "@/components/search/search-results-dialog";
import { ExportImportDialog } from "@/components/data/export-import-dialog";
import { KeyboardShortcutsDialog } from "@/components/help/keyboard-shortcuts-dialog";
import { CreateGroupDialog } from "@/components/group/create-group-dialog";
import { JoinGroupDialog } from "@/components/group/join-group-dialog";

// リアルタイム関連のインポート（一時的に無効化）
// import { useMemoRealtime } from "@/hooks/useRealtime";
// import { UserPresenceIndicator } from "@/components/realtime/user-presence-indicator";
// import { MemoRealtimeEvent } from "@/lib/realtime";
// import { useRealtimeNotifications } from "@/components/notification/notification-provider";

// APIクライアントのインポート
import { apiClient, Memo as ApiMemo, CreateMemoDto, UpdateMemoDto } from "@/lib/api";
import { useGroups } from "@/hooks/useApi";

// --- 型定義 ---
type Memo = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
  groupId?: string | null;
};

// 現在のユーザーID（実際のアプリでは認証から取得）
const CURRENT_USER_ID = 'e87a6ec4-16b8-44c7-b339-604f62d9557c';

// =================================================================
// コンポーネント 1: サイドバー（Sheetの中身）
// =================================================================
const SidebarContent = ({ 
  onOpenSettings, 
  onOpenProfile,
  onOpenMemberManagement,
  onOpenSearchResults,
  onOpenExportImport,
  onOpenKeyboardShortcuts,
  onOpenCreateGroup,
  onOpenJoinGroup,
  groups,
  selectedGroupId,
  onGroupSelect
}: { 
  onOpenSettings: () => void; 
  onOpenProfile: () => void;
  onOpenMemberManagement: () => void;
  onOpenSearchResults: () => void;
  onOpenExportImport: () => void;
  onOpenKeyboardShortcuts: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  groups: any[];
  selectedGroupId?: string;
  onGroupSelect: (groupId: string | undefined) => void;
}) => {
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
                  <AvatarImage src="" alt={user?.name || user?.email || 'ユーザー'} />
                  <AvatarFallback>{user?.name?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
              <div className="text-left">
                  <p className="font-semibold text-sm">{user?.name || 'ユーザー'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          </button>
        <Separator/>
        <div>
            <Button 
              variant={selectedGroupId ? "ghost" : "secondary"} 
              className="w-full mb-2 justify-start"
              onClick={() => onGroupSelect(undefined)}
            >
                <User className="h-5 w-5" />
                <span className="ml-4">個人メモ</span>
                {!selectedGroupId && <Check className="w-4 h-4 ml-auto" />}
            </Button>
            <h3 className="text-xs font-semibold text-muted-foreground my-2 px-2 flex items-center"><Users className="w-4 h-4 mr-2" />グループ</h3>
            {groups.map((group) => (
              <Button
                key={group.id}
                variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                className="w-full mb-1 justify-start"
                onClick={() => onGroupSelect(group.id)}
              >
                <Users className="h-5 w-5" />
                <span className="ml-4 truncate">{group.name}</span>
                {selectedGroupId === group.id && <Check className="w-4 h-4 ml-auto" />}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground justify-start mt-2"
              onClick={onOpenCreateGroup}
            >
                <Plus className="h-5 w-5" />
                <span className="ml-4">新しいグループ</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground justify-start"
              onClick={onOpenJoinGroup}
            >
                <Users className="h-5 w-5" />
                <span className="ml-4">グループに参加</span>
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
  selectedGroupId?: string;
  groups: any[];
};

const MemoListPanel = ({ memos, selectedMemo, onSelectMemo, onSearch, onSort, onTagToggle, activeTags, onCreateMemo, allTags, selectedGroupId, groups }: MemoListPanelProps) => {
  // ヘッダーのタイトルを動的に決定
  const headerTitle = useMemo(() => {
    if (selectedGroupId) {
      const selectedGroup = groups?.find((group: any) => group.id === selectedGroupId);
      return selectedGroup ? selectedGroup.name : 'グループ';
    }
    return '個人メモ';
  }, [selectedGroupId, groups]);

  return (
  <aside className="w-full md:w-80 border-r flex flex-col bg-background h-full">
    <div className="p-2 border-b flex items-center justify-between h-14">
        <h2 className="text-lg font-semibold px-2">{headerTitle}</h2>
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
};

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
  const { user } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Memo>('updatedAt');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [groups, setGroups] = useState<any[]>([]);
  
  // ダイアログの状態管理
  const [createMemoDialogOpen, setCreateMemoDialogOpen] = useState(false);
  const [editMemoDialogOpen, setEditMemoDialogOpen] = useState(false);
  const [deleteMemoDialogOpen, setDeleteMemoDialogOpen] = useState(false);
  const [memoToEdit, setMemoToEdit] = useState<Memo | null>(null);
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  
  // その他の状態管理
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);

  // グループダイアログの状態
  const [isGroupSettingsDialogOpen, setGroupSettingsDialogOpen] = useState(false);
  const [isMemberManagementDialogOpen, setMemberManagementDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [isJoinGroupDialogOpen, setJoinGroupDialogOpen] = useState(false);
  const [isSearchResultsDialogOpen, setSearchResultsDialogOpen] = useState(false);
  const [isExportImportDialogOpen, setExportImportDialogOpen] = useState(false);
  const [isKeyboardShortcutsDialogOpen, setKeyboardShortcutsDialogOpen] = useState(false);

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
      const response = await apiClient.getMemos(user?.id, selectedGroupId);
      if (response.success && response.data) {
        const convertedMemos: Memo[] = response.data.map(apiMemo => ({
          id: apiMemo.id,
          title: apiMemo.title,
          content: apiMemo.content,
          tags: apiMemo.tags,
          updatedAt: apiMemo.updatedAt,
          createdAt: apiMemo.createdAt,
          isPrivate: apiMemo.isPrivate,
          groupId: apiMemo.groupId || null,
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

  // 新しいメモを作成（ダイアログを使用）
  const createMemo = async (memoData: { title: string; content: string; tags: string[]; isPrivate: boolean }) => {
    try {
      const newMemoData: CreateMemoDto = {
        title: memoData.title,
        content: memoData.content,
        tags: memoData.tags,
        isPrivate: memoData.isPrivate,
        groupId: selectedGroupId || null,
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
          groupId: response.data.groupId || null,
        };
        
        const newMemos = [newMemo, ...memos];
        setMemos(newMemos);
        setSelectedMemo(newMemo);
        
        // タグリストを更新
        updateAllTags(newMemos);
      } else {
        throw new Error(response.error || 'メモの作成に失敗しました');
      }
    } catch (error: any) {
      console.error('Failed to create memo:', error);
      throw new Error(error.message || 'メモの作成に失敗しました');
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
          groupId: response.data.groupId || null, // グループIDも含める
        };
        
        const newMemos = memos.map(memo => memo.id === id ? updatedMemo : memo);
        setMemos(newMemos);
        if (selectedMemo?.id === id) {
          setSelectedMemo(updatedMemo);
        }

        // 使用されているタグのみを更新
        updateAllTags(newMemos);
      } else {
        throw new Error(response.error || 'メモの更新に失敗しました');
      }
    } catch (error: any) {
      console.error('Failed to update memo:', error);
      throw new Error(error.message || 'メモの更新に失敗しました');
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
      } else {
        throw new Error(response.error || 'メモの削除に失敗しました');
      }
    } catch (error: any) {
      console.error('Failed to delete memo:', error);
      throw new Error(error.message || 'メモの削除に失敗しました');
    }
  };

  // 初回ロード時にメモを取得
  useEffect(() => {
    fetchMemos();
  }, []);

  // グループ選択時にメモを再取得
  useEffect(() => {
    fetchMemos();
  }, [selectedGroupId]);

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
    setCreateMemoDialogOpen(true);
  };

  const handleOpenMemoEdit = (memo: Memo) => {
    setMemoToEdit(memo);
    setEditMemoDialogOpen(true);
  };

  const handleOpenMemoDelete = (memo: Memo) => {
    setMemoToDelete(memo);
    setDeleteMemoDialogOpen(true);
  };

  // グループダイアログハンドラー
  const handleOpenGroupSettings = () => {
    setSidebarOpen(false);
    setTimeout(() => {
        setGroupSettingsDialogOpen(true);
    }, 150);
  };

  const handleOpenCreateGroup = () => {
    setSidebarOpen(false);
    setTimeout(() => {
        setCreateGroupDialogOpen(true);
    }, 150);
  };

  const handleOpenJoinGroup = () => {
    setSidebarOpen(false);
    setTimeout(() => {
        setJoinGroupDialogOpen(true);
    }, 150);
  };

  const handleCreateGroup = async (groupData: { name: string; description?: string }) => {
    try {
      // グループ作成のロジックを実装
      console.log('Creating group:', groupData);
      // 実際のAPI呼び出しをここに実装
      
      // グループリストを更新
      setGroups(prevGroups => [...prevGroups, { id: Date.now().toString(), ...groupData }]);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  };

  const handleJoinByGroupId = async (groupId: string) => {
    try {
      // グループ参加のロジックを実装
      console.log('Joining group by ID:', groupId);
      // 実際のAPI呼び出しをここに実装
      
      // グループリストを更新
      setGroups(prevGroups => [...prevGroups, { id: groupId, name: `Group ${groupId}` }]);
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  };

  const handleJoinByInvitation = async (invitationToken: string) => {
    try {
      // 招待トークンでのグループ参加のロジックを実装
      console.log('Joining group by invitation:', invitationToken);
      // 実際のAPI呼び出しをここに実装
      
      // グループリストを更新
      setGroups(prevGroups => [...prevGroups, { id: Date.now().toString(), name: 'Invited Group' }]);
    } catch (error) {
      console.error('Failed to join group by invitation:', error);
      throw error;
    }
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
    let filtered = memos.filter(memo => {
      // 検索クエリでフィルタリング
      const matchesSearch = memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           memo.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // タグでフィルタリング
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => memo.tags.includes(tag));
      
      // グループでフィルタリング
      const matchesGroup = selectedGroupId 
        ? memo.groupId === selectedGroupId 
        : !memo.groupId || memo.groupId === null;
      
      return matchesSearch && matchesTags && matchesGroup;
    });

    return filtered.sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title, 'ja');
      }
      if (sortKey === 'updatedAt' || sortKey === 'createdAt') {
        return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
      }
      return 0;
    });
  }, [memos, searchQuery, sortKey, activeTags, selectedGroupId]);

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
        selectedGroupId={selectedGroupId}
        groups={groups || []}
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
          <SidebarContent 
            onOpenSettings={handleOpenSettings} 
            onOpenProfile={handleOpenProfile}
            onOpenMemberManagement={() => {
              setSidebarOpen(false);
              setTimeout(() => setMemberManagementDialogOpen(true), 150);
            }}
            onOpenSearchResults={() => {
              setSidebarOpen(false);
              setTimeout(() => setSearchResultsDialogOpen(true), 150);
            }}
            onOpenExportImport={() => {
              setSidebarOpen(false);
              setTimeout(() => setExportImportDialogOpen(true), 150);
            }}
            onOpenKeyboardShortcuts={() => {
              setSidebarOpen(false);
              setTimeout(() => setKeyboardShortcutsDialogOpen(true), 150);
            }}
            onOpenCreateGroup={handleOpenCreateGroup}
            onOpenJoinGroup={handleOpenJoinGroup}
            groups={groups || []}
            selectedGroupId={selectedGroupId}
            onGroupSelect={(groupId) => {
              setSelectedGroupId(groupId);
              setSidebarOpen(false);
            }}
          />
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

      <UserProfileDialog 
        open={isProfileDialogOpen} 
        onOpenChange={setProfileDialogOpen}
        user={null} // TODO: 実際のユーザー情報を渡す
      />

      {/* グループ作成ダイアログ */}
      <CreateGroupDialog 
        open={isCreateGroupDialogOpen} 
        onOpenChange={setCreateGroupDialogOpen}
        onCreateGroup={handleCreateGroup}
        loading={false}
      />

      {/* グループ参加ダイアログ */}
              <JoinGroupDialog
          trigger={<div style={{ display: 'none' }} />}
          onSuccess={() => {
            setJoinGroupDialogOpen(false);
            // fetchGroups(); // この行は削除
          }}
        />

      {/* メモ作成ダイアログは削除（直接メモ作成に変更） */}

      <MemoEditDialog 
        open={editMemoDialogOpen} 
        onOpenChange={setEditMemoDialogOpen}
        memo={memoToEdit}
        onUpdateMemo={async (id, memoData) => {
          await updateMemo(id, memoData);
          setMemoToEdit(null);
        }}
      />

      <MemoDeleteDialog 
        open={deleteMemoDialogOpen} 
        onOpenChange={setDeleteMemoDialogOpen}
        memo={memoToDelete}
        onDeleteMemo={async (id) => {
          await deleteMemo(id);
          setMemoToDelete(null);
        }}
      />

      <MemoCreateDialog
        open={createMemoDialogOpen}
        onOpenChange={setCreateMemoDialogOpen}
        onCreateMemo={async (memoData) => {
          await createMemo(memoData);
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

      <MemberManagementDialog 
        open={isMemberManagementDialogOpen} 
        onOpenChange={setMemberManagementDialogOpen}
        groupId={selectedGroupId || ''} // 現在選択されているグループIDを渡す
        members={[]} // TODO: 実際のメンバー情報を渡す
        onInviteMember={async (email, role) => {
          // TODO: メンバー招待API呼び出し
          console.log('Invite member:', email, role);
        }}
        onRemoveMember={async (memberId) => {
          // TODO: メンバー削除API呼び出し
          console.log('Remove member:', memberId);
        }}
        onUpdateMemberRole={async (memberId, role) => {
          // TODO: メンバーロール更新API呼び出し
          console.log('Update member role:', memberId, role);
        }}
      />

      <SearchResultsDialog 
        open={isSearchResultsDialogOpen} 
        onOpenChange={setSearchResultsDialogOpen}
        searchQuery={searchQuery}
        results={filteredAndSortedMemos}
        onSearch={setSearchQuery}
        onSelectResult={setSelectedMemo}
      />

      <ExportImportDialog 
        open={isExportImportDialogOpen} 
        onOpenChange={setExportImportDialogOpen}
        onExport={async (format) => {
          // TODO: エクスポート機能実装
          console.log('Export in format:', format);
        }}
        onImport={async (data) => {
          // TODO: インポート機能実装
          console.log('Import data:', data);
          return true; // 成功を示す
        }}
      />

      <KeyboardShortcutsDialog 
        open={isKeyboardShortcutsDialogOpen} 
        onOpenChange={setKeyboardShortcutsDialogOpen}
      />
    </div>
  );
}
