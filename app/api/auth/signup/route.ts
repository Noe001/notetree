import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, password, and username are required' }, { status: 400 });
  }

  // JWT_SECRETはデフォルトでローカル値を使用

  try {
    // 先に email の重複を確認（name の重複チェックは一時的に無効化）
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    // if (existingUserByName) {
    //   return NextResponse.json({ error: 'Name already taken' }, { status: 409 });
    // }
    const existingUser = existingUserByEmail;
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Signup: creating user');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    // JWTの生成
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Signup: token issued for', user.id);

    // HTTP Only CookieにJWTを設定
    const response = NextResponse.json({ message: 'User registered successfully', user });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax', // SameSite属性をlaxに設定
    });

    return response;
  } catch (error: any) {
    console.error('User registration error:', error);
    return NextResponse.json({ error: error?.message || 'Something went wrong' }, { status: 500 });
  }
}
