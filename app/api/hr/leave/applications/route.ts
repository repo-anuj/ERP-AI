import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { differenceInDays, addDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for leave application
const leaveApplicationSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  reason: z.string().min(1, "Reason is required"),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional(),
  emergencyContact: z.string().optional(),
  workHandover: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

type LeaveApplicationFormValues = z.infer<typeof leaveApplicationSchema>;

// GET - Fetch leave applications
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
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const leaveTypeId = searchParams.get('leaveTypeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (leaveTypeId) {
      whereClause.leaveTypeId = leaveTypeId;
    }

    if (startDate && endDate) {
      whereClause.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch applications with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.leaveApplication.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              email: true,
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
              requiresApproval: true,
            }
          },
          approvals: {
            orderBy: { approverLevel: 'asc' }
          }
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.leaveApplication.count({
        where: whereClause,
      })
    ]);

    const formattedApplications = applications.map(app => ({
      id: app.id,
      employee: {
        id: app.employee.id,
        name: `${app.employee.firstName} ${app.employee.lastName}`,
        employeeId: app.employee.employeeId,
        email: app.employee.email,
        department: app.employee.department?.name,
      },
      leaveType: {
        id: app.leaveType.id,
        name: app.leaveType.name,
        maxDaysPerYear: app.leaveType.maxDaysPerYear,
        requiresApproval: app.leaveType.requiresApproval,
      },
      startDate: app.startDate,
      endDate: app.endDate,
      totalDays: app.totalDays,
      reason: app.reason,
      isHalfDay: app.isHalfDay,
      halfDayPeriod: app.halfDayPeriod,
      status: app.status,
      appliedAt: app.appliedAt,
      emergencyContact: app.emergencyContact,
      workHandover: app.workHandover,
      attachments: app.attachments,
      currentApprovalLevel: app.currentApprovalLevel,
      approvals: app.approvals.map(approval => ({
        id: approval.id,
        approverLevel: approval.approverLevel,
        approverName: approval.approverName,
        approverEmail: approval.approverEmail,
        status: approval.status,
        comments: approval.comments,
        approvedAt: approval.approvedAt,
      })),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return NextResponse.json({
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('[LEAVE_APPLICATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST - Create leave application
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
    const validatedData = leaveApplicationSchema.parse(body);

    // Validate dates
    if (validatedData.startDate >= validatedData.endDate) {
      return new NextResponse('End date must be after start date', { status: 400 });
    }

    // Check if start date is in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (validatedData.startDate < today) {
      return new NextResponse('Cannot apply for leave in the past', { status: 400 });
    }

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
        isActive: true,
      }
    });

    if (!leaveType) {
      return new NextResponse('Leave type not found', { status: 404 });
    }

    // Calculate total days
    let totalDays: number;
    if (validatedData.isHalfDay) {
      totalDays = 0.5;
    } else {
      totalDays = differenceInDays(validatedData.endDate, validatedData.startDate) + 1;
    }

    // Check for overlapping leave applications
    const overlappingLeave = await prisma.leaveApplication.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        status: {
          in: ['pending', 'approved'],
        },
        OR: [
          {
            startDate: { lte: validatedData.startDate },
            endDate: { gte: validatedData.startDate },
          },
          {
            startDate: { lte: validatedData.endDate },
            endDate: { gte: validatedData.endDate },
          },
          {
            startDate: { gte: validatedData.startDate },
            endDate: { lte: validatedData.endDate },
          },
        ],
      }
    });

    if (overlappingLeave) {
      return new NextResponse('Leave application overlaps with existing leave', { status: 400 });
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.employeeLeaveBalance.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        leaveTypeId: validatedData.leaveTypeId,
        year: currentYear,
      }
    });

    if (leaveBalance) {
      const availableBalance = leaveBalance.availableBalance;
      if (totalDays > availableBalance && !leaveType.allowNegativeBalance) {
        return new NextResponse(`Insufficient leave balance. Available: ${availableBalance} days`, { status: 400 });
      }
    }

    // Check minimum notice requirement
    const daysUntilStart = differenceInDays(validatedData.startDate, new Date());
    if (daysUntilStart < leaveType.minNoticeRequired) {
      return new NextResponse(`Minimum ${leaveType.minNoticeRequired} days notice required`, { status: 400 });
    }

    // Check maximum consecutive days
    if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
      return new NextResponse(`Maximum ${leaveType.maxConsecutiveDays} consecutive days allowed`, { status: 400 });
    }

    // Create leave application
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        employeeId: validatedData.employeeId,
        leaveTypeId: validatedData.leaveTypeId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        totalDays,
        reason: validatedData.reason,
        isHalfDay: validatedData.isHalfDay,
        halfDayPeriod: validatedData.halfDayPeriod,
        emergencyContact: validatedData.emergencyContact,
        workHandover: validatedData.workHandover,
        attachments: validatedData.attachments,
        companyId: user.companyId,
        status: leaveType.requiresApproval ? 'pending' : 'approved',
        currentApprovalLevel: leaveType.requiresApproval ? 1 : 0,
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

    // Create approval records if required
    if (leaveType.requiresApproval) {
      const approvalRecords = [];
      for (let level = 1; level <= leaveType.approvalLevels; level++) {
        approvalRecords.push({
          leaveApplicationId: leaveApplication.id,
          approverLevel: level,
          status: 'pending',
        });
      }

      await prisma.leaveApproval.createMany({
        data: approvalRecords,
      });
    }

    // Update leave balance
    if (leaveBalance) {
      await prisma.employeeLeaveBalance.update({
        where: { id: leaveBalance.id },
        data: {
          totalPending: leaveBalance.totalPending + totalDays,
          availableBalance: leaveBalance.totalEntitled + leaveBalance.carryOver - leaveBalance.totalUsed - (leaveBalance.totalPending + totalDays),
        }
      });
    }

    return NextResponse.json({
      id: leaveApplication.id,
      employee: {
        id: leaveApplication.employee.id,
        name: `${leaveApplication.employee.firstName} ${leaveApplication.employee.lastName}`,
        employeeId: leaveApplication.employee.employeeId,
      },
      leaveType: {
        id: leaveApplication.leaveType.id,
        name: leaveApplication.leaveType.name,
      },
      startDate: leaveApplication.startDate,
      endDate: leaveApplication.endDate,
      totalDays: leaveApplication.totalDays,
      reason: leaveApplication.reason,
      status: leaveApplication.status,
      appliedAt: leaveApplication.appliedAt,
    }, { status: 201 });

  } catch (error) {
    console.error('[LEAVE_APPLICATIONS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}
