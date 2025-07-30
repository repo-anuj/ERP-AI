import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch comprehensive HR analytics data
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
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Parallel data fetching for better performance
    const [
      employeeStats,
      departmentStats,
      attendanceStats,
      leaveStats,
      rewardStats,
      performanceStats,
      recentActivities
    ] = await Promise.all([
      getEmployeeStats(user.companyId),
      getDepartmentStats(user.companyId),
      getAttendanceStats(user.companyId, startDate),
      getLeaveStats(user.companyId, startDate),
      getRewardStats(user.companyId, startDate),
      getPerformanceStats(user.companyId),
      getRecentActivities(user.companyId, startDate)
    ]);

    const analytics = {
      employeeStats,
      departmentStats,
      attendanceStats,
      leaveStats,
      rewardStats,
      performanceStats,
      recentActivities,
      timeRange: parseInt(timeRange),
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[HR_ANALYTICS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Employee Statistics
async function getEmployeeStats(companyId: string) {
  const [totalEmployees, activeEmployees, newHires, departments] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, status: 'active' } }),
    prisma.employee.count({
      where: {
        companyId,
        hireDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    }),
    prisma.department.count({ where: { companyId } })
  ]);

  const employeesByDepartment = await prisma.employee.groupBy({
    by: ['departmentId'],
    where: { companyId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  const employeesByStatus = await prisma.employee.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });

  return {
    totalEmployees,
    activeEmployees,
    newHires,
    departments,
    employeesByDepartment,
    employeesByStatus,
    growthRate: totalEmployees > 0 ? (newHires / totalEmployees) * 100 : 0
  };
}

// Department Statistics
async function getDepartmentStats(companyId: string) {
  const departmentData = await prisma.department.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { employees: true }
      },
      employees: {
        select: {
          status: true,
          hireDate: true
        }
      }
    }
  });

  return departmentData.map(dept => ({
    id: dept.id,
    name: dept.name,
    totalEmployees: dept._count.employees,
    activeEmployees: dept.employees.filter(emp => emp.status === 'active').length,
    newHires: dept.employees.filter(emp => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return emp.hireDate && emp.hireDate >= thirtyDaysAgo;
    }).length
  }));
}

// Attendance Statistics
async function getAttendanceStats(companyId: string, startDate: Date) {
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      companyId,
      date: { gte: startDate }
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  const totalRecords = attendanceRecords.length;
  const onTimeRecords = attendanceRecords.filter(record => {
    if (!record.checkIn) return false;
    const clockInHour = record.checkIn.getHours();
    return clockInHour <= 9; // Assuming 9 AM is on-time
  }).length;

  const lateRecords = totalRecords - onTimeRecords;
  const averageHours = attendanceRecords.reduce((sum, record) => {
    return sum + (record.totalHours || 0);
  }, 0) / (totalRecords || 1);

  const dailyAttendance = await prisma.attendance.groupBy({
    by: ['date'],
    where: {
      companyId,
      date: { gte: startDate }
    },
    _count: { id: true }
  });

  return {
    totalRecords,
    onTimeRecords,
    lateRecords,
    onTimePercentage: totalRecords > 0 ? (onTimeRecords / totalRecords) * 100 : 0,
    averageHours: Math.round(averageHours * 100) / 100,
    dailyAttendance: dailyAttendance.map(day => ({
      date: day.date,
      count: day._count.id
    }))
  };
}

