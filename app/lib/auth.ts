import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    const payload = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    return user;
  } catch (error: any) {
    // トークン不正はnull返却
    return null;
  }
}

// 内部サービス（例: WebSocketサーバー）からの認証用ヘルパー
export async function getAuthenticatedUserFromRequest(): Promise<User | null> {
  // まずは内部トークンでのサービス間認証を確認
  const internalToken = (await headers()).get('x-internal-api-token');
  const expectedToken = process.env.INTERNAL_API_TOKEN;
  const userIdFromHeader = (await headers()).get('x-user-id');

  if (expectedToken && internalToken === expectedToken && userIdFromHeader) {
    // 信頼できる内部呼び出しとして userId を受理
    return prisma.user.findUnique({
      where: { id: userIdFromHeader },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  // フォールバック: 通常のCookieベースJWT
  return getAuthenticatedUser();
}
