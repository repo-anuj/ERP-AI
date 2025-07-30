import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for leave type
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
});

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

// GET - Fetch leave types
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause: any = {
      companyId: user.companyId,
    };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            leaveApplications: true,
            employeeLeaveBalances: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedLeaveTypes = leaveTypes.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      maxDaysPerYear: type.maxDaysPerYear,
      carryOverDays: type.carryOverDays,
      minNoticeRequired: type.minNoticeRequired,
      maxConsecutiveDays: type.maxConsecutiveDays,
      requiresApproval: type.requiresApproval,
      approvalLevels: type.approvalLevels,
      accrualRate: type.accrualRate,
      accrualStartDate: type.accrualStartDate,
      allowHalfDays: type.allowHalfDays,
      allowNegativeBalance: type.allowNegativeBalance,
      isActive: type.isActive,
      totalApplications: type._count.leaveApplications,
      totalEmployeesWithBalance: type._count.employeeLeaveBalances,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    }));

    return NextResponse.json(formattedLeaveTypes);

  } catch (error) {
    console.error('[LEAVE_TYPES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create leave type
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

    // Ensure companyId is not null for TypeScript
    const companyId = user.companyId;

    const body = await request.json();
    const validatedData = leaveTypeSchema.parse(body);

    // Check for duplicate leave type names
    const existingLeaveType = await prisma.leaveType.findFirst({
      where: {
        companyId: user.companyId,
        name: validatedData.name,
      }
    });

    if (existingLeaveType) {
      return new NextResponse('Leave type with this name already exists', { status: 400 });
    }

    // Validate business logic
    if (validatedData.maxConsecutiveDays && validatedData.maxConsecutiveDays > validatedData.maxDaysPerYear) {
      return new NextResponse('Maximum consecutive days cannot exceed maximum days per year', { status: 400 });
    }

    if (validatedData.carryOverDays > validatedData.maxDaysPerYear) {
      return new NextResponse('Carry over days cannot exceed maximum days per year', { status: 400 });
    }

    // Create leave type
    const leaveType = await prisma.leaveType.create({
      data: {
        ...validatedData,
        companyId: companyId,
      },
      include: {
        _count: {
          select: {
            leaveApplications: true,
            employeeLeaveBalances: true,
          }
        }
      }
    });

    // Create leave balances for all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
        status: 'active',
      },
      select: {
        id: true,
        hireDate: true,
      }
    });

    const currentYear = new Date().getFullYear();
    const leaveBalances = activeEmployees.map(employee => {
      // Calculate entitled days based on accrual settings
      let totalEntitled = validatedData.maxDaysPerYear;
      
      if (validatedData.accrualStartDate === 'hire_date' && employee.hireDate) {
        const hireDate = new Date(employee.hireDate);
        const currentDate = new Date();
        
        // If hired this year, calculate pro-rated entitlement
        if (hireDate.getFullYear() === currentYear) {
          const monthsWorked = (currentDate.getMonth() - hireDate.getMonth()) + 1;
          totalEntitled = Math.round((validatedData.accrualRate * monthsWorked) * 100) / 100;
        }
      }

      return {
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        year: currentYear,
        totalEntitled,
        totalUsed: 0,
        totalPending: 0,
        carryOver: 0,
        availableBalance: totalEntitled,
        companyId: companyId,
      };
    });

    if (leaveBalances.length > 0) {
      await prisma.employeeLeaveBalance.createMany({
        data: leaveBalances,
      });
    }

    return NextResponse.json({
      id: leaveType.id,
      name: leaveType.name,
      description: leaveType.description,
      maxDaysPerYear: leaveType.maxDaysPerYear,
      carryOverDays: leaveType.carryOverDays,
      minNoticeRequired: leaveType.minNoticeRequired,
      maxConsecutiveDays: leaveType.maxConsecutiveDays,
      requiresApproval: leaveType.requiresApproval,
      approvalLevels: leaveType.approvalLevels,
      accrualRate: leaveType.accrualRate,
      accrualStartDate: leaveType.accrualStartDate,
      allowHalfDays: leaveType.allowHalfDays,
      allowNegativeBalance: leaveType.allowNegativeBalance,
      isActive: leaveType.isActive,
      totalApplications: leaveType._count.leaveApplications,
      totalEmployeesWithBalance: leaveBalances.length,
      createdAt: leaveType.createdAt,
      updatedAt: leaveType.updatedAt,
    }, { status: 201 });

  } catch (error) {
    console.error('[LEAVE_TYPES_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
