import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RewardTriggers } from '@/lib/reward-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const clockSchema = z.object({
  action: z.enum(["clock_in", "clock_out"]),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// POST - Clock in/out for employee
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

    const body = await request.json();
    const validationResult = clockSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { action, location, notes } = validationResult.data;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (action === "clock_in") {
      // Check if already clocked in today
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      if (existingAttendance && existingAttendance.checkIn) {
        return NextResponse.json(
          { error: 'You have already clocked in today. Only one clock-in per day is allowed.' },
          { status: 400 }
        );
      }

      // Check operating hours
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const operatingHours = employee.company?.operatingHours as any;

      if (operatingHours && operatingHours[currentDay]) {
        const daySchedule = operatingHours[currentDay];

        if (daySchedule.closed) {
          return NextResponse.json(
            { error: 'Cannot clock in today. The company is closed on this day.' },
            { status: 400 }
          );
        }

        // Check if current time is within operating hours
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const openTime = daySchedule.open;
        const closeTime = daySchedule.close;

        if (currentTime < openTime || currentTime > closeTime) {
          return NextResponse.json(
            {
              error: `Cannot clock in outside operating hours. Today's hours: ${openTime} - ${closeTime}`,
              operatingHours: { open: openTime, close: closeTime }
            },
            { status: 400 }
          );
        }
      }

      // Calculate if late
      const expectedStartTime = employee.attendancePolicy?.startTime || "09:00";
      const [expectedHour, expectedMinute] = expectedStartTime.split(':').map(Number);
      const expectedStart = new Date(today);
      expectedStart.setHours(expectedHour, expectedMinute, 0, 0);
      
      const lateThreshold = employee.attendancePolicy?.lateThreshold || 15;
      const isLate = now.getTime() > (expectedStart.getTime() + lateThreshold * 60 * 1000);
      const isEarly = now.getTime() < expectedStart.getTime();

      let attendance;
      if (existingAttendance) {
        // Update existing record
        attendance = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkIn: now,
            checkInLocation: location,
            isLate,
            status: isLate ? 'late' : 'present',
            notes: notes || existingAttendance.notes
          }
        });
      } else {
        // Create new record
        attendance = await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            date: today,
            checkIn: now,
            checkInLocation: location,
            isLate,
            status: isLate ? 'late' : 'present',
            notes
          }
        });
      }

      // Award early arrival reward
      if (isEarly && !isLate) {
        try {
          await RewardTriggers.onPerfectAttendance(
            employee.id,
            employee.companyId,
            'daily'
          );
        } catch (rewardError) {
          console.error('Error awarding early arrival reward:', rewardError);
        }
      }

      return NextResponse.json({
        success: true,
        message: isLate ? 'Clocked in (Late)' : isEarly ? 'Clocked in (Early)' : 'Clocked in',
        attendance,
        isLate,
        isEarly
      });

    } else if (action === "clock_out") {
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
        return NextResponse.json(
          { error: 'No clock-in record found for today' },
          { status: 400 }
        );
      }

      if (attendance.checkOut) {
        return NextResponse.json(
          { error: 'Already clocked out today' },
          { status: 400 }
        );
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
          checkOutLocation: location,
          totalHours,
          overtimeHours,
          isEarlyLeave,
          notes: notes || attendance.notes
        }
      });

      return NextResponse.json({
        success: true,
        message: isEarlyLeave ? 'Clocked out (Early)' : 'Clocked out',
        attendance: updatedAttendance,
        totalHours: Math.round(totalHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        isEarlyLeave
      });
    }

  } catch (error) {
    console.error('[CLOCK_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET - Get current clock status for employee
export async function GET() {
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

    const employee = await prisma.employee.findUnique({
      where: { email: payload.email },
      include: {
        attendancePolicy: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const currentTime = new Date();
    let workingHours = 0;
    
    if (todayAttendance?.checkIn && !todayAttendance.checkOut) {
      workingHours = (currentTime.getTime() - todayAttendance.checkIn.getTime()) / (1000 * 60 * 60);
    } else if (todayAttendance?.totalHours) {
      workingHours = todayAttendance.totalHours;
    }

    return NextResponse.json({
      attendance: todayAttendance,
      isClockedIn: !!(todayAttendance?.checkIn && !todayAttendance?.checkOut),
      currentWorkingHours: Math.round(workingHours * 100) / 100,
      expectedStartTime: employee.attendancePolicy?.startTime || "09:00",
      expectedEndTime: employee.attendancePolicy?.endTime || "17:00"
    });

  } catch (error) {
    console.error('[CLOCK_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
