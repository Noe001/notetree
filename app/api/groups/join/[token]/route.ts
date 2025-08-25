export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { group: true },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token' }, { status: 400 });
    }

    // 既にグループのメンバーであるか確認
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId: invitation.groupId, userId: user.id },
    });

    if (existingMember) {
      // 既にメンバーの場合は招待を削除して成功を返す
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return NextResponse.json({ success: true, data: { group: invitation.group, alreadyMember: true } });
    }

    // グループメンバーとして追加
    const groupMember = await prisma.groupMember.create({
      data: {
        groupId: invitation.groupId,
        userId: user.id,
        role: "MEMBER", // 招待による参加はデフォルトでMEMEBERロール
      },
    });

    // 招待を削除
    await prisma.invitation.delete({ where: { id: invitation.id } });

    return NextResponse.json({ success: true, data: { group: invitation.group, alreadyMember: false } });
  } catch (error: any) {
    console.error('Error joining group with token:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
