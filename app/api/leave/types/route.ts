import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const leaveTypeSchema = z.object({
  name: z.string().min(1, "Leave type name is required"),
  description: z.string().optional(),
  maxDaysPerYear: z.number().min(1, "Maximum days must be at least 1"),
  carryOverDays: z.number().min(0, "Carry over days cannot be negative"),
  minNoticeRequired: z.number().min(0, "Notice required cannot be negative"),
  maxConsecutiveDays: z.number().optional(),
  requiresApproval: z.boolean().default(true),
  approvalLevels: z.number().min(1, "At least 1 approval level required"),
  accrualRate: z.number().min(0, "Accrual rate cannot be negative"),
  accrualStartDate: z.enum(["hire_date", "year_start"]).default("hire_date"),
  allowHalfDays: z.boolean().default(true),
  allowNegativeBalance: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// GET - Fetch all leave types for company
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

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: {
          select: { 
            leaveApplications: true,
            employeeLeaveBalances: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error('[LEAVE_TYPES_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new leave type
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
    const validationResult = leaveTypeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if leave type with same name already exists
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        companyId: user.companyId
      }
    });

    if (existingLeaveType) {
      return NextResponse.json(
        { error: 'Leave type with this name already exists' },
        { status: 400 }
      );
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        ...validatedData,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: { 
            leaveApplications: true,
            employeeLeaveBalances: true
          }
        }
      }
    });

    // Create leave balances for all active employees
    const employees = await prisma.employee.findMany({
      where: {
        companyId: user.companyId,
        status: 'active'
      }
    });

    const currentYear = new Date().getFullYear();
    
    for (const employee of employees) {
      await prisma.employeeLeaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          companyId: user.companyId,
          year: currentYear,
          totalEntitled: validatedData.maxDaysPerYear,
          availableBalance: validatedData.maxDaysPerYear
        }
      });
    }

    return NextResponse.json(leaveType);
  } catch (error) {
    console.error('[LEAVE_TYPES_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
