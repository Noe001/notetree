import React from 'react'
import { useAuth } from './auth-context'
import { apiClient, Memo, CreateMemoDto, ApiResponse } from './api'
import type { TextOp, UpdateMemoDiffDto } from '@/types'

const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3000')

// バージョン履歴関連
export interface MemoVersion {
  id: string
  memoId: string
  title: string
  content: string
  tags: string[]
  version: number
  createdAt: string
  createdBy: string
  changeType: 'create' | 'update' | 'restore'
  changeSummary?: string
}

// お気に入り関連
export interface MemoFavorite {
  id: string
  memoId: string
  userId: string
  createdAt: string
  memo: {
    id: string
    title: string
    updatedAt: string
  }
}

class MemoFeaturesApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // HTTP Only Cookieを自動的に送信
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 認証エラーの場合は、auth-contextでセッションがクリアされるため、ここでは何もしない
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // バージョン履歴API
  async getMemoVersions(memoId: string): Promise<ApiResponse<MemoVersion[]>> {
    return this.request<MemoVersion[]>(`/api/memos/${memoId}/versions`)
  }

  async restoreMemoVersion(memoId: string, versionId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/memos/${memoId}/versions/${versionId}/restore`, {
      method: 'POST'
    })
  }

  async getVersionDiff(memoId: string, fromVersion: number, toVersion: number): Promise<ApiResponse<{
    added: string[]
    removed: string[]
    modified: string[]
  }>> {
    return this.request(`/api/memos/${memoId}/versions/diff?from=${fromVersion}&to=${toVersion}`)
  }

  // お気に入りAPI
  async getFavorites(): Promise<ApiResponse<MemoFavorite[]>> {
    return this.request<MemoFavorite[]>('/api/favorites')
  }

  async addToFavorites(memoId: string): Promise<ApiResponse<MemoFavorite>> {
    return this.request<MemoFavorite>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ memoId })
    })
  }

  async removeFromFavorites(memoId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/favorites/${memoId}`, {
      method: 'DELETE'
    })
  }

  async isFavorite(memoId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    return this.request<{ isFavorite: boolean }>(`/api/favorites/${memoId}/check`)
  }
}

export const memoFeaturesApiClient = new MemoFeaturesApiClient(API_BASE_URL);

// React Hooks for Memo Features
export function useMemoFeatures() {
  const { user } = useAuth(); // sessionは不要になるため削除予定

  // withAuthロジックは不要になるため削除予定

  return {
    // バージョン履歴
    getMemoVersions: (memoId: string) => memoFeaturesApiClient.getMemoVersions(memoId),
    restoreMemoVersion: (memoId: string, versionId: string) => memoFeaturesApiClient.restoreMemoVersion(memoId, versionId),
    getVersionDiff: (memoId: string, fromVersion: number, toVersion: number) => memoFeaturesApiClient.getVersionDiff(memoId, fromVersion, toVersion),

    // お気に入り
    getFavorites: () => memoFeaturesApiClient.getFavorites(),
    addToFavorites: (memoId: string) => memoFeaturesApiClient.addToFavorites(memoId),
    removeFromFavorites: (memoId: string) => memoFeaturesApiClient.removeFromFavorites(memoId),
    isFavorite: (memoId: string) => memoFeaturesApiClient.isFavorite(memoId),

    // apiClientのmemo関連メソッドを直接公開（ここで提供しないとuseRealtimeMemoSaveがundefinedになる）
    getMemos: apiClient.getMemos.bind(apiClient),
    createMemo: apiClient.createMemo.bind(apiClient),
    updateMemo: apiClient.updateMemo.bind(apiClient),
    deleteMemo: apiClient.deleteMemo.bind(apiClient),
    getMemo: apiClient.getMemo.bind(apiClient),
    searchMemos: apiClient.searchMemos.bind(apiClient),

    // ユーザー情報
    currentUser: user,
    isAuthenticated: !!user
  }
}

// デバウンスユーティリティ関数
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, delay);
  };
}

