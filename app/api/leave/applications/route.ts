import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const leaveApplicationSchema = z.object({
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(["morning", "afternoon"]).optional(),
  emergencyContact: z.string().optional(),
  workHandover: z.string().optional(),
});

// GET - Fetch leave applications
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
    const status = searchParams.get('status');
    const leaveTypeId = searchParams.get('leaveTypeId');

    const whereClause: any = { companyId: user.companyId };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (leaveTypeId) {
      whereClause.leaveTypeId = leaveTypeId;
    }

    const leaveApplications = await prisma.leaveApplication.findMany({
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
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresApproval: true,
            approvalLevels: true
          }
        },
        approvals: {
          orderBy: { approverLevel: 'asc' }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: 100
    });

    return NextResponse.json(leaveApplications);
  } catch (error) {
    console.error('[LEAVE_APPLICATIONS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST - Create new leave application
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

    // Check if this is an employee applying for leave
    const employee = await prisma.employee.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    const body = await request.json();
    const validationResult = leaveApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify leave type exists and belongs to company
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: validatedData.leaveTypeId,
        companyId: employee.companyId,
        isActive: true
      }
    });

    if (!leaveType) {
      return new NextResponse('Leave type not found', { status: 404 });
    }

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Validate dates
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Check minimum notice requirement
    const today = new Date();
    const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < leaveType.minNoticeRequired) {
      return NextResponse.json(
        { 
          error: `Minimum ${leaveType.minNoticeRequired} day(s) notice required for ${leaveType.name}`,
          minNoticeRequired: leaveType.minNoticeRequired
        },
        { status: 400 }
      );
    }

    // Calculate total days
    let totalDays: number;
    if (validatedData.isHalfDay) {
      totalDays = 0.5;
    } else {
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check maximum consecutive days
    if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
      return NextResponse.json(
        { 
          error: `Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed for ${leaveType.name}`,
          maxConsecutiveDays: leaveType.maxConsecutiveDays
        },
        { status: 400 }
      );
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.employeeLeaveBalance.findFirst({
      where: {
        employeeId: employee.id,
        leaveTypeId: validatedData.leaveTypeId,
        year: currentYear
      }
    });

    if (leaveBalance && !leaveType.allowNegativeBalance) {
      if (leaveBalance.availableBalance < totalDays) {
        return NextResponse.json(
          { 
            error: `Insufficient leave balance. Available: ${leaveBalance.availableBalance} days, Requested: ${totalDays} days`,
            availableBalance: leaveBalance.availableBalance,
            requestedDays: totalDays
          },
          { status: 400 }
        );
      }
    }

    // Create leave application
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        employeeId: employee.id,
        leaveTypeId: validatedData.leaveTypeId,
        companyId: employee.companyId,
        startDate,
        endDate,
        totalDays,
        reason: validatedData.reason,
        isHalfDay: validatedData.isHalfDay,
        halfDayPeriod: validatedData.halfDayPeriod,
        emergencyContact: validatedData.emergencyContact,
        workHandover: validatedData.workHandover,
        status: leaveType.requiresApproval ? 'pending' : 'approved'
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            requiresApproval: true,
            approvalLevels: true
          }
        }
      }
    });

    // Create approval records if required
    if (leaveType.requiresApproval) {
      for (let level = 1; level <= leaveType.approvalLevels; level++) {
        await prisma.leaveApproval.create({
          data: {
            leaveApplicationId: leaveApplication.id,
            approverLevel: level,
            status: 'pending'
          }
        });
      }
    }

    // Update leave balance (mark as pending)
    if (leaveBalance) {
      await prisma.employeeLeaveBalance.update({
        where: { id: leaveBalance.id },
        data: {
          totalPending: leaveBalance.totalPending + totalDays,
          availableBalance: leaveBalance.availableBalance - totalDays
        }
      });
    }

    return NextResponse.json(leaveApplication);
  } catch (error) {
    console.error('[LEAVE_APPLICATIONS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
