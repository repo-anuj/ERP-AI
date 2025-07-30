import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || '0');

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    // Calculate date range for the requested month/year
    let startDate: Date;
    let endDate: Date;

    if (month > 0 && year > 0) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get attendance records for the employee in the specified date range
    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        companyId: companyId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json({
      attendance,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      },
      period: {
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('[EMPLOYEE_ATTENDANCE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const body = await request.json();
    const { action, date, notes } = body;

    let employee;
    let companyId;

    // Check if this is an employee token
    if (payload.isEmployee) {
      // For employee tokens, get employee directly from payload
      employee = await prisma.employee.findUnique({
        where: { id: payload.id },
        include: { company: true }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      if (!employee.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      companyId = employee.company.id;
    } else {
      // For regular user tokens, get user and then employee record
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
      });

      if (!user?.company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      // Get employee record
      employee = await prisma.employee.findFirst({
        where: {
          email: payload.email,
          companyId: user.company.id
        }
      });

      if (!employee) {
        return new NextResponse('Employee not found', { status: 404 });
      }

      companyId = user.company.id;
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance record already exists for the date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        companyId: companyId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (action === 'check_in') {
      if (existingAttendance && existingAttendance.checkIn) {
        return NextResponse.json({
          error: 'Already checked in for today'
        }, { status: 400 });
      }

      const now = new Date();
      const attendance = existingAttendance 
        ? await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              checkIn: now,
              status: 'present',
              notes: notes || existingAttendance.notes
            }
          })
        : await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              companyId: companyId,
              date: attendanceDate,
              checkIn: now,
              status: 'present',
              notes: notes || ''
            }
          });

      return NextResponse.json({
        message: 'Checked in successfully',
        attendance
      });

    } else if (action === 'check_out') {
      if (!existingAttendance || !existingAttendance.checkIn) {
        return NextResponse.json({
          error: 'Must check in first'
        }, { status: 400 });
      }

      if (existingAttendance.checkOut) {
        return NextResponse.json({
          error: 'Already checked out for today'
        }, { status: 400 });
      }

      const now = new Date();
      const attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOut: now,
          notes: notes || existingAttendance.notes
        }
      });

      return NextResponse.json({
        message: 'Checked out successfully',
        attendance
      });

    } else if (action === 'mark_leave') {
      if (existingAttendance) {
        return NextResponse.json({
          error: 'Attendance already recorded for this date'
        }, { status: 400 });
      }

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          companyId: companyId,
          date: attendanceDate,
          status: 'leave',
          notes: notes || 'Leave day'
        }
      });

      return NextResponse.json({
        message: 'Leave marked successfully',
        attendance
      });

    } else {
      return NextResponse.json({
        error: 'Invalid action'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[EMPLOYEE_ATTENDANCE_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
