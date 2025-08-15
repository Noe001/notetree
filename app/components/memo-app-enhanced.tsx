'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Users, User, Plus, Settings, HelpCircle, LogOut, Search, ArrowUpDown, FilePenLine, Lock, Menu, X, Palette, Keyboard, Check, Trash2, Share2
} from "lucide-react";
import Link from 'next/link';
import { logger } from '@/lib/logger';

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
import { apiClient, Memo as ApiMemo, CreateMemoDto, Group, GroupMember } from "@/lib/api";
import { useGroups } from "@/hooks/useApi";
import { useRealtimeMemoSave } from "@/lib/memo-features";

// --- 型定義 ---
type Memo = ApiMemo;

// 現在のユーザーID（実際のアプリでは認証から取得）
const CURRENT_USER_ID = 'e87a6ec4-16b8-44c7-b339-604f62d9557c';

// =================================================================
// コンポーネント 1: サイドバー（Sheetの中身）
// =================================================================
const SidebarContent = ({ 
  onOpenSettings, 
  onOpenProfile,
  onOpenCreateGroup,
  onOpenJoinGroup,
  groups,
  selectedGroupId,
  onGroupSelect
}: { 
  onOpenSettings: () => void; 
  onOpenProfile: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  groups: { id: string; name: string }[];
  selectedGroupId?: string;
  onGroupSelect: (groupId: string | undefined) => void;
}) => {
  const { user, signOut } = useAuth();
  
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
             <Button 
               variant="ghost" 
               className="w-full text-destructive hover:text-destructive justify-start"
               onClick={async () => {
                 try {
                   await signOut();
                   // ProtectedRoute により未ログインなら自動で認証フォームに切り替わるが、
                   // 念のためルートへ遷移してUI反映を確実にする
                   window.location.href = '/';
                 } catch (e) {
                   console.error('Failed to sign out:', e);
                 }
               }}
             >
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
  groups: { id: string; name: string }[];
};

