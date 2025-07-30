import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for approval
const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
  approverLevel: z.number().min(1),
});

// POST - Approve or reject leave application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    // Find the leave application
    const leaveApplication = await prisma.leaveApplication.findFirst({
      where: {
        id,
        companyId: user.companyId,
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
            approvalLevels: true,
          }
        },
        approvals: {
          orderBy: { approverLevel: 'asc' }
        }
      }
    });

    if (!leaveApplication) {
      return new NextResponse('Leave application not found', { status: 404 });
    }

    if (leaveApplication.status !== 'pending') {
      return new NextResponse('Leave application is not pending approval', { status: 400 });
    }

    // Find the specific approval record
    const approvalRecord = await prisma.leaveApproval.findFirst({
      where: {
        leaveApplicationId: id,
        approverLevel: validatedData.approverLevel,
        status: 'pending',
      }
    });

    if (!approvalRecord) {
      return new NextResponse('Approval record not found or already processed', { status: 404 });
    }

    // Check if this is the current approval level
    if (validatedData.approverLevel !== leaveApplication.currentApprovalLevel) {
      return new NextResponse('This approval level is not currently active', { status: 400 });
    }

    const now = new Date();

    // Update the approval record
    await prisma.leaveApproval.update({
      where: { id: approvalRecord.id },
      data: {
        status: validatedData.action === 'approve' ? 'approved' : 'rejected',
        comments: validatedData.comments,
        approverId: user.id,
        approverName: `${user.firstName} ${user.lastName}`,
        approverEmail: user.email,
        approvedAt: now,
      }
    });

    let newApplicationStatus = leaveApplication.status;
    let newApprovalLevel = leaveApplication.currentApprovalLevel;

    if (validatedData.action === 'reject') {
      // If rejected, mark the entire application as rejected
      newApplicationStatus = 'rejected';
      newApprovalLevel = 0;
    } else if (validatedData.action === 'approve') {
      // If approved, check if this was the final approval level
      if (validatedData.approverLevel >= leaveApplication.leaveType.approvalLevels) {
        // Final approval - mark as approved
        newApplicationStatus = 'approved';
        newApprovalLevel = 0;
      } else {
        // Move to next approval level
        newApprovalLevel = validatedData.approverLevel + 1;
      }
    }

    // Update the leave application
    const updatedApplication = await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: newApplicationStatus,
        currentApprovalLevel: newApprovalLevel,
      }
    });

    // Update leave balance based on final status
    if (newApplicationStatus === 'approved') {
      // Move from pending to used
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.employeeLeaveBalance.findFirst({
        where: {
          employeeId: leaveApplication.employeeId,
          leaveTypeId: leaveApplication.leaveTypeId,
          year: currentYear,
        }
      });

      if (leaveBalance) {
        await prisma.employeeLeaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            totalUsed: leaveBalance.totalUsed + leaveApplication.totalDays,
            totalPending: leaveBalance.totalPending - leaveApplication.totalDays,
            availableBalance: leaveBalance.totalEntitled + leaveBalance.carryOver - (leaveBalance.totalUsed + leaveApplication.totalDays) - (leaveBalance.totalPending - leaveApplication.totalDays),
          }
        });
      }

      // Create attendance records for approved leave
      await createAttendanceRecordsForLeave(leaveApplication);
    } else if (newApplicationStatus === 'rejected') {
      // Remove from pending
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.employeeLeaveBalance.findFirst({
        where: {
          employeeId: leaveApplication.employeeId,
          leaveTypeId: leaveApplication.leaveTypeId,
          year: currentYear,
        }
      });

      if (leaveBalance) {
        await prisma.employeeLeaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            totalPending: leaveBalance.totalPending - leaveApplication.totalDays,
            availableBalance: leaveBalance.totalEntitled + leaveBalance.carryOver - leaveBalance.totalUsed - (leaveBalance.totalPending - leaveApplication.totalDays),
          }
        });
      }
    }

    // TODO: Log the approval action when auditLog model is available
    /*
    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: validatedData.action === 'approve' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
        entityType: 'LEAVE_APPLICATION',
        entityId: id,
        details: {
          employeeId: leaveApplication.employeeId,
          employeeName: `${leaveApplication.employee.firstName} ${leaveApplication.employee.lastName}`,
          leaveType: leaveApplication.leaveType.name,
          startDate: leaveApplication.startDate,
          endDate: leaveApplication.endDate,
          totalDays: leaveApplication.totalDays,
          approverLevel: validatedData.approverLevel,
          comments: validatedData.comments,
          finalStatus: newApplicationStatus,
        },
      }
    }).catch(error => {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to create audit log:', error);
    });
    */

    return NextResponse.json({
      success: true,
      message: `Leave application ${validatedData.action}d successfully`,
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        currentApprovalLevel: updatedApplication.currentApprovalLevel,
      },
      approval: {
        approverLevel: validatedData.approverLevel,
        action: validatedData.action,
        approverName: `${user.firstName} ${user.lastName}`,
        approvedAt: now,
        comments: validatedData.comments,
      }
    });

  } catch (error) {
    console.error('[LEAVE_APPROVAL_POST]', error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), { status: 400 });
    }

    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to create attendance records for approved leave
async function createAttendanceRecordsForLeave(leaveApplication: any) {
  try {
    const attendanceRecords = [];
    const currentDate = new Date(leaveApplication.startDate);
    const endDate = new Date(leaveApplication.endDate);

    while (currentDate <= endDate) {
      // Skip weekends (assuming Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        attendanceRecords.push({
          employeeId: leaveApplication.employeeId,
          companyId: leaveApplication.companyId,
          date: new Date(currentDate),
          status: 'leave',
          notes: `${leaveApplication.leaveType.name} - ${leaveApplication.reason}`,
          totalHours: 0,
          overtimeHours: 0,
          isLate: false,
          isEarlyLeave: false,
          isManual: true,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (attendanceRecords.length > 0) {
      await prisma.attendance.createMany({
        data: attendanceRecords,
      });
    }
  } catch (error) {
    console.error('Error creating attendance records for leave:', error);
    // Don't throw error as this is not critical for the approval process
  }
}
