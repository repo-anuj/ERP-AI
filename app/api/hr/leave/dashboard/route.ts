import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, format, addDays, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch leave dashboard data
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const departmentId = searchParams.get('departmentId');

    // Calculate date ranges
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    // Build where clause for filtering
    const whereClause: any = {
      companyId: user.companyId,
    };

    if (departmentId) {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    // Parallel data fetching for better performance
    const [
      leaveApplications,
      pendingApprovals,
      leaveBalances,
      leaveTypes,
      recentApplications,
      upcomingLeaves,
      departmentStats,
      monthlyTrends
    ] = await Promise.all([
      // All leave applications for the year
      prisma.leaveApplication.findMany({
        where: {
          ...whereClause,
          startDate: {
            gte: yearStart,
            lte: yearEnd,
          },
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
          leaveType: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      }),

      // Pending approvals
      prisma.leaveApplication.findMany({
        where: {
          ...whereClause,
          status: 'pending',
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
        },
        orderBy: { appliedAt: 'asc' }
      }),

      // Employee leave balances
      prisma.employeeLeaveBalance.findMany({
        where: {
          companyId: user.companyId,
          year: year,
          ...(departmentId && {
            employee: {
              departmentId: departmentId,
            }
          }),
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
          leaveType: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),

      // Leave types
      prisma.leaveType.findMany({
        where: {
          companyId: user.companyId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              leaveApplications: {
                where: {
                  startDate: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                }
              }
            }
          }
        }
      }),

      // Recent applications (last 30 days)
      prisma.leaveApplication.findMany({
        where: {
          ...whereClause,
          appliedAt: {
            gte: subDays(new Date(), 30),
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
          },
          leaveType: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: 10
      }),

      // Upcoming leaves (next 30 days)
      prisma.leaveApplication.findMany({
        where: {
          ...whereClause,
          status: 'approved',
          startDate: {
            gte: new Date(),
            lte: addDays(new Date(), 30),
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
          },
          leaveType: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { startDate: 'asc' }
      }),

      // Department-wise statistics
      prisma.department.findMany({
        where: {
          companyId: user.companyId,
        },
        include: {
          employees: {
            where: {
              status: 'active',
            },
            include: {
              leaveApplications: {
                where: {
                  startDate: {
                    gte: yearStart,
                    lte: yearEnd,
                  },
                }
              }
            }
          }
        }
      }),

      // Monthly trends for the year
      prisma.leaveApplication.groupBy({
        by: ['startDate'],
        where: {
          ...whereClause,
          startDate: {
            gte: yearStart,
            lte: yearEnd,
          },
          status: 'approved',
        },
        _count: {
          id: true,
        },
        _sum: {
          totalDays: true,
        }
      })
    ]);

    // Process statistics
    const totalApplications = leaveApplications.length;
    const approvedApplications = leaveApplications.filter(app => app.status === 'approved').length;
    const rejectedApplications = leaveApplications.filter(app => app.status === 'rejected').length;
    const pendingApplicationsCount = leaveApplications.filter(app => app.status === 'pending').length;

    // Calculate total leave days
    const totalLeaveDays = leaveApplications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + app.totalDays, 0);

    // Process leave type statistics
    const leaveTypeStats = leaveTypes.map(type => {
      const applications = leaveApplications.filter(app => app.leaveTypeId === type.id);
      const approvedApps = applications.filter(app => app.status === 'approved');
      const totalDays = approvedApps.reduce((sum, app) => sum + app.totalDays, 0);

      return {
        id: type.id,
        name: type.name,
        totalApplications: applications.length,
        approvedApplications: approvedApps.length,
        totalDays,
        averageDays: approvedApps.length > 0 ? totalDays / approvedApps.length : 0,
      };
    });

    // Process department statistics
    const departmentLeaveStats = departmentStats.map(dept => {
      const totalEmployees = dept.employees.length;
      const totalApplications = dept.employees.reduce(
        (sum, emp) => sum + emp.leaveApplications.length,
        0
      );
      const approvedApplications = dept.employees.reduce(
        (sum, emp) => sum + emp.leaveApplications.filter(app => app.status === 'approved').length,
        0
      );
      const totalDays = dept.employees.reduce(
        (sum, emp) => sum + emp.leaveApplications
          .filter(app => app.status === 'approved')
          .reduce((daySum, app) => daySum + app.totalDays, 0),
        0
      );

      return {
        id: dept.id,
        name: dept.name,
        totalEmployees,
        totalApplications,
        approvedApplications,
        totalDays,
        averageDaysPerEmployee: totalEmployees > 0 ? totalDays / totalEmployees : 0,
      };
    });

    // Process monthly trends
    const monthlyLeaveData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthApplications = leaveApplications.filter(app => {
        const appMonth = new Date(app.startDate).getMonth() + 1;
        return appMonth === month && app.status === 'approved';
      });

      return {
        month: format(new Date(year, index), 'MMM'),
        applications: monthApplications.length,
        totalDays: monthApplications.reduce((sum, app) => sum + app.totalDays, 0),
      };
    });

    // Calculate leave utilization
    const totalEntitledDays = leaveBalances.reduce((sum, balance) => sum + balance.totalEntitled, 0);
    const totalUsedDays = leaveBalances.reduce((sum, balance) => sum + balance.totalUsed, 0);
    const utilizationPercentage = totalEntitledDays > 0 ? (totalUsedDays / totalEntitledDays) * 100 : 0;

    const dashboardData = {
      summary: {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications: pendingApplicationsCount,
        totalLeaveDays,
        averageLeaveDays: approvedApplications > 0 ? totalLeaveDays / approvedApplications : 0,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        totalEntitledDays,
        totalUsedDays,
        totalAvailableDays: totalEntitledDays - totalUsedDays,
      },

      leaveTypeStats,
      departmentStats: departmentLeaveStats,
      monthlyTrends: monthlyLeaveData,

      pendingApprovals: pendingApprovals.map(app => ({
        id: app.id,
        employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
        employeeId: app.employee.employeeId,
        leaveType: app.leaveType.name,
        startDate: app.startDate,
        endDate: app.endDate,
        totalDays: app.totalDays,
        reason: app.reason,
        appliedAt: app.appliedAt,
        urgency: calculateUrgency(app.startDate),
      })),

      recentApplications: recentApplications.map(app => ({
        id: app.id,
        employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
        employeeId: app.employee.employeeId,
        leaveType: app.leaveType.name,
        startDate: app.startDate,
        endDate: app.endDate,
        totalDays: app.totalDays,
        status: app.status,
        appliedAt: app.appliedAt,
      })),

      upcomingLeaves: upcomingLeaves.map(app => ({
        id: app.id,
        employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
        employeeId: app.employee.employeeId,
        leaveType: app.leaveType.name,
        startDate: app.startDate,
        endDate: app.endDate,
        totalDays: app.totalDays,
        daysUntilStart: Math.ceil((new Date(app.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      })),

      filters: {
        year,
        departmentId,
      },
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[LEAVE_DASHBOARD_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to calculate urgency of pending approvals
function calculateUrgency(startDate: Date): 'high' | 'medium' | 'low' {
  const daysUntilStart = Math.ceil((new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilStart <= 3) return 'high';
  if (daysUntilStart <= 7) return 'medium';
  return 'low';
}