// Leave Statistics
async function getLeaveStats(companyId: string, startDate: Date) {
  const [totalApplications, pendingApplications, approvedApplications, rejectedApplications] = await Promise.all([
    prisma.leaveApplication.count({ where: { companyId } }),
    prisma.leaveApplication.count({ where: { companyId, status: 'pending' } }),
    prisma.leaveApplication.count({ where: { companyId, status: 'approved' } }),
    prisma.leaveApplication.count({ where: { companyId, status: 'rejected' } })
  ]);

  const leaveByType = await prisma.leaveApplication.groupBy({
    by: ['leaveTypeId'],
    where: { companyId },
    _count: { id: true },
    _sum: { totalDays: true }
  });

  const leaveTypeDetails = await prisma.leaveType.findMany({
    where: { companyId },
    select: { id: true, name: true }
  });

  const leaveByTypeWithNames = leaveByType.map(leave => {
    const leaveType = leaveTypeDetails.find(lt => lt.id === leave.leaveTypeId);
    return {
      leaveTypeId: leave.leaveTypeId,
      leaveTypeName: leaveType?.name || 'Unknown',
      applications: leave._count.id,
      totalDays: leave._sum.totalDays || 0
    };
  });

  const monthlyLeaveApplications = await prisma.leaveApplication.groupBy({
    by: ['appliedAt'],
    where: {
      companyId,
      appliedAt: { gte: startDate }
    },
    _count: { id: true }
  });

  return {
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    approvalRate: totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0,
    leaveByType: leaveByTypeWithNames,
    monthlyApplications: monthlyLeaveApplications
  };
}

// Reward Statistics
async function getRewardStats(companyId: string, startDate: Date) {
  const [totalRewards, totalPoints, activeEmployeesWithRewards] = await Promise.all([
    prisma.reward.count({ where: { companyId } }),
    prisma.reward.aggregate({
      where: { companyId },
      _sum: { points: true }
    }),
    prisma.employee.count({
      where: {
        companyId,
        status: 'active',
        rewards: { some: {} }
      }
    })
  ]);

  const rewardsByType = await prisma.reward.groupBy({
    by: ['rewardTypeId'],
    where: { companyId },
    _count: { id: true },
    _sum: { points: true }
  });

  const topPerformers = await prisma.employee.findMany({
    where: { companyId, status: 'active' },
    include: {
      rewards: {
        select: { points: true }
      }
    },
    take: 10
  });

  const topPerformersWithPoints = topPerformers
    .map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      totalPoints: emp.rewards.reduce((sum, reward) => sum + (reward.points || 0), 0)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  return {
    totalRewards,
    totalPoints: totalPoints?._sum?.points || 0,
    activeEmployeesWithRewards,
    participationRate: totalRewards > 0 ? (activeEmployeesWithRewards / totalRewards) * 100 : 0,
    rewardsByType,
    topPerformers: topPerformersWithPoints
  };
}

// Performance Statistics
async function getPerformanceStats(companyId: string) {
  const [totalTemplates, totalReviews, completedReviews, totalGoals] = await Promise.all([
    prisma.performanceTemplate.count({ where: { companyId } }),
    prisma.performanceReview.count({ where: { companyId } }),
    prisma.performanceReview.count({ where: { companyId, status: 'completed' } }),
    prisma.performanceGoal.count({ where: { companyId } })
  ]);

  const reviewsByStatus = await prisma.performanceReview.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });

  const goalsByStatus = await prisma.performanceGoal.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true }
  });

  return {
    totalTemplates,
    totalReviews,
    completedReviews,
    totalGoals,
    reviewCompletionRate: totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
    reviewsByStatus,
    goalsByStatus
  };
}

// Recent Activities
async function getRecentActivities(companyId: string, startDate: Date) {
  const [recentHires, recentLeaveApplications, recentRewards, recentAttendance] = await Promise.all([
    prisma.employee.findMany({
      where: {
        companyId,
        hireDate: { gte: startDate }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        hireDate: true,
        position: true
      },
      orderBy: { hireDate: 'desc' },
      take: 5
    }),
    prisma.leaveApplication.findMany({
      where: {
        companyId,
        appliedAt: { gte: startDate }
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        },
        leaveType: {
          select: { name: true }
        }
      },
      orderBy: { appliedAt: 'desc' },
      take: 5
    }),
    prisma.reward.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate }
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: startDate }
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    })
  ]);

  return {
    recentHires,
    recentLeaveApplications,
    recentRewards,
    recentAttendance
  };
}