export function useRealtimeMemoSave(
  currentMemo: Memo | null, // 現在編集中のメモ、新規作成中はnull
  onMemoSaved: (memo: Memo) => void, // 保存成功時のコールバック (新規作成時のID取得など)
  autoSaveDelay: number = 1000 // デバウンスの遅延時間（ミリ秒）。0以下で即時保存（デバウンス無効）
) {
  const { createMemo, updateMemo, currentUser } = useMemoFeatures();
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const inFlightRef = React.useRef(false);
  const queuedRef = React.useRef<{ payload: CreateMemoDto | Partial<Memo>; memoId: string | null } | null>(null);

  // 直近のテキストスナップショットを保持し、メモ切替時や非テキスト変更での保存を防ぐ
  const previousSnapshotRef = React.useRef<{
    memoId: string | null;
    title: string;
    content: string;
    updatedAt: string | null;
  } | null>(null);

  // 単純スプライズ差分（1箇所の置換）を計算
  const computeSingleSplice = React.useCallback((before: string, after: string): { pos: number; del: number; insert: string } | null => {
    if (before === after) return null;
    const lenBefore = before.length;
    const lenAfter = after.length;
    let start = 0;
    const maxStart = Math.min(lenBefore, lenAfter);
    while (start < maxStart && before[start] === after[start]) start++;

    let endBefore = lenBefore - 1;
    let endAfter = lenAfter - 1;
    while (endBefore >= start && endAfter >= start && before[endBefore] === after[endAfter]) {
      endBefore--;
      endAfter--;
    }

    const pos = start;
    const del = endBefore - start + 1;
    const insert = after.slice(start, endAfter + 1);
    return { pos, del: Math.max(0, del), insert };
  }, []);

  const performSave = React.useCallback(async (memoToSave: CreateMemoDto | Partial<Memo>, memoId: string | null, channel: 'immediate' | 'debounced') => {
    if (!currentUser) {
      console.warn('ユーザーが認証されていないため、メモは保存されません。');
      return;
    }
    if (inFlightRef.current) {
      queuedRef.current = { payload: memoToSave, memoId };
      return;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    try {
      let response: ApiResponse<Memo>;
      if (memoId && !memoId.startsWith('temp-')) {
        response = await updateMemo(memoId, memoToSave as Partial<Memo>);
      } else {
        response = await createMemo(memoToSave as CreateMemoDto);
      }

      if (response.success && response.data) {
        setLastSaved(new Date());
        onMemoSaved(response.data);
      } else {
        console.error('メモの保存に失敗しました:', response.error);
      }
    } catch (error) {
      console.error('メモ保存エラー:', error);
    } finally {
      setIsSaving(false);
      inFlightRef.current = false;
      // 直近のキューがあれば直ちに保存（最新のみ）
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued) {
        // バトンを繋いで直ちに実行
        void performSave(queued.payload, queued.memoId, channel);
      }
    }
  }, [createMemo, updateMemo, currentUser, onMemoSaved]);

  const debouncedSave = React.useCallback(
    debounce((memoToSave: CreateMemoDto | Partial<Memo>, memoId: string | null) => {
      void performSave(memoToSave, memoId, 'debounced');
    }, autoSaveDelay),
    [performSave, autoSaveDelay]
  );

  const saveImmediately = React.useCallback((memoToSave: CreateMemoDto | Partial<Memo>, memoId: string | null) => {
    void performSave(memoToSave, memoId, 'immediate');
  }, [performSave]);

  // メモ内容(タイトル/本文/タグ)の変更のみ監視し、自動保存をトリガー
  React.useEffect(() => {
    if (!currentMemo) return;

    const snapshot = {
      memoId: currentMemo.id || null,
      title: currentMemo.title || '',
      content: currentMemo.content || '',
      updatedAt: currentMemo.updatedAt || null,
    };

    const prev = previousSnapshotRef.current;

    // メモ切替直後はスナップショットを更新するだけで保存しない
    if (!prev || prev.memoId !== snapshot.memoId) {
      previousSnapshotRef.current = snapshot;
      return;
    }

    // テキスト変更がない場合は何もしない
    const hasTextChanges = prev.title !== snapshot.title || prev.content !== snapshot.content;

    if (!hasTextChanges) return;

    // 差分を構築（タイトル/本文それぞれ1スプライズ）
    const ops: TextOp[] = [];
    const titleOp = computeSingleSplice(prev.title, snapshot.title);
    if (titleOp) ops.push({ field: 'title', pos: titleOp.pos, del: titleOp.del, insert: titleOp.insert });
    const contentOp = computeSingleSplice(prev.content, snapshot.content);
    if (contentOp) ops.push({ field: 'content', pos: contentOp.pos, del: contentOp.del, insert: contentOp.insert });

    // 既存メモは差分更新、新規(temp-*)はフル作成
    let dataToSave: any;
    if (currentMemo.id && currentMemo.id.startsWith('temp-')) {
      dataToSave = {
        title: snapshot.title,
        content: snapshot.content,
        tags: currentMemo.tags || [],
        isPrivate: currentMemo.isPrivate,
        groupId: currentMemo.groupId,
      } as CreateMemoDto;
    } else {
      dataToSave = {
        baseUpdatedAt: prev.updatedAt || currentMemo.updatedAt,
        ops,
        full: { title: snapshot.title, content: snapshot.content },
        meta: {
          tags: currentMemo.tags || [],
          isPrivate: currentMemo.isPrivate,
          groupId: currentMemo.groupId,
        },
      } as UpdateMemoDiffDto;
    }

    if (autoSaveDelay && autoSaveDelay > 0) {
      debouncedSave(dataToSave, currentMemo.id);
    } else {
      // デバウンス無効時は即時保存（入力/削除イベントの回数に比例）
      saveImmediately(dataToSave, currentMemo.id);
    }

    // 直ちにスナップショットを更新（デバウンス中の連続入力に対応）
    previousSnapshotRef.current = snapshot;
  }, [currentMemo?.id, currentMemo?.title, currentMemo?.content, computeSingleSplice, debouncedSave, saveImmediately, autoSaveDelay]);

  return { isSaving, lastSaved };
}
