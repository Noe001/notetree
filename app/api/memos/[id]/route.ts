export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserFromRequest } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

function toMemoResponse(memo: any) {
  return {
    ...memo,
    createdAt: memo.createdAt.toISOString(),
    updatedAt: memo.updatedAt.toISOString(),
    tags: (memo as any).tags as string[]
  }
}

async function canReadMemo(userId: string, memo: { authorId: string; groupId: string | null }) {
  if (!memo.groupId) return memo.authorId === userId
  const group = await prisma.group.findUnique({ where: { id: memo.groupId } })
  if (!group) return false
  if (group.ownerId === userId) return true
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: memo.groupId, userId } })
  return !!isMember
}

async function canModifyMemo(userId: string, memo: { authorId: string; groupId: string | null }) {
  if (memo.authorId === userId) return true
  if (memo.groupId) {
    const group = await prisma.group.findUnique({ where: { id: memo.groupId } })
    if (group && group.ownerId === userId) return true
  }
  return false
}

export async function GET(_req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const memoId = context?.params?.id as string
    const memo = await prisma.memo.findUnique({ where: { id: memoId } })
    if (!memo) {
      return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 })
    }

    const permitted = await canReadMemo(user.id, { authorId: memo.authorId, groupId: memo.groupId })
    if (!permitted) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: toMemoResponse(memo) })
  } catch (error: any) {
    console.error('Error fetching memo:', error)
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const memoId = context?.params?.id as string
    const memo = await prisma.memo.findUnique({ where: { id: memoId } })
    if (!memo) {
      return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 })
    }

    const permitted = await canModifyMemo(user.id, { authorId: memo.authorId, groupId: memo.groupId })
    if (!permitted) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // 差分更新（ops）が来た場合は差分適用。なければ通常のフィールド更新
    if (Array.isArray(body.ops)) {
      const ops = body.ops as Array<{ field: 'title' | 'content'; pos: number; del: number; insert?: string }>
      const baseUpdatedAt = body.baseUpdatedAt ? new Date(body.baseUpdatedAt) : null
      const createConflictCopy = !!body.createConflictCopy

      const latestMemo = memo
      let title = latestMemo.title
      let content = latestMemo.content

      const isConflict = baseUpdatedAt ? latestMemo.updatedAt.getTime() !== baseUpdatedAt.getTime() : false

      // コンフリクト時: LWW（最後の保存が勝つ）を基本とし、fullがあればそれを最終値として使う
      if (isConflict && body.full) {
        if (typeof body.full.title === 'string') title = body.full.title
        if (typeof body.full.content === 'string') content = body.full.content
      } else if (!isConflict) {
        // 非コンフリクト時は ops を最新値に適用
        for (const op of ops) {
          const target = op.field === 'title' ? title : content
          const start = Math.max(0, Math.min(op.pos, target.length))
          const del = Math.max(0, Math.min(op.del, target.length - start))
          const ins = op.insert || ''
          const next = target.slice(0, start) + ins + target.slice(start + del)
          if (op.field === 'title') title = next; else content = next
        }
      }

      // 付帯情報（保存トリガーではない）
      const metaUpdates: any = {}
      if (body.meta) {
        if (Array.isArray(body.meta.tags)) metaUpdates.tags = body.meta.tags as unknown as Prisma.InputJsonValue
        if (typeof body.meta.isPrivate === 'boolean') metaUpdates.isPrivate = body.meta.isPrivate
        if (typeof body.meta.groupId === 'string' || body.meta.groupId === null) metaUpdates.groupId = body.meta.groupId
      }

      // コンフリクト時に別ノートとして保存するオプション
      if (isConflict && createConflictCopy) {
        const conflict = await prisma.memo.create({
          data: {
            title: (title + ' (conflict)').trim(),
            content,
            authorId: latestMemo.authorId,
            groupId: latestMemo.groupId,
            isPrivate: latestMemo.isPrivate,
            tags: ((latestMemo as any).tags ?? []) as unknown as Prisma.InputJsonValue,
          }
        })
        return NextResponse.json({ success: true, data: toMemoResponse(conflict) })
      }

      const updated = await prisma.memo.update({
        where: { id: memoId },
        data: { title, content, ...metaUpdates }
      })
      

      // バージョン履歴を保存（ops含む）
      try {
        const pv: any = prisma as any
        if (pv && pv.memoVersion) {
          // 次のバージョン番号を採番
          const last = await pv.memoVersion.findFirst({ where: { memoId }, orderBy: { version: 'desc' } })
          const nextVersion = (last?.version || 0) + 1
          await pv.memoVersion.create({
            data: {
              memoId,
              version: nextVersion,
              title: updated.title,
              content: updated.content,
              tags: (updated as any).tags as unknown as Prisma.InputJsonValue,
              createdBy: user.id,
              changeType: isConflict ? 'conflict' : 'update',
              ops,
            }
          })
        }
      } catch (e) {
        console.error('Failed to record memo version:', e)
      }

      return NextResponse.json({ success: true, data: toMemoResponse(updated) })
    }

    // 通常の更新（従来挙動）
    const updates: any = {}
    if (typeof body.title === 'string') updates.title = body.title
    if (typeof body.content === 'string') updates.content = body.content
    if (Array.isArray(body.tags)) updates.tags = body.tags as unknown as Prisma.InputJsonValue
    if (typeof body.isPrivate === 'boolean') updates.isPrivate = body.isPrivate

    const updated = await prisma.memo.update({ where: { id: memoId }, data: updates })
    return NextResponse.json({ success: true, data: toMemoResponse(updated) })
  } catch (error: any) {
    console.error('Error updating memo:', error)
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const memoId = context?.params?.id as string
    const memo = await prisma.memo.findUnique({ where: { id: memoId } })
    if (!memo) {
      return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 })
    }

    const permitted = await canModifyMemo(user.id, { authorId: memo.authorId, groupId: memo.groupId })
    if (!permitted) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    await prisma.memo.delete({ where: { id: memoId } })
    return new Response(null, { status: 204 })
  } catch (error: any) {
    console.error('Error deleting memo:', error)
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 })
  }
}
