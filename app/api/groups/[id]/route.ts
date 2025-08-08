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

    const { id } = params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
        memos: true,
        invitations: true,
      },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーまたはメンバーであること
    const isMember = group.members.some(member => member.userId === user.id);
    if (group.ownerId !== user.id && !isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, description } = await req.json();

    if (!name && !description) {
      return NextResponse.json({ success: false, error: 'No fields to update provided' }, { status: 400 });
    }

    const existingGroup = await prisma.group.findUnique({ where: { id } });
    if (!existingGroup) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーであること
    if (existingGroup.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only group owner can update' }, { status: 403 });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    return NextResponse.json({ success: true, data: updatedGroup });
  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existingGroup = await prisma.group.findUnique({ where: { id } });
    if (!existingGroup) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーであること
    if (existingGroup.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only group owner can delete' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
