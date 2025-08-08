import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // JWT_SECRETはデフォルトでローカル値を使用

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn('Login: user not found for email', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Login: passwordMatch', passwordMatch);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // JWTの生成
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login: issuing JWT for', user.id);

    // HTTP Only CookieにJWTを設定
    const response = NextResponse.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax', // SameSite属性をlaxに設定
    });

    return response;
  } catch (error: any) {
    console.error('User login error:', error);
    return NextResponse.json({ error: error?.message || 'Something went wrong' }, { status: 500 });
  }
}
