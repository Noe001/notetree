export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, token } = params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.groupId !== groupId) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.invitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}


