// ローカルストレージベースのメモ保存システム
export interface LocalMemo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export class LocalMemoStorage {
  private static readonly STORAGE_KEY = 'notetree_memos';

  static saveMemo(memo: Omit<LocalMemo, 'id' | 'createdAt' | 'updatedAt'>): LocalMemo {
    const memos = this.getAllMemos();
    const newMemo: LocalMemo = {
      ...memo,
      id: `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memos.push(newMemo);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memos));
    return newMemo;
  }

  static getAllMemos(): LocalMemo[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load memos from localStorage:', error);
      return [];
    }
  }

  static getMemosByUserId(userId: string): LocalMemo[] {
    return this.getAllMemos().filter(memo => memo.userId === userId);
  }

  static updateMemo(id: string, updates: Partial<LocalMemo>): LocalMemo | null {
    const memos = this.getAllMemos();
    const index = memos.findIndex(memo => memo.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedMemo = {
      ...memos[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    memos[index] = updatedMemo;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memos));
    return updatedMemo;
  }

  static deleteMemo(id: string): boolean {
    const memos = this.getAllMemos();
    const filteredMemos = memos.filter(memo => memo.id !== id);
    
    if (filteredMemos.length === memos.length) {
      return false; // メモが見つからなかった
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMemos));
    return true;
  }

  static searchMemos(query: string, userId?: string): LocalMemo[] {
    const memos = userId ? this.getMemosByUserId(userId) : this.getAllMemos();
    const lowercaseQuery = query.toLowerCase();
    
    return memos.filter(memo => 
      memo.title.toLowerCase().includes(lowercaseQuery) ||
      memo.content.toLowerCase().includes(lowercaseQuery) ||
      memo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
} 
