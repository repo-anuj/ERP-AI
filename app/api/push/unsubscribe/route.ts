import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to find companyId
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, subscriptionId } = body;

    if (subscriptionId) {
      // Deactivate specific subscription by ID
      await prisma.pushSubscription.update({
        where: {
          id: subscriptionId,
          userId: user.id
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
    } else if (endpoint) {
      // Deactivate subscription by endpoint
      await prisma.pushSubscription.updateMany({
        where: {
          userId: user.id,
          endpoint: endpoint
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
    } else {
      // Deactivate all user's subscriptions
      await prisma.pushSubscription.updateMany({
        where: {
          userId: user.id
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
    }

    console.log('Push subscription deactivated for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate subscription' },
      { status: 500 }
    );
  }
}
