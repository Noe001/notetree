export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserFromRequest } from '@/lib/auth'

// とても単純な行単位の差分（デモ目的）
function diffLines(a: string, b: string) {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const max = Math.max(aLines.length, bLines.length)
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  for (let i = 0; i < max; i++) {
    const av = aLines[i]
    const bv = bLines[i]
    if (av === undefined && bv !== undefined) added.push(bv)
    else if (bv === undefined && av !== undefined) removed.push(av)
    else if (av !== bv) {
      if (av !== undefined) removed.push(av)
      if (bv !== undefined) added.push(bv)
      modified.push(`line ${i + 1}`)
    }
  }
  return { added, removed, modified }
}

export async function GET(req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const memoId = context?.params?.id as string
    const pv: any = prisma as any
    if (!pv.memoVersion) return NextResponse.json({ success: false, error: 'Versioning not enabled' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const fromVersion = Number(searchParams.get('from'))
    const toVersion = Number(searchParams.get('to'))
    if (!Number.isFinite(fromVersion) || !Number.isFinite(toVersion)) {
      return NextResponse.json({ success: false, error: 'Invalid version numbers' }, { status: 400 })
    }

    const from = await pv.memoVersion.findFirst({ where: { memoId, version: fromVersion } })
    const to = await pv.memoVersion.findFirst({ where: { memoId, version: toVersion } })
    if (!from || !to) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 })

    const diffTitle = diffLines(from.title || '', to.title || '')
    const diffContent = diffLines(from.content || '', to.content || '')

    return NextResponse.json({ success: true, data: {
      added: [...diffTitle.added, ...diffContent.added],
      removed: [...diffTitle.removed, ...diffContent.removed],
      modified: [...diffTitle.modified, ...diffContent.modified],
    } })
  } catch (e: any) {
    console.error('Error diffing memo versions:', e)
    return NextResponse.json({ success: false, error: e.message || 'Something went wrong' }, { status: 500 })
  }
}

