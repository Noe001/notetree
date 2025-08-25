export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーまたはメンバーであること
    const isMember = group.members.some((member: { userId: string }) => member.userId === user.id);
    if (group.ownerId !== user.id && !isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: group.members });
  } catch (error: any) {
    console.error('Error fetching group members:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;
    const { memberId, role } = await req.json();

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限: オーナーのみメンバー権限変更可能
    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.groupMember.update({
      where: { id: memberId },
      data: { role: (role || 'MEMBER').toUpperCase() },
      include: { user: { select: { id: true, email: true, name: true } } }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;
    const { memberId } = await req.json();

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限: オーナーのみメンバー削除可能（自分自身は別途退出APIで）
    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.groupMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
