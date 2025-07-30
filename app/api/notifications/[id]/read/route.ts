import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    let userId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      const employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee?.company) {
        return new NextResponse('Employee or company not found', { status: 404 });
      }

      // Find the user record for this employee
      const user = await prisma.user.findFirst({
        where: {
          email: employee.email,
          companyId: employee.company.id
        }
      });

      if (!user) {
        return new NextResponse('User record not found for employee', { status: 404 });
      }

      userId = user.id;
    } else {
      // For regular user tokens
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('User or company not found', { status: 404 });
      }

      userId = user.id;
    }

    // Check if notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        user: {
          id: userId
        }
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: updatedNotification.id,
        read: updatedNotification.read
      }
    });

  } catch (error) {
    console.error('[NOTIFICATION_READ] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
