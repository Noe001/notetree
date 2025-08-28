import { LocalMemoStorage } from '../local-memo-storage';

describe('LocalMemoStorage', () => {
  const createStorage = () => {
    let store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (_: number) => null,
      length: 0,
    };
  };

  beforeEach(() => {
    createStorage();
  });

  test('save and retrieve memos', () => {
    const memo = LocalMemoStorage.saveMemo({
      title: 'title',
      content: 'content',
      tags: ['tag1'],
      isPrivate: false,
      userId: 'user1',
    });
    const all = LocalMemoStorage.getAllMemos();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(memo.id);
  });

  test('update and delete memo with branches', () => {
    const memo = LocalMemoStorage.saveMemo({
      title: 't',
      content: 'c',
      tags: [],
      isPrivate: false,
      userId: 'u1',
    });
    const updated = LocalMemoStorage.updateMemo(memo.id, { title: 'new' });
    expect(updated?.title).toBe('new');
    const missing = LocalMemoStorage.updateMemo('missing', { title: 'x' });
    expect(missing).toBeNull();
    expect(LocalMemoStorage.deleteMemo('missing')).toBe(false);
    expect(LocalMemoStorage.deleteMemo(memo.id)).toBe(true);
  });

  test('getMemosByUserId and searchMemos', () => {
    LocalMemoStorage.saveMemo({ title: 'hello', content: 'world', tags: ['tag1'], isPrivate: false, userId: 'u1' });
    LocalMemoStorage.saveMemo({ title: 'another', content: 'note', tags: ['tag2'], isPrivate: false, userId: 'u2' });
    expect(LocalMemoStorage.getMemosByUserId('u1')).toHaveLength(1);
    expect(LocalMemoStorage.searchMemos('hello')).toHaveLength(1);
    expect(LocalMemoStorage.searchMemos('tag2')).toHaveLength(1);
    expect(LocalMemoStorage.searchMemos('note', 'u2')).toHaveLength(1);
  });

  test('getAllMemos handles invalid JSON gracefully', () => {
    (global as any).localStorage.setItem('notetree_memos', 'invalid-json');
    const memos = LocalMemoStorage.getAllMemos();
    expect(memos).toEqual([]);
  });
});
