export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Prismaクライアントをインポート
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 認証されたユーザーのみがユーザー一覧を取得できる
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
