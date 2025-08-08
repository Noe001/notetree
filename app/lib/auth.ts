import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;

interface CustomJwtPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  console.log('getAuthenticatedUser: Request received.');
  // Next.js 15 以降では cookies() は非同期
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  console.log('getAuthenticatedUser: All cookies:', cookieStore);
  console.log('getAuthenticatedUser: auth_token value:', token);

  if (!token) {
    console.log('getAuthenticatedUser: No token found.');
    return null;
  }

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    const payload = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
    console.log('getAuthenticatedUser: JWT decoded payload:', payload);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    return user;
  } catch (error: any) {
    console.error('getAuthenticatedUser: JWT verification failed:', error);
    return null;
  }
}
