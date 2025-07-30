import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RewardTriggers } from '@/lib/reward-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["present", "absent", "late", "half-day", "leave", "holiday"]).optional(),
  notes: z.string().optional(),
  checkInLocation: z.string().optional(),
  checkOutLocation: z.string().optional(),
});

export async function GET(request: Request) {
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

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const whereClause: any = { companyId: user.companyId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[ATTENDANCE_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

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

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const body = await request.json();
    const validationResult = attendanceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId
      },
      include: {
        attendancePolicy: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    const attendanceDate = validatedData.date ? new Date(validatedData.date) : new Date();
    const checkInTime = validatedData.checkIn ? new Date(validatedData.checkIn) : new Date();
    const checkOutTime = validatedData.checkOut ? new Date(validatedData.checkOut) : null;

    // Calculate attendance metrics
    let totalHours = 0;
    let overtimeHours = 0;
    let isLate = false;
    let isEarlyLeave = false;

    if (checkInTime && checkOutTime) {
      totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Check if late (using policy or default 15 minutes)
      const lateThreshold = employee.attendancePolicy?.lateThreshold || 15;
      const expectedStartTime = employee.attendancePolicy?.startTime || "09:00";
      const [expectedHour, expectedMinute] = expectedStartTime.split(':').map(Number);

      const expectedStart = new Date(attendanceDate);
      expectedStart.setHours(expectedHour, expectedMinute, 0, 0);

      isLate = checkInTime.getTime() > (expectedStart.getTime() + lateThreshold * 60 * 1000);

      // Calculate overtime
      const overtimeThreshold = employee.attendancePolicy?.overtimeThreshold || 8;
      if (totalHours > overtimeThreshold) {
        overtimeHours = totalHours - overtimeThreshold;
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: validatedData.employeeId,
        companyId: user.companyId,
        date: attendanceDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: validatedData.status || 'present',
        notes: validatedData.notes,
        checkInLocation: validatedData.checkInLocation,
        checkOutLocation: validatedData.checkOutLocation,
        totalHours,
        overtimeHours,
        isLate,
        isEarlyLeave
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Trigger attendance rewards
    try {
      if (attendance.status === 'present' && !isLate) {
        // Award early arrival points if arrived early
        const expectedStartTime = employee.attendancePolicy?.startTime || "09:00";
        const [expectedHour, expectedMinute] = expectedStartTime.split(':').map(Number);
        const expectedStart = new Date(attendanceDate);
        expectedStart.setHours(expectedHour, expectedMinute, 0, 0);

        if (checkInTime.getTime() < expectedStart.getTime()) {
          await RewardTriggers.onPerfectAttendance(
            validatedData.employeeId,
            user.companyId,
            'daily'
          );
        }
      }
    } catch (rewardError) {
      console.error('Error awarding attendance reward:', rewardError);
      // Don't fail attendance creation if reward fails
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('[ATTENDANCE_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
