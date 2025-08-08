export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーがメンバーになっているグループ、または所有しているグループを取得
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
        _count: { select: { memos: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        owner: { connect: { id: user.id } },
        members: { create: { userId: user.id, role: "OWNER" } }, // 作成者をオーナーとしてメンバーに追加
      },
    });

    return NextResponse.json({ success: true, data: group }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
