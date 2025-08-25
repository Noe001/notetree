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
    return NextResponse.noContent()
  } catch (error: any) {
    console.error('Error deleting memo:', error)
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 })
  }
}

