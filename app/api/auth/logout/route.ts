import { NextRequest, NextResponse } from 'next/server';

function buildLogoutResponse() {
  const response = NextResponse.json({ message: 'Logout successful' });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function POST(req: NextRequest) {
  try {
    return buildLogoutResponse();
  } catch (error: any) {
    console.error('User logout error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}

// GETでもログアウトできるようにして、ブラウザ遷移のみでクッキーを確実に削除可能にする
export async function GET(req: NextRequest) {
  try {
    return buildLogoutResponse();
  } catch (error: any) {
    console.error('User logout error (GET):', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
