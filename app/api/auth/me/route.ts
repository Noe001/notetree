import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt } });
  } catch (error: any) {
    console.error('Error fetching authenticated user:', error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
