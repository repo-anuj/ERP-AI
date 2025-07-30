import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PushNotificationPayload {
  title: string;
  message: string;
  type: 'task' | 'approval' | 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  taskId?: string;
  projectId?: string;
  requiresAction?: boolean;
  icon?: string;
  badge?: string;
}

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
    const {
      userIds,
      payload: notificationPayload,
      sendToAll = false
    }: {
      userIds?: string[];
      payload: PushNotificationPayload;
      sendToAll?: boolean;
    } = body;

    if (!notificationPayload || !notificationPayload.title || !notificationPayload.message) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    let targetUserIds: string[] = [];

    if (sendToAll) {
      // Send to all users with active subscriptions
      const users = await prisma.user.findMany({
        where: {
          pushSubscriptions: {
            some: {
              isActive: true
            }
          }
        },
        select: { id: true }
      });
      targetUserIds = users.map(user => user.id);
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return NextResponse.json(
        { error: 'No target users specified' },
        { status: 400 }
      );
    }

    // Get active push subscriptions for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: targetUserIds },
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found for target users' },
        { status: 404 }
      );
    }

    // Prepare notification payload
    const pushPayload = {
      title: notificationPayload.title,
      body: notificationPayload.message,
      icon: notificationPayload.icon || '/favicon.ico',
      badge: notificationPayload.badge || '/favicon.ico',
      tag: `${notificationPayload.type}-${Date.now()}`,
      requireInteraction: notificationPayload.requiresAction || notificationPayload.priority === 'urgent',
      data: {
        url: notificationPayload.actionUrl,
        taskId: notificationPayload.taskId,
        projectId: notificationPayload.projectId,
        type: notificationPayload.type,
        priority: notificationPayload.priority
      },
      actions: getNotificationActions(notificationPayload.type, notificationPayload.requiresAction)
    };

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(pushPayload),
            {
              TTL: 24 * 60 * 60, // 24 hours
              urgency: notificationPayload.priority === 'urgent' ? 'high' :
                      notificationPayload.priority === 'high' ? 'normal' : 'low'
            }
          );

          return {
            success: true,
            userId: subscription.userId,
            subscriptionId: subscription.id
          };
        } catch (error: any) {
          console.error(`Failed to send notification to user ${subscription.userId}:`, error);
          
          // If subscription is invalid, deactivate it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false }
            });
          }

          return {
            success: false,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            error: error.message
          };
        }
      })
    );

    // Count successful and failed sends
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failed = results.length - successful;

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
      )
    });

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

function getNotificationActions(type: string, requiresAction?: boolean) {
  const actions = [];

  if (type === 'task' && requiresAction) {
    actions.push(
      { action: 'view', title: 'View Task' },
      { action: 'dismiss', title: 'Dismiss' }
    );
  } else if (type === 'approval') {
    actions.push(
      { action: 'approve', title: 'Approve' },
      { action: 'view', title: 'View Details' }
    );
  } else {
    actions.push(
      { action: 'view', title: 'View' }
    );
  }

  return actions;
}

// Test endpoint
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

    // Send test notification to current user
    const testPayload: PushNotificationPayload = {
      title: 'ERP Test Notification',
      message: 'This is a test notification to verify push notifications are working correctly.',
      type: 'info',
      priority: 'medium',
      actionUrl: '/dashboard'
    };

    // Get user's active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found' },
        { status: 404 }
      );
    }

    // Send test notification
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey
          }
        };

        return webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: testPayload.title,
            body: testPayload.message,
            icon: '/favicon.ico',
            tag: 'test-notification'
          })
        );
      })
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      sent: successful,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
