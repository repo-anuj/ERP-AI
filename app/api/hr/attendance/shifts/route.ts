import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for shift
const shiftSchema = z.object({
  name: z.string().min(1, "Shift name is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - Fetch shifts
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

    const shifts = await prisma.shift.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        employeeShifts: {
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
          where: {
            isActive: true,
          }
        },
        _count: {
          select: {
            employeeShifts: {
              where: {
                isActive: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const shiftsWithStats = shifts.map(shift => ({
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description,
      color: shift.color,
      isActive: shift.isActive,
      employeeCount: shift._count.employeeShifts,
      employees: shift.employeeShifts.map(es => ({
        id: es.employee.id,
        name: `${es.employee.firstName} ${es.employee.lastName}`,
        employeeId: es.employee.employeeId,
        startDate: es.startDate,
        endDate: es.endDate,
        daysOfWeek: es.daysOfWeek,
      })),
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    }));

    return NextResponse.json(shiftsWithStats);

  } catch (error) {
    console.error('[SHIFTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create shift
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
    const validatedData = shiftSchema.parse(body);

    // Validate time logic
    const startTime = validatedData.startTime;
    const endTime = validatedData.endTime;
    
    // Convert times to minutes for comparison
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    if (startMinutes >= endMinutes) {
      return new NextResponse('End time must be after start time', { status: 400 });
    }

    // Check for duplicate shift names
    const existingShift = await prisma.shift.findFirst({
      where: {
        companyId: user.companyId,
        name: validatedData.name,
      }
    });

    if (existingShift) {
      return new NextResponse('Shift with this name already exists', { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        ...validatedData,
        companyId: user.companyId,
      },
      include: {
        _count: {
          select: {
            employeeShifts: true
          }
        }
      }
    });

    return NextResponse.json({
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description,
      color: shift.color,
      isActive: shift.isActive,
      employeeCount: shift._count.employeeShifts,
      employees: [],
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
    }, { status: 201 });

  } catch (error) {
    console.error('[SHIFTS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
