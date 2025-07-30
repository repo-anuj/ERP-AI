import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
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

    // Mark all notifications as read for this user
    const result = await prisma.notification.updateMany({
      where: {
        user: {
          id: userId
        },
        read: false
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      updatedCount: result.count
    });

  } catch (error) {
    console.error('[NOTIFICATIONS_MARK_ALL_READ] Error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
