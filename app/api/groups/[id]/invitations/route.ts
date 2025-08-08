export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // パラメータからグループIDを取得
    const { id: groupId } = params;
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 権限チェック：グループのオーナーであること
    if (group.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only group owner can invite members' }, { status: 403 });
    }

    // 既にメンバーであるか、招待済みであるかを確認
    const existingMember = await prisma.groupMember.findFirst({ where: { groupId, user: { email } } });
    if (existingMember) {
      return NextResponse.json({ success: false, error: 'User is already a member of this group' }, { status: 409 });
    }

    const existingInvitation = await prisma.invitation.findFirst({ where: { groupId, email } });
    if (existingInvitation) {
      return NextResponse.json({ success: false, error: 'User has already been invited to this group' }, { status: 409 });
    }

    // 招待トークンを生成
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後に期限切れ

    const invitation = await prisma.invitation.create({
      data: {
        email,
        groupId,
        token,
        expiresAt,
      },
    });

    // TODO: 招待メールの送信ロジックを追加（例: resend, nodemailerなどを使用）
    // const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/join/${token}`;
    // await sendInvitationEmail(email, group.name, joinUrl);

    return NextResponse.json({ success: true, data: { email: invitation.email, token: invitation.token } }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
