import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { analyticsCache } from '@/lib/analytics-cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get cache statistics
    const stats = analyticsCache.getStats();

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Clear the cache
    analyticsCache.clear();

    return NextResponse.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
