import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Auto clock-out on logout
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Check if this is an employee login
    const employee = await prisma.employee.findUnique({
      where: { email: payload.email },
      include: {
        company: true,
        attendancePolicy: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance || !attendance.checkIn) {
      return NextResponse.json({
        success: false,
        message: 'No active clock-in session found'
      });
    }

    if (attendance.checkOut) {
      return NextResponse.json({
        success: false,
        message: 'Already clocked out'
      });
    }

    // Calculate work hours
    const totalHours = (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
    const overtimeThreshold = employee.attendancePolicy?.overtimeThreshold || 8;
    const overtimeHours = totalHours > overtimeThreshold ? totalHours - overtimeThreshold : 0;

    // Check for early leave
    const expectedEndTime = employee.attendancePolicy?.endTime || "17:00";
    const [expectedHour, expectedMinute] = expectedEndTime.split(':').map(Number);
    const expectedEnd = new Date(today);
    expectedEnd.setHours(expectedHour, expectedMinute, 0, 0);
    const isEarlyLeave = now.getTime() < expectedEnd.getTime();

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLocation: 'Auto clock-out on logout',
        totalHours,
        overtimeHours,
        isEarlyLeave,
        notes: attendance.notes ? `${attendance.notes} | Auto clock-out on logout` : 'Auto clock-out on logout'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully clocked out on logout',
      attendance: updatedAttendance,
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      isEarlyLeave
    });

  } catch (error) {
    console.error('[AUTO_CLOCK_OUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
