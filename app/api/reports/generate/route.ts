import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reportRequestSchema = z.object({
  reportType: z.enum([
    'employee_summary',
    'attendance_report',
    'leave_report',
    'performance_report',
    'reward_report',
    'department_analysis',
    'custom_report'
  ]),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  filters: z.object({
    departments: z.array(z.string()).optional(),
    employees: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    includeInactive: z.boolean().default(false)
  }).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(false)
});

// POST - Generate custom reports
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
    const validationResult = reportRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reportType, dateRange, filters, format, includeCharts } = validationResult.data;
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    let reportData;

    switch (reportType) {
      case 'employee_summary':
        reportData = await generateEmployeeSummaryReport(user.companyId, startDate, endDate, filters);
        break;
      case 'attendance_report':
        reportData = await generateAttendanceReport(user.companyId, startDate, endDate, filters);
        break;
      case 'leave_report':
        reportData = await generateLeaveReport(user.companyId, startDate, endDate, filters);
        break;
      case 'performance_report':
        reportData = await generatePerformanceReport(user.companyId, startDate, endDate, filters);
        break;
      case 'reward_report':
        reportData = await generateRewardReport(user.companyId, startDate, endDate, filters);
        break;
      case 'department_analysis':
        reportData = await generateDepartmentAnalysisReport(user.companyId, startDate, endDate, filters);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 });
    }

    const report = {
      reportType,
      dateRange,
      filters,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      companyName: user.company?.name,
      data: reportData,
      summary: generateReportSummary(reportData, reportType)
    };

    // Handle different output formats
    if (format === 'csv') {
      const csv = convertToCSV(reportData, reportType);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('[REPORTS_GENERATE_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Employee Summary Report
async function generateEmployeeSummaryReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = { companyId };
  
  if (filters?.departments?.length) {
    whereClause.departmentId = { in: filters.departments };
  }
  
  if (filters?.employees?.length) {
    whereClause.id = { in: filters.employees };
  }
  
  if (!filters?.includeInactive) {
    whereClause.status = 'active';
  }

  const employees = await prisma.employee.findMany({
    where: whereClause,
    include: {
      department: { select: { name: true } },
      attendance: {
        where: {
          checkIn: { gte: startDate, lte: endDate }
        },
        select: {
          checkIn: true,
          checkOut: true,
          totalHours: true,
          isLate: true
        }
      },
      leaveApplications: {
        where: {
          appliedAt: { gte: startDate, lte: endDate }
        },
        select: {
          status: true,
          totalDays: true,
          leaveType: { select: { name: true } }
        }
      },
      rewards: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          points: true,
          rewardType: true
        }
      }
    }
  });

  return employees.map(employee => ({
    id: employee.id,
    employeeId: employee.employeeId,
    name: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    position: employee.position,
    department: employee.department?.name || 'No Department',
    hireDate: employee.hireDate,
    status: employee.status,
    attendanceStats: {
      totalDays: employee.attendance.length,
      totalHours: employee.attendance.reduce((sum: number, att: any) => sum + (att.totalHours || 0), 0),
      lateDays: employee.attendance.filter((att: any) => att.isLate).length,
      averageHours: employee.attendance.length > 0
        ? employee.attendance.reduce((sum: number, att: any) => sum + (att.totalHours || 0), 0) / employee.attendance.length
        : 0
    },
    leaveStats: {
      totalApplications: employee.leaveApplications.length,
      approvedLeave: employee.leaveApplications.filter((leave: any) => leave.status === 'approved').length,
      totalLeaveDays: employee.leaveApplications
        .filter((leave: any) => leave.status === 'approved')
        .reduce((sum: number, leave: any) => sum + leave.totalDays, 0)
    },
    rewardStats: {
      totalRewards: employee.rewards.length,
      totalPoints: employee.rewards.reduce((sum: number, reward: any) => sum + (reward.points || 0), 0)
    }
  }));
}

// Attendance Report
async function generateAttendanceReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    companyId,
    checkIn: { gte: startDate, lte: endDate }
  };

  if (filters?.employees?.length) {
    whereClause.employeeId = { in: filters.employees };
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { checkIn: 'desc' }
  });

  return attendanceRecords.map(record => ({
    id: record.id,
    employee: {
      id: record.employee.id,
      employeeId: record.employee.employeeId,
      name: `${record.employee.firstName} ${record.employee.lastName}`,
      department: record.employee.department?.name || 'No Department'
    },
    date: record.checkIn?.toISOString().split('T')[0],
    clockInTime: record.checkIn,
    clockOutTime: record.checkOut,
    hoursWorked: record.totalHours,
    isLate: record.isLate,
    isEarlyDeparture: record.isEarlyLeave,
    overtimeHours: record.overtimeHours,
    location: record.checkInLocation,
    notes: record.notes
  }));
}

// Leave Report
async function generateLeaveReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    companyId,
    appliedAt: { gte: startDate, lte: endDate }
  };

  if (filters?.employees?.length) {
    whereClause.employeeId = { in: filters.employees };
  }

  const leaveApplications = await prisma.leaveApplication.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } }
        }
      },
      leaveType: {
        select: { name: true, maxDaysPerYear: true }
      }
    },
    orderBy: { appliedAt: 'desc' }
  });

  return leaveApplications.map(application => ({
    id: application.id,
    employee: {
      id: application.employee.id,
      employeeId: application.employee.employeeId,
      name: `${application.employee.firstName} ${application.employee.lastName}`,
      department: application.employee.department?.name || 'No Department'
    },
    leaveType: application.leaveType.name,
    startDate: application.startDate,
    endDate: application.endDate,
    totalDays: application.totalDays,
    isHalfDay: application.isHalfDay,
    halfDayPeriod: application.halfDayPeriod,
    reason: application.reason,
    status: application.status,
    appliedAt: application.appliedAt,
    emergencyContact: application.emergencyContact,
    workHandover: application.workHandover
  }));
}

