import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for shift assignment
const shiftAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  shiftId: z.string().min(1, "Shift ID is required"),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
});

// GET - Fetch shift assignments
export async function GET(request: NextRequest) {
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
    const shiftId = searchParams.get('shiftId');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (shiftId) {
      whereClause.shiftId = shiftId;
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    // Add company filter through employee relationship
    whereClause.employee = {
      companyId: user.companyId,
    };

    const shiftAssignments = await prisma.employeeShift.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            color: true,
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    const formattedAssignments = shiftAssignments.map(assignment => ({
      id: assignment.id,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      daysOfWeek: assignment.daysOfWeek,
      isActive: assignment.isActive,
      employee: {
        id: assignment.employee.id,
        name: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        employeeId: assignment.employee.employeeId,
        department: assignment.employee.department?.name,
      },
      shift: {
        id: assignment.shift.id,
        name: assignment.shift.name,
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
        color: assignment.shift.color,
      },
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));

    return NextResponse.json(formattedAssignments);

  } catch (error) {
    console.error('[SHIFT_ASSIGNMENTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create shift assignment
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

    const body = await request.json();
    const validatedData = shiftAssignmentSchema.parse(body);

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        companyId: user.companyId,
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Verify shift belongs to company
    const shift = await prisma.shift.findFirst({
      where: {
        id: validatedData.shiftId,
        companyId: user.companyId,
      }
    });

    if (!shift) {
      return new NextResponse('Shift not found', { status: 404 });
    }

    // Check for overlapping assignments
    const overlappingAssignment = await prisma.employeeShift.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        isActive: true,
        OR: [
          {
            startDate: { lte: validatedData.startDate },
            endDate: { gte: validatedData.startDate },
          },
          {
            startDate: { lte: validatedData.endDate || new Date('2099-12-31') },
            endDate: { gte: validatedData.endDate || new Date('2099-12-31') },
          },
          {
            startDate: { gte: validatedData.startDate },
            endDate: { lte: validatedData.endDate || new Date('2099-12-31') },
          },
        ],
      }
    });

    if (overlappingAssignment) {
      return new NextResponse('Employee already has an active shift assignment for this period', { status: 400 });
    }

    const shiftAssignment = await prisma.employeeShift.create({
      data: {
        employeeId: validatedData.employeeId,
        shiftId: validatedData.shiftId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        daysOfWeek: validatedData.daysOfWeek,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            color: true,
          }
        }
      }
    });

    const formattedAssignment = {
      id: shiftAssignment.id,
      startDate: shiftAssignment.startDate,
      endDate: shiftAssignment.endDate,
      daysOfWeek: shiftAssignment.daysOfWeek,
      isActive: shiftAssignment.isActive,
      employee: {
        id: shiftAssignment.employee.id,
        name: `${shiftAssignment.employee.firstName} ${shiftAssignment.employee.lastName}`,
        employeeId: shiftAssignment.employee.employeeId,
        department: shiftAssignment.employee.department?.name,
      },
      shift: {
        id: shiftAssignment.shift.id,
        name: shiftAssignment.shift.name,
        startTime: shiftAssignment.shift.startTime,
        endTime: shiftAssignment.shift.endTime,
        color: shiftAssignment.shift.color,
      },
      createdAt: shiftAssignment.createdAt,
      updatedAt: shiftAssignment.updatedAt,
    };

    return NextResponse.json(formattedAssignment, { status: 201 });

  } catch (error) {
    console.error('[SHIFT_ASSIGNMENTS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
