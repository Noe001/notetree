export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserFromRequest } from '@/lib/auth'

function toMemoResponse(memo: any) {
  return {
    ...memo,
    createdAt: memo.createdAt.toISOString(),
    updatedAt: memo.updatedAt.toISOString(),
    tags: (memo as any).tags as string[]
  }
}

export async function POST(_req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const memoId = context?.params?.id as string
    const versionId = context?.params?.versionId as string

    const memo = await prisma.memo.findUnique({ where: { id: memoId } })
    if (!memo) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 })

    const pv: any = prisma as any
    if (!pv.memoVersion) return NextResponse.json({ success: false, error: 'Versioning not enabled' }, { status: 400 })

    const version = await pv.memoVersion.findUnique({ where: { id: versionId } })
    if (!version || version.memoId !== memoId) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 })

    const updated = await prisma.memo.update({
      where: { id: memoId },
      data: {
        title: version.title,
        content: version.content,
        tags: version.tags,
      }
    })

    // 履歴として復元操作も記録
    try {
      const last = await pv.memoVersion.findFirst({ where: { memoId }, orderBy: { version: 'desc' } })
      const nextVersion = (last?.version || 0) + 1
      await pv.memoVersion.create({
        data: {
          memoId,
          version: nextVersion,
          title: updated.title,
          content: updated.content,
          tags: updated.tags,
          createdBy: user.id,
          changeType: 'restore',
        }
      })
    } catch (e) {
      console.error('Failed to record restore version:', e)
    }

    return NextResponse.json({ success: true, data: toMemoResponse(updated) })
  } catch (e: any) {
    console.error('Error restoring memo version:', e)
    return NextResponse.json({ success: false, error: e.message || 'Something went wrong' }, { status: 500 })
  }
}

