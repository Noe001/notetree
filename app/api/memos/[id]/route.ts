export const runtime = 'nodejs'; // RuntimeをNode.jsに設定

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const memo = await prisma.memo.findUnique({
      where: { id },
      include: { author: { select: { id: true, email: true, name: true } }, group: true },
    });

    if (!memo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 権限チェック：メモの作成者であるか、またはグループに属しているか
    if (memo.authorId !== user.id && !(memo.groupId && await prisma.groupMember.findFirst({ where: { groupId: memo.groupId, userId: user.id } }))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const processedMemo = {
      ...memo,
      createdAt: memo.createdAt.toISOString(),
      updatedAt: memo.updatedAt.toISOString(),
      tags: JSON.parse(memo.tags) as string[], // JSON文字列を配列にパース
    };
    return NextResponse.json({ success: true, data: processedMemo });
  } catch (error: any) {
    console.error('Error fetching memo:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, content, groupId } = await req.json();
    console.log('PUT /api/memos/[id]: id=', id, 'body=', { title, content, groupId });

    if (!title && !content && !groupId) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    const existingMemo = await prisma.memo.findUnique({ where: { id } });
    if (!existingMemo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 権限チェック：メモの作成者であること
    if (existingMemo.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only memo author can update' }, { status: 403 });
    }

    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(groupId !== undefined && { // groupIdがnullの場合も更新可能にする
          group: groupId ? { connect: { id: groupId } } : { disconnect: true }
        }),
      },
    });

    const responseData = {
      ...updatedMemo,
      createdAt: updatedMemo.createdAt.toISOString(),
      updatedAt: updatedMemo.updatedAt.toISOString(),
      tags: JSON.parse((updatedMemo as any).tags ?? '[]') as string[],
    };
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Error updating memo:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, content, tags, isPrivate, groupId } = await req.json();
    console.log('PATCH /api/memos/[id]: id=', id, 'body=', { title, content, tags, isPrivate, groupId });

    // 更新されるフィールドが1つもない場合はエラーを返す
    if (title === undefined && content === undefined && tags === undefined && isPrivate === undefined && groupId === undefined) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    const existingMemo = await prisma.memo.findUnique({ where: { id } });
    if (!existingMemo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 権限チェック：メモの作成者であること
    if (existingMemo.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only memo author can update' }, { status: 403 });
    }

    const updatedData: { [key: string]: any } = {};
    if (title !== undefined) updatedData.title = title;
    if (content !== undefined) updatedData.content = content;
    if (tags !== undefined) updatedData.tags = JSON.stringify(tags); // 配列をJSON文字列に変換
    if (isPrivate !== undefined) updatedData.isPrivate = isPrivate;
    if (groupId !== undefined) {
      updatedData.group = groupId ? { connect: { id: groupId } } : { disconnect: true };
    }

    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: updatedData,
      include: { author: { select: { id: true, email: true, name: true } }, group: true }, // 更新されたメモを返す際にauthorとgroupを含める
    });

    const responseData = {
      ...updatedMemo,
      createdAt: updatedMemo.createdAt.toISOString(),
      updatedAt: updatedMemo.updatedAt.toISOString(),
      tags: JSON.parse((updatedMemo as any).tags ?? '[]') as string[],
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Error patching memo:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existingMemo = await prisma.memo.findUnique({ where: { id } });
    if (!existingMemo) {
      return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
    }

    // 権限チェック：メモの作成者であること
    if (existingMemo.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Only memo author can delete' }, { status: 403 });
    }

    await prisma.memo.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error('Error deleting memo:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
