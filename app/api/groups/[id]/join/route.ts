export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const existingMember = await prisma.groupMember.findFirst({ where: { groupId, userId: user.id } });
    if (existingMember) {
      return NextResponse.json({ success: true, data: existingMember });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    console.error('Error joining group by id:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}


