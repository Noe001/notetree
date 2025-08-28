export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserFromRequest } from '@/lib/auth'

export async function GET(_req: NextRequest, context: any) {
  try {
    const user = await getAuthenticatedUserFromRequest()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const memoId = context?.params?.id as string
    const memo = await prisma.memo.findUnique({ where: { id: memoId } })
    if (!memo) return NextResponse.json({ success: false, error: 'Not Found' }, { status: 404 })

    const pv: any = prisma as any
    if (!pv.memoVersion) return NextResponse.json({ success: true, data: [] })

    const versions = await pv.memoVersion.findMany({ where: { memoId }, orderBy: { version: 'desc' } })
    // createdAt: Date -> string
    const data = versions.map((v: any) => ({ ...v, createdAt: v.createdAt?.toISOString?.() || v.createdAt }))
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('Error fetching memo versions:', e)
    return NextResponse.json({ success: false, error: e.message || 'Something went wrong' }, { status: 500 })
  }
}

