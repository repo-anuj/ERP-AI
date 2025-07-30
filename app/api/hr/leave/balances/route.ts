import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for balance adjustment
const balanceAdjustmentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  year: z.number().min(2020, "Invalid year"),
  adjustmentType: z.enum(['add', 'deduct']),
  adjustmentDays: z.number().min(0.5, "Adjustment must be at least 0.5 days"),
  reason: z.string().min(1, "Reason is required"),
});

type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentSchema>;

// GET - Fetch leave balances
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
    const leaveTypeId = searchParams.get('leaveTypeId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const departmentId = searchParams.get('departmentId');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
      year: year,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (leaveTypeId) {
      whereClause.leaveTypeId = leaveTypeId;
    }

    if (departmentId) {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    const leaveBalances = await prisma.employeeLeaveBalance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            email: true,
            hireDate: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            maxDaysPerYear: true,
            carryOverDays: true,
            allowNegativeBalance: true,
          }
        }
      },
      orderBy: [
        { employee: { employeeId: 'asc' } },
        { leaveType: { name: 'asc' } }
      ]
    });

    // Group balances by employee for better presentation
    const employeeBalances = leaveBalances.reduce((acc, balance) => {
      const employeeKey = balance.employee.id;
      
      if (!acc[employeeKey]) {
        acc[employeeKey] = {
          employee: {
            id: balance.employee.id,
            name: `${balance.employee.firstName} ${balance.employee.lastName}`,
            employeeId: balance.employee.employeeId,
            email: balance.employee.email,
            hireDate: balance.employee.hireDate,
            department: balance.employee.department?.name,
          },
          balances: [],
          totalEntitled: 0,
          totalUsed: 0,
          totalAvailable: 0,
        };
      }

      const balanceData = {
        id: balance.id,
        leaveType: {
          id: balance.leaveType.id,
          name: balance.leaveType.name,
          maxDaysPerYear: balance.leaveType.maxDaysPerYear,
          carryOverDays: balance.leaveType.carryOverDays,
          allowNegativeBalance: balance.leaveType.allowNegativeBalance,
        },
        year: balance.year,
        totalEntitled: balance.totalEntitled,
        totalUsed: balance.totalUsed,
        totalPending: balance.totalPending,
        carryOver: balance.carryOver,
        availableBalance: balance.availableBalance,
        lastUpdated: balance.updatedAt,
      };

      acc[employeeKey].balances.push(balanceData);
      acc[employeeKey].totalEntitled += balance.totalEntitled;
      acc[employeeKey].totalUsed += balance.totalUsed;
      acc[employeeKey].totalAvailable += balance.availableBalance;

      return acc;
    }, {} as Record<string, any>);

    // Convert to array format
    const formattedBalances = Object.values(employeeBalances);

    // Calculate summary statistics
    const summary = {
      totalEmployees: formattedBalances.length,
      totalEntitledDays: leaveBalances.reduce((sum, balance) => sum + balance.totalEntitled, 0),
      totalUsedDays: leaveBalances.reduce((sum, balance) => sum + balance.totalUsed, 0),
      totalPendingDays: leaveBalances.reduce((sum, balance) => sum + balance.totalPending, 0),
      totalAvailableDays: leaveBalances.reduce((sum, balance) => sum + balance.availableBalance, 0),
      utilizationPercentage: 0,
    };

    if (summary.totalEntitledDays > 0) {
      summary.utilizationPercentage = Math.round((summary.totalUsedDays / summary.totalEntitledDays) * 100 * 100) / 100;
    }

    return NextResponse.json({
      balances: formattedBalances,
      summary,
      year,
      filters: {
        employeeId,
        leaveTypeId,
        departmentId,
      }
    });

  } catch (error) {
    console.error('[LEAVE_BALANCES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Adjust leave balance
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
    const validatedData = balanceAdjustmentSchema.parse(body);

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

    // Verify leave type belongs to company
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: validatedData.leaveTypeId,
        companyId: user.companyId,
      }
    });

    if (!leaveType) {
      return new NextResponse('Leave type not found', { status: 404 });
    }

    // Find existing balance record
    const existingBalance = await prisma.employeeLeaveBalance.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        leaveTypeId: validatedData.leaveTypeId,
        year: validatedData.year,
        companyId: user.companyId,
      }
    });

    if (!existingBalance) {
      return new NextResponse('Leave balance record not found', { status: 404 });
    }

    // Calculate new balance values
    let newTotalEntitled = existingBalance.totalEntitled;
    let newAvailableBalance = existingBalance.availableBalance;

    if (validatedData.adjustmentType === 'add') {
      newTotalEntitled += validatedData.adjustmentDays;
      newAvailableBalance += validatedData.adjustmentDays;
    } else {
      newTotalEntitled -= validatedData.adjustmentDays;
      newAvailableBalance -= validatedData.adjustmentDays;
    }

    // Validate the adjustment
    if (newTotalEntitled < 0) {
      return new NextResponse('Adjustment would result in negative entitled balance', { status: 400 });
    }

    if (!leaveType.allowNegativeBalance && newAvailableBalance < 0) {
      return new NextResponse('Adjustment would result in negative available balance', { status: 400 });
    }

    // Update the balance record
    const updatedBalance = await prisma.employeeLeaveBalance.update({
      where: { id: existingBalance.id },
      data: {
        totalEntitled: newTotalEntitled,
        availableBalance: newAvailableBalance,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Create audit log for the adjustment
    await createAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: AUDIT_ACTIONS.ADJUST_LEAVE_BALANCE,
      entityType: ENTITY_TYPES.LEAVE_BALANCE,
      entityId: updatedBalance.id,
      companyId: user.companyId,
      details: {
        employeeId: validatedData.employeeId,
        employeeName: `${updatedBalance.employee.firstName} ${updatedBalance.employee.lastName}`,
        leaveType: updatedBalance.leaveType.name,
        year: validatedData.year,
        adjustmentType: validatedData.adjustmentType,
        adjustmentDays: validatedData.adjustmentDays,
        reason: validatedData.reason,
        previousEntitled: existingBalance.totalEntitled,
        newEntitled: newTotalEntitled,
        previousAvailable: existingBalance.availableBalance,
        newAvailable: newAvailableBalance,
        adjustedBy: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Leave balance ${validatedData.adjustmentType === 'add' ? 'increased' : 'decreased'} by ${validatedData.adjustmentDays} days`,
      balance: {
        id: updatedBalance.id,
        employee: {
          id: updatedBalance.employee.id,
          name: `${updatedBalance.employee.firstName} ${updatedBalance.employee.lastName}`,
          employeeId: updatedBalance.employee.employeeId,
        },
        leaveType: {
          id: updatedBalance.leaveType.id,
          name: updatedBalance.leaveType.name,
        },
        year: updatedBalance.year,
        totalEntitled: updatedBalance.totalEntitled,
        totalUsed: updatedBalance.totalUsed,
        totalPending: updatedBalance.totalPending,
        carryOver: updatedBalance.carryOver,
        availableBalance: updatedBalance.availableBalance,
        adjustment: {
          type: validatedData.adjustmentType,
          days: validatedData.adjustmentDays,
          reason: validatedData.reason,
          adjustedBy: `${user.firstName} ${user.lastName}`,
          adjustedAt: new Date(),
        }
      }
    });

  } catch (error) {
    console.error('[LEAVE_BALANCES_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