// Performance Report
async function generatePerformanceReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    companyId,
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters?.employees?.length) {
    whereClause.employeeId = { in: filters.employees };
  }

  const performanceReviews = await prisma.performanceReview.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } }
        }
      },
      template: {
        select: { name: true, reviewType: true }
      }
    }
  });

  const performanceGoals = await prisma.performanceGoal.findMany({
    where: {
      companyId,
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.employees?.length && { employeeId: { in: filters.employees } })
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  return {
    reviews: performanceReviews.map(review => ({
      id: review.id,
      employee: {
        id: review.employee.id,
        employeeId: review.employee.employeeId,
        name: `${review.employee.firstName} ${review.employee.lastName}`,
        department: review.employee.department?.name || 'No Department'
      },
      template: review.template.name,
      reviewType: review.template.reviewType,
      status: review.status,
      overallRating: review.overallRating,
      reviewPeriodStart: review.reviewPeriodStart,
      reviewPeriodEnd: review.reviewPeriodEnd,
      dueDate: review.dueDate,
      completedAt: review.completedAt
    })),
    goals: performanceGoals.map(goal => ({
      id: goal.id,
      employee: {
        id: goal.employee.id,
        employeeId: goal.employee.employeeId,
        name: `${goal.employee.firstName} ${goal.employee.lastName}`
      },
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      progressPercent: goal.progressPercent,
      startDate: goal.startDate,
      targetDate: goal.targetDate,
      completedDate: goal.completedDate,
      achievementLevel: goal.achievementLevel
    }))
  };
}

// Reward Report
async function generateRewardReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const whereClause: any = {
    companyId,
    awardedAt: { gte: startDate, lte: endDate }
  };

  if (filters?.employees?.length) {
    whereClause.employeeId = { in: filters.employees };
  }

  const rewards = await prisma.reward.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return rewards.map((reward: any) => ({
    id: reward.id,
    employee: {
      id: reward.employee.id,
      employeeId: reward.employee.employeeId,
      name: `${reward.employee.firstName} ${reward.employee.lastName}`,
      department: reward.employee.department?.name || 'No Department'
    },
    rewardType: reward.rewardType,
    pointsEarned: reward.points,
    reason: reward.reason,
    awardedAt: reward.createdAt,
    awardedBy: reward.awardedBy
  }));
}

// Department Analysis Report
async function generateDepartmentAnalysisReport(companyId: string, startDate: Date, endDate: Date, filters?: any) {
  const departments = await prisma.department.findMany({
    where: { 
      companyId,
      ...(filters?.departments?.length && { id: { in: filters.departments } })
    },
    include: {
      employees: {
        include: {
          attendance: {
            where: {
              checkIn: { gte: startDate, lte: endDate }
            }
          },
          leaveApplications: {
            where: {
              appliedAt: { gte: startDate, lte: endDate }
            }
          },
          rewards: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    }
  });

  return departments.map((dept: any) => ({
    id: dept.id,
    name: dept.name,
    description: dept.description,
    totalEmployees: dept.employees.length,
    activeEmployees: dept.employees.filter((emp: any) => emp.status === 'active').length,
    attendanceStats: {
      totalRecords: dept.employees.reduce((sum: number, emp: any) => sum + emp.attendance.length, 0),
      averageHours: dept.employees.reduce((sum: number, emp: any) => {
        const empHours = emp.attendance.reduce((empSum: number, att: any) => empSum + (att.totalHours || 0), 0);
        return sum + empHours;
      }, 0) / Math.max(dept.employees.reduce((sum: number, emp: any) => sum + emp.attendance.length, 0), 1)
    },
    leaveStats: {
      totalApplications: dept.employees.reduce((sum: number, emp: any) => sum + emp.leaveApplications.length, 0),
      approvedApplications: dept.employees.reduce((sum: number, emp: any) =>
        sum + emp.leaveApplications.filter((leave: any) => leave.status === 'approved').length, 0)
    },
    rewardStats: {
      totalRewards: dept.employees.reduce((sum: number, emp: any) => sum + emp.rewards.length, 0),
      totalPoints: dept.employees.reduce((sum: number, emp: any) =>
        sum + emp.rewards.reduce((empSum: number, reward: any) => empSum + (reward.points || 0), 0), 0)
    }
  }));
}

// Generate report summary
function generateReportSummary(data: any, reportType: string) {
  switch (reportType) {
    case 'employee_summary':
      return {
        totalEmployees: data.length,
        averageAttendanceHours: data.reduce((sum: number, emp: any) => sum + emp.attendanceStats.averageHours, 0) / data.length,
        totalRewardsAwarded: data.reduce((sum: number, emp: any) => sum + emp.rewardStats.totalRewards, 0)
      };
    case 'attendance_report':
      return {
        totalRecords: data.length,
        averageHours: data.reduce((sum: number, record: any) => sum + (record.hoursWorked || 0), 0) / data.length,
        lateRecords: data.filter((record: any) => record.isLate).length
      };
    case 'leave_report':
      return {
        totalApplications: data.length,
        approvedApplications: data.filter((app: any) => app.status === 'approved').length,
        totalLeaveDays: data.reduce((sum: number, app: any) => sum + app.totalDays, 0)
      };
    default:
      return {};
  }
}

// Convert data to CSV format
function convertToCSV(data: any, reportType: string): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}
