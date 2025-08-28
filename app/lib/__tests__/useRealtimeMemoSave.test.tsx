import React from 'react'
import { renderHook, act } from '@testing-library/react'
import type { Memo, CreateMemoDto, ApiResponse } from '@/lib/api'
import * as memoFeaturesModule from '@/lib/memo-features'
import * as apiModule from '@/lib/api'

// memo-features は実装を使う。auth-context だけモックして user を供給する。
jest.mock('../auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'u@example.com' },
    session: { user: { id: 'user-1', email: 'u@example.com' } },
    loading: false,
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  }),
}))

describe('useRealtimeMemoSave', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setupMocks = () => {
    const mockCreateMemo = jest.fn<
      Promise<ApiResponse<Memo>>, 
      [CreateMemoDto]
    >(async (dto: CreateMemoDto) => {
      const now = new Date().toISOString()
      return {
        success: true,
        data: {
          id: 'created-1',
          title: dto.title,
          content: dto.content,
          tags: dto.tags,
          isPrivate: (dto as any).isPrivate ?? false,
          groupId: (dto as any).groupId ?? null,
          createdAt: now,
          updatedAt: now,
          authorId: 'user-1',
        } as unknown as Memo,
      }
    })

    const mockUpdateMemo = jest.fn<
      Promise<ApiResponse<Memo>>, 
      [string, Partial<CreateMemoDto>]
    >(async (id: string, updates: Partial<CreateMemoDto>) => {
      const now = new Date().toISOString()
      return {
        success: true,
        data: {
          id,
          title: updates.title ?? 't',
          content: updates.content ?? 'c',
          tags: updates.tags ?? [],
          isPrivate: (updates as any).isPrivate ?? false,
          groupId: (updates as any).groupId ?? null,
          createdAt: now,
          updatedAt: now,
          authorId: 'user-1',
        } as unknown as Memo,
      }
    })
    jest.spyOn(apiModule.apiClient, 'createMemo').mockImplementation(mockCreateMemo as any)
    jest.spyOn(apiModule.apiClient, 'updateMemo').mockImplementation(mockUpdateMemo as any)

    return { mockCreateMemo, mockUpdateMemo }
  }

  const buildMemo = (overrides: Partial<Memo> = {}): Memo => ({
    id: 'memo-1',
    title: 't',
    content: 'c',
    tags: [],
    isPrivate: false,
    groupId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'user-1',
    ...overrides,
  }) as Memo

  it('既存メモ: テキスト変更時のみデバウンス後にupdateMemoを1回呼ぶ', async () => {
    const { mockUpdateMemo } = setupMocks()

    const { result, rerender } = renderHook(
      ({ memo, onSaved, delay }: { memo: Memo | null; onSaved: (m: Memo) => void; delay: number }) =>
        memoFeaturesModule.useRealtimeMemoSave(memo, onSaved, delay),
      {
        initialProps: {
          memo: buildMemo({ id: 'memo-1', title: 'A', content: 'X' }),
          onSaved: jest.fn(),
          delay: 200,
        },
      }
    )

    // 初回はスナップショットのみ、保存なし
    expect(mockUpdateMemo).not.toHaveBeenCalled()

    // タイトル変更
    const changed = buildMemo({ id: 'memo-1', title: 'A2', content: 'X' })
    rerender({ memo: changed, onSaved: jest.fn(), delay: 200 })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })

    expect(mockUpdateMemo).toHaveBeenCalledTimes(1)
    const calledArg = (mockUpdateMemo.mock.calls[0] as any[])[1]
    expect(calledArg).toHaveProperty('ops')
    expect(calledArg.ops).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'title' }),
    ]))
    expect(calledArg).toHaveProperty('baseUpdatedAt')
    expect(calledArg.full).toEqual(expect.objectContaining({ title: 'A2', content: 'X' }))
    // isSaving/lastSavedの更新が走ること（値自体はモックで十分）
    expect(result.current.isSaving).toBe(false)
    expect(result.current.lastSaved).toBeInstanceOf(Date)
  })

  it('既存メモ: isPrivateのみ変更では保存されない', async () => {
    const { mockUpdateMemo } = setupMocks()

    const base = buildMemo({ id: 'memo-2', title: 'T', content: 'C', isPrivate: false })
    const { rerender } = renderHook(
      ({ memo, delay }: { memo: Memo | null; delay: number }) =>
        memoFeaturesModule.useRealtimeMemoSave(memo, () => {}, delay),
      { initialProps: { memo: base, delay: 200 } }
    )

    // isPrivateだけ変更
    const changed = { ...base, isPrivate: true }
    rerender({ memo: changed, delay: 200 })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })

    expect(mockUpdateMemo).not.toHaveBeenCalled()
  })

  it('新規メモ(temp id): デバウンス後にcreateMemoを1回呼ぶ', async () => {
    const { mockCreateMemo, mockUpdateMemo } = setupMocks()

    const initial = buildMemo({ id: 'temp-123', title: '', content: '' })
    const { rerender } = renderHook(
      ({ memo, delay }: { memo: Memo | null; delay: number }) =>
        memoFeaturesModule.useRealtimeMemoSave(memo, () => {}, delay),
      { initialProps: { memo: initial, delay: 200 } }
    )

    // 内容を変更
    const changed = { ...initial, title: 'New', content: 'Body' }
    rerender({ memo: changed, delay: 200 })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })

    expect(mockUpdateMemo).not.toHaveBeenCalled()
    expect(mockCreateMemo).toHaveBeenCalledTimes(1)
    const createArg = (mockCreateMemo.mock.calls[0] as any[])[0]
    expect(createArg).toEqual(expect.objectContaining({ title: 'New', content: 'Body', tags: [] }))
  })

  it('保存成功時にonMemoSavedが呼ばれる', async () => {
    const { mockUpdateMemo } = setupMocks()

    const savedHandler = jest.fn()
    const { rerender } = renderHook(
      ({ memo, onSaved, delay }: { memo: Memo | null; onSaved: (m: Memo) => void; delay: number }) =>
        memoFeaturesModule.useRealtimeMemoSave(memo, onSaved, delay),
      { initialProps: { memo: buildMemo({ id: 'memo-3', title: 'A' }), onSaved: savedHandler, delay: 200 } }
    )

    const changed = buildMemo({ id: 'memo-3', title: 'AA' })
    rerender({ memo: changed, onSaved: savedHandler, delay: 200 })

    await act(async () => {
      jest.advanceTimersByTime(200)
    })

    expect(mockUpdateMemo).toHaveBeenCalledTimes(1)
    expect(savedHandler).toHaveBeenCalledTimes(1)
    expect(savedHandler.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 'memo-3' }))
  })
})

