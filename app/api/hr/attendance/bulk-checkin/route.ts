import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for bulk check-in
const bulkCheckInSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  checkInTime: z.string().transform((str) => new Date(str)),
  location: z.string().optional().default('Office'),
  notes: z.string().optional(),
});

// POST - Bulk check-in for all active employees
export async function POST(request: NextRequest) {
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

    const companyId = user.companyId;

    const body = await request.json();
    const validatedData = bulkCheckInSchema.parse(body);

    // Get all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
        status: 'active',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
      }
    });

    if (activeEmployees.length === 0) {
      return new NextResponse('No active employees found', { status: 404 });
    }

    // Check if attendance records already exist for today
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        companyId: user.companyId,
        date: {
          gte: new Date(validatedData.date.toDateString()),
          lt: new Date(new Date(validatedData.date.toDateString()).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        employeeId: true,
      }
    });

    const existingEmployeeIds = new Set(existingAttendance.map(att => att.employeeId));

    // Filter out employees who already have attendance records
    const employeesToCheckIn = activeEmployees.filter(emp => !existingEmployeeIds.has(emp.id));

    if (employeesToCheckIn.length === 0) {
      return new NextResponse('All employees already have attendance records for this date', { status: 400 });
    }

    // Create attendance records for all employees
    const attendanceRecords = employeesToCheckIn.map(employee => ({
      employeeId: employee.id,
      companyId: companyId,
      date: validatedData.date,
      checkIn: validatedData.checkInTime,
      checkInLocation: validatedData.location,
      status: 'present' as const,
      notes: validatedData.notes || `Bulk check-in by ${user.firstName} ${user.lastName}`,
      isManual: true,
    }));

    // Bulk create attendance records
    const createdRecords = await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    // Get the created records with employee details for response
    const createdAttendance = await prisma.attendance.findMany({
      where: {
        companyId: companyId,
        date: {
          gte: new Date(validatedData.date.toDateString()),
          lt: new Date(new Date(validatedData.date.toDateString()).getTime() + 24 * 60 * 60 * 1000),
        },
        employeeId: {
          in: employeesToCheckIn.map(emp => emp.id),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bulk check-in completed for ${createdRecords.count} employees`,
      count: createdRecords.count,
      totalEmployees: activeEmployees.length,
      alreadyCheckedIn: existingAttendance.length,
      records: createdAttendance.map(record => ({
        id: record.id,
        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeId: record.employee.employeeId,
        checkIn: record.checkIn,
        status: record.status,
        location: record.checkInLocation,
      })),
    }, { status: 201 });

  } catch (error) {
    console.error('[BULK_CHECKIN_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
