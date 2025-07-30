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
    const { subscription, userAgent, timestamp } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store or update push subscription in database
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: user.id,
          endpoint: subscription.endpoint
        }
      },
      update: {
        p256dhKey: subscription.keys?.p256dh || '',
        authKey: subscription.keys?.auth || '',
        userAgent: userAgent || '',
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys?.p256dh || '',
        authKey: subscription.keys?.auth || '',
        userAgent: userAgent || '',
        isActive: true
      }
    });

    console.log('Push subscription saved:', {
      id: pushSubscription.id,
      userId: user.id,
      endpoint: subscription.endpoint.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      subscriptionId: pushSubscription.id
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get user's active push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        endpoint: sub.endpoint.substring(0, 50) + '...' // Truncate for security
      }))
    });

  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
