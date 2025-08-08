export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { CreateMemoDto, Memo } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const memos = await prisma.memo.findMany({
      where: {
        authorId: user.id, // 自分のメモのみ取得
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const processedMemos = memos.map(memo => ({
      ...memo,
      createdAt: memo.createdAt.toISOString(), // Dateをstringに変換
      updatedAt: memo.updatedAt.toISOString(), // Dateをstringに変換
      tags: JSON.parse(memo.tags) as string[], // JSON文字列を配列にパース
    }));
    return NextResponse.json({ success: true, data: processedMemos });
  } catch (error: any) {
    console.error('Error fetching memos:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tags, isPrivate, groupId }: CreateMemoDto = await req.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    const newMemo = await prisma.memo.create({
      data: {
        title,
        content,
        isPrivate,
        authorId: user.id,
        groupId,
        tags: JSON.stringify(tags || []), // タグをJSON文字列として保存
      },
    });

    const responseData: Memo = {
      ...newMemo,
      createdAt: newMemo.createdAt.toISOString(), // Dateをstringに変換
      updatedAt: newMemo.updatedAt.toISOString(), // Dateをstringに変換
      tags: JSON.parse(newMemo.tags) as string[],
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating memo:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