const MemoListPanel = ({ memos, selectedMemo, onSelectMemo, onSearch, onSort, onTagToggle, activeTags, onCreateMemo, allTags, selectedGroupId, groups }: MemoListPanelProps) => {
  // ヘッダーのタイトルを動的に決定
  const headerTitle = useMemo(() => {
    if (selectedGroupId) {
      const selectedGroup = groups?.find((group) => group.id === selectedGroupId);
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
  onMemoSaved: (memo: Memo) => void; // 追加
  onMemoUpdatedInList: (updatedMemo: Memo) => void; // 追加：Appコンポーネントでmemosリストを更新するためのコールバック
};

const MemoEditor = ({ memo, onMemoSaved, onMemoUpdatedInList }: MemoEditorProps) => {
  // useRefは不要になるため削除
  // const titleRef = useRef<HTMLInputElement>(null);
  // const tagsRef = useRef<HTMLInputElement>(null);
  // const contentRef = useRef<HTMLTextAreaElement>(null);
  // const [hasChanges, setHasChanges] = useState(false); // 削除
  // const [isCreatingNew, setIsCreatingNew] = useState(false); // 削除
  // const [newMemoTitle, setNewMemoTitle] = useState(''); // 削除
  // const [newMemoContent, setNewMemoContent] = useState(''); // 削除
  // const [newMemoTagsInput, setNewMemoTagsInput] = useState(''); // 削除
  // const [newMemoTags, setNewMemoTags] = useState<string[]>([]); // 削除
  // const [newMemoIsPrivate, setNewMemoIsPrivate] = useState(false); // 削除

  // useRealtimeMemoSaveフックを統合
  const { isSaving, lastSaved } = useRealtimeMemoSave(
    memo, // 現在のメモオブジェクトを渡す
    (savedMemo) => {
      // 保存されたメモが新しいメモ（仮IDを持つ）であれば、リストを更新
      if (memo && memo.id.startsWith('temp-') && savedMemo.id !== memo.id) {
        onMemoSaved(savedMemo); // 新しいIDを持つメモでリストを更新するためにAppに通知
      } else if (memo) {
        // 既存のメモが更新された場合
        onMemoUpdatedInList(savedMemo);
      }
    }
  );

  // 入力変更ハンドラを統合
  const handleInputChange = useCallback((
    field: keyof Omit<Memo, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    value: string | boolean | string[]
  ) => {
    if (!memo) return; // メモがnullの場合は何もしない

    let updatedMemo: Memo = { ...memo };

    if (field === 'tags') {
      updatedMemo = {
        ...updatedMemo,
        tags: Array.isArray(value) ? value : String(value).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };
    } else if (typeof value === 'boolean') {
      updatedMemo = { ...updatedMemo, [field]: value };
    } else {
      updatedMemo = { ...updatedMemo, [field]: String(value) };
    }

    // ここで直接selectedMemoを更新するのではなく、親コンポーネントに更新されたメモを伝える
    // なぜなら、リアルタイム保存はdebounceされているため、UI上の即時反映とAPIへの反映を分離するため
    onMemoUpdatedInList(updatedMemo);
  }, [memo, onMemoUpdatedInList]);

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

  // メモの内容を表示し、リアルタイム保存で更新されるようにする
  return (
    <main className="flex-1 flex flex-col bg-background">
      <div className="p-6 space-y-4 flex-1 flex flex-col overflow-y-auto">
        <Input
          value={memo.title} // memoの状態にバインド
          placeholder="タイトル *"
          className="text-2xl font-bold border-none focus-visible:ring-0 shadow-none p-0 h-auto"
          onChange={(e) => handleInputChange('title', e.target.value)}
        />
        <Input
          value={memo.tags.join(', ')} // memoの状態にバインド
          placeholder="カンマ区切りでタグを追加"
          className="border-none focus-visible:ring-0 shadow-none p-0 text-sm h-auto"
          onChange={(e) => handleInputChange('tags', e.target.value)}
        />
        <Separator />
        <Textarea
          value={memo.content} // memoの状態にバインド
          placeholder="内容を記述... *"
          className="flex-1 w-full resize-none border-none focus-visible:ring-0 shadow-none p-0 text-base leading-relaxed"
          onChange={(e) => handleInputChange('content', e.target.value)}
        />
      </div>
      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="memo-private-switch"
            checked={memo.isPrivate} // memoの状態にバインド
            onChange={(e) => handleInputChange('isPrivate', e.target.checked)} // 変更後
          />
          <Label htmlFor="memo-private-switch">プライベートメモ</Label>
        </div>
        <div className="text-sm text-muted-foreground">
          {isSaving ? '保存中...' : lastSaved ? `最終保存: ${lastSaved.toLocaleTimeString()}` : '未保存'}
        </div>
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const { user: currentUser } = useAuth();

  
  // ダイアログの状態管理
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
          authorId: apiMemo.authorId, // userIdをauthorIdにマッピング
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

  // メモを更新
  const updateMemo = async (id: string, updates: Partial<CreateMemoDto>) => {
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
          authorId: response.data.authorId, // ここを修正
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
    } catch (error: unknown) {
      logger.error('Failed to update memo:', error);
      const message = error instanceof Error ? error.message : 'メモの更新に失敗しました';
      throw new Error(message);
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
    } catch (error: unknown) {
      logger.error('Failed to delete memo:', error);
      const message = error instanceof Error ? error.message : 'メモの削除に失敗しました';
      throw new Error(message);
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
  const handleOpenMemoCreate = async () => { // asyncを追加
    logger.debug('handleOpenMemoCreate: Calling createMemo...');
    // 新しいメモを作成するAPIを直接呼び出す
    const response = await apiClient.createMemo({ // useMemoFeaturesから取得したcreateMemoを使用
      title: '新しいメモ', // 初期タイトルを設定
      content: 'ここに内容を記述してください。', // 初期内容を設定
      tags: [],
      isPrivate: false,
      groupId: selectedGroupId || null,
    });

    if (response.success && response.data) {
      const newMemo: Memo = response.data; // APIから返されたメモを使用
      setMemos(prevMemos => [newMemo, ...prevMemos]);
      setSelectedMemo(newMemo);
      updateAllTags([newMemo, ...memos]); // 新しいメモでタグも更新
    } else {
      logger.error('新しいメモの作成に失敗しました:', response.error);
    }
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
      const res = await apiClient.createGroup(groupData);
      if (res.success && res.data) {
        const createdGroup = res.data as Group;
        setGroups(prev => [createdGroup, ...prev]);
        setSelectedGroupId(createdGroup.id);
        // 作成直後はメンバー一覧も取得
        try {
          const memRes = await apiClient.getGroupMembers(createdGroup.id);
          if (memRes.success && memRes.data) {
            setGroupMembers(memRes.data);
          }
      } catch (e) {
          logger.error('Failed to fetch members after create:', e);
        }
      } else {
        throw new Error(res.error || 'グループ作成に失敗しました');
      }
    } catch (error) {
      logger.error('Failed to create group:', error);
      throw error;
    }
  };

  const handleJoinByGroupId = async (groupId: string) => {
    try {
      const res = await apiClient.joinGroupByGroupId(groupId);
      if (res.success && res.data) {
        // 参加後にグループ一覧を再取得
        await fetchGroups();
        setSelectedGroupId(groupId);
      }
      } catch (error) {
        logger.error('Failed to join group:', error);
      throw error;
    }
  };

  const handleJoinByInvitation = async (invitationToken: string) => {
    try {
      const res = await apiClient.joinGroupByInvitation(invitationToken);
      if (res.success) {
        await fetchGroups();
      }
      } catch (error) {
        logger.error('Failed to join group by invitation:', error);
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

  // MemoEditorから渡される更新されたメモを処理
  const handleMemoUpdatedFromEditor = useCallback((updatedMemo: Memo) => {
    setMemos(prevMemos => 
      prevMemos.map(memo => (memo.id === updatedMemo.id) ? updatedMemo : memo)
    );
    setSelectedMemo(updatedMemo); // 選択中のメモも更新
    // updateAllTagsはsetMemosのコールバック内で呼ばれるため、ここでは不要
  }, [memos]);

  // MemoEditorから新規作成されたメモ（仮IDから実際のIDに変わったメモ）を処理
  const handleNewMemoSaved = useCallback((newlyCreatedMemo: Memo) => {
    setMemos(prevMemos => {
      const updatedMemos = prevMemos.map(memo => (memo.id.startsWith('temp-')) ? newlyCreatedMemo : memo); // 仮IDのメモを実際のメモに置き換え
      updateAllTags(updatedMemos); // 更新後のメモリストでタグを更新
      return updatedMemos;
    });
    setSelectedMemo(newlyCreatedMemo); // 選択中のメモも更新
    // updateAllTagsはsetMemosのコールバック内で呼ばれるため、ここでは不要
  }, [memos]);

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

  const fetchGroups = async () => {
    try {
      const res = await apiClient.getGroups();
      if (res.success && res.data) {
        setGroups(res.data);
      }
    } catch (e) {
      logger.error('Failed to fetch groups:', e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // グループメンバー取得（選択グループ変更時）
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedGroupId) {
        setGroupMembers([]);
        return;
      }
      try {
        const res = await apiClient.getGroupMembers(selectedGroupId);
        if (res.success && res.data) {
          setGroupMembers(res.data);
        } else {
          setGroupMembers([]);
        }
      } catch (e) {
        logger.error('Failed to fetch group members:', e);
        setGroupMembers([]);
      }
    };
    loadMembers();
  }, [selectedGroupId]);

  // ダイアログ用に型を整形（hooksは常にトップレベルで呼ぶ）
  const groupForDialog = useMemo(() => {
    const g = groups.find(g => g.id === (selectedGroupId || ''));
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      description: g.description || '',
      isPrivate: false,
      memberCount: groupMembers.length,
      createdAt: g.createdAt,
    };
  }, [groups, selectedGroupId, groupMembers]);


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
        <MemoEditor
          memo={selectedMemo}
          onMemoSaved={handleNewMemoSaved} // 新規メモ保存時のコールバック
          onMemoUpdatedInList={handleMemoUpdatedFromEditor} // 既存メモ更新時のコールバック
        />
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

      {/* MemoCreateDialogは削除された */}

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

      {/* MemoCreateDialogは削除された */}

      {/* グループダイアログ */}
      <GroupSettingsDialog 
        open={isGroupSettingsDialogOpen} 
        onOpenChange={setGroupSettingsDialogOpen}
        group={groupForDialog}
        members={membersForDialogs}
        currentUserId={currentUser?.id || ''}
        onUpdateGroup={async (id, data) => {
          const res = await apiClient.updateGroup(id, data as Partial<Group>);
          if (res.success && res.data) {
            setGroups(prev => prev.map(g => g.id === id ? res.data as Group : g));
          } else {
            throw new Error(res.error || 'グループ更新に失敗しました');
          }
        }}
        onInviteMember={async (groupId, email, role) => {
          // GroupSettingsDialogのroleは 'editor' | 'viewer' を想定しているためAPIの 'member' に正規化
          const normalizedRole: 'admin' | 'member' = 'member';
          const res = await apiClient.inviteMember(groupId, { email, role: normalizedRole });
          if (!res.success) {
            throw new Error(res.error || '招待に失敗しました');
          }
        }}
        onRemoveMember={async (groupId, memberId) => {
          const res = await apiClient.removeGroupMember(groupId, memberId);
          if (res.success) {
            const refresh = await apiClient.getGroupMembers(groupId);
            if (refresh.success && refresh.data) setGroupMembers(refresh.data as GroupMember[]);
          } else {
            throw new Error(res.error || 'メンバー削除に失敗しました');
          }
        }}
        onUpdateMemberRole={async (groupId, memberId, role) => {
          // GroupSettingsDialogのroleは 'owner'|'admin'|'editor'|'viewer' の文字列。
          // APIは 'admin' | 'member' を受け付けるため、owner以外はadmin/memberに丸める。
          const upper = (role || '').toString().toLowerCase();
          const mapped: 'admin' | 'member' = upper === 'admin' ? 'admin' : 'member';
          const res = await apiClient.updateGroupMemberRole(groupId, memberId, mapped);
          if (res.success) {
            const refresh = await apiClient.getGroupMembers(groupId);
            if (refresh.success && refresh.data) setGroupMembers(refresh.data as GroupMember[]);
          } else {
            throw new Error(res.error || 'メンバーロール更新に失敗しました');
          }
        }}
        onDeleteGroup={async (id) => {
          const res = await apiClient.deleteGroup(id);
          if (res.success) {
            setGroups(prev => prev.filter(g => g.id !== id));
            if (selectedGroupId === id) {
              setSelectedGroupId(undefined);
              // グループ解除後は個人メモを再読込
              const memosRes = await apiClient.getMemos();
              if (memosRes.success && memosRes.data) {
                setMemos(memosRes.data as Memo[]);
              }
            }
          } else {
            throw new Error(res.error || 'グループ削除に失敗しました');
          }
        }}
      />

      <MemberManagementDialog 
        open={isMemberManagementDialogOpen} 
        onOpenChange={setMemberManagementDialogOpen}
        groupId={selectedGroupId || ''}
        members={membersForDialogs}
        onInviteMember={async (email, role) => {
          if (!selectedGroupId) throw new Error('グループ未選択です');
          const res = await apiClient.inviteMember(selectedGroupId, { email, role });
          if (!res.success) throw new Error(res.error || '招待に失敗しました');
        }}
        onRemoveMember={async (memberId) => {
          if (!selectedGroupId) throw new Error('グループ未選択です');
          const res = await apiClient.removeGroupMember(selectedGroupId, memberId);
          if (res.success) {
            const refresh = await apiClient.getGroupMembers(selectedGroupId);
            if (refresh.success && refresh.data) setGroupMembers(refresh.data as GroupMember[]);
          } else {
            throw new Error(res.error || 'メンバー削除に失敗しました');
          }
        }}
        onUpdateMemberRole={async (memberId, role) => {
          if (!selectedGroupId) throw new Error('グループ未選択です');
          const res = await apiClient.updateGroupMemberRole(selectedGroupId, memberId, role);
          if (res.success) {
            const refresh = await apiClient.getGroupMembers(selectedGroupId);
            if (refresh.success && refresh.data) setGroupMembers(refresh.data as GroupMember[]);
          } else {
            throw new Error(res.error || 'メンバーロール更新に失敗しました');
          }
        }}
      />

      <SearchResultsDialog 
        open={isSearchResultsDialogOpen} 
        onOpenChange={setSearchResultsDialogOpen}
        searchQuery={searchQuery}
        results={filteredAndSortedMemos}
        onSearch={setSearchQuery}
        onSelectResult={(result) => setSelectedMemo(result as Memo)}
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



