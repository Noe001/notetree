export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

// UserRoleのインポートは不要（@prisma/client からのエクスポートは使用しない）

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, memberId } = params;
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role is required' }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーであること
    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only group owner can change member roles' }, { status: 403 });
    }

    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: memberId },
    });

    if (!existingMember) {
      return NextResponse.json({ success: false, error: 'Member not found in this group' }, { status: 404 });
    }

    // オーナーの役割は変更できない
    if (existingMember.role === 'OWNER') {
      return NextResponse.json({ success: false, error: "Cannot change owner's role" }, { status: 400 });
    }

    const updatedMember = await prisma.groupMember.update({
      where: { id: existingMember.id },
      data: { role },
    });

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: any) {
    console.error('Error updating group member role:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, memberId } = params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーであること
    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only group owner can remove members' }, { status: 403 });
    }

    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: memberId },
    });

    if (!existingMember) {
      return NextResponse.json({ success: false, error: 'Member not found in this group' }, { status: 404 });
    }

    // オーナー自身は削除できない
    if (existingMember.userId === user.id) {
      return NextResponse.json({ success: false, error: 'Cannot remove yourself from the group as owner' }, { status: 400 });
    }

    // オーナーの役割を持つメンバーは削除できない（オーナー変更機能がないため）
    if (existingMember.role === 'OWNER') {
      return NextResponse.json({ success: false, error: 'Cannot remove group owner' }, { status: 400 });
    }

    await prisma.groupMember.delete({ where: { id: existingMember.id } });

    return NextResponse.json({ success: true, data: null }, { status: 200 });
  } catch (error: any) {
    console.error('Error removing group member:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
