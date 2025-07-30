import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Generate attendance reports
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
    const reportType = searchParams.get('type') || 'monthly';
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');
    const departmentId = searchParams.get('departmentId');
    const employeeId = searchParams.get('employeeId');

    // Parse month and calculate date range
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, monthNum - 1));
    const endDate = endOfMonth(new Date(year, monthNum - 1));

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    switch (reportType) {
      case 'monthly':
        return await generateMonthlyReport(user.companyId, startDate, endDate, whereClause);
      case 'daily':
        return await generateDailyReport(user.companyId, startDate, endDate, whereClause);
      case 'summary':
        return await generateSummaryReport(user.companyId, startDate, endDate, whereClause);
      case 'overtime':
        return await generateOvertimeReport(user.companyId, startDate, endDate, whereClause);
      case 'late-arrivals':
        return await generateLateArrivalsReport(user.companyId, startDate, endDate, whereClause);
      default:
        return new NextResponse('Invalid report type', { status: 400 });
    }

  } catch (error) {
    console.error('[ATTENDANCE_REPORTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// Generate monthly attendance report
async function generateMonthlyReport(companyId: string, startDate: Date, endDate: Date, whereClause: any) {
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      status: 'active',
      ...(whereClause.employee && whereClause.employee),
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        }
      },
      attendance: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  // Generate all days in the interval
  const allDays: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    allDays.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const report = employees.map(employee => {
    const attendanceMap = new Map(
      employee.attendance.map(att => [format(att.date, 'yyyy-MM-dd'), att])
    );

    const dailyRecords = allDays.map((day: Date) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const attendance = attendanceMap.get(dayKey);
      
      return {
        date: dayKey,
        status: attendance?.status || 'absent',
        checkIn: attendance?.checkIn,
        checkOut: attendance?.checkOut,
        totalHours: attendance?.totalHours || 0,
        overtimeHours: attendance?.overtimeHours || 0,
        isLate: attendance?.isLate || false,
        isEarlyLeave: attendance?.isEarlyLeave || false,
      };
    });

    // Calculate statistics
    const presentDays = dailyRecords.filter((d: any) => d.status === 'present').length;
    const absentDays = dailyRecords.filter((d: any) => d.status === 'absent').length;
    const lateDays = dailyRecords.filter((d: any) => d.isLate).length;
    const totalHours = dailyRecords.reduce((sum: number, d: any) => sum + d.totalHours, 0);
    const totalOvertimeHours = dailyRecords.reduce((sum: number, d: any) => sum + d.overtimeHours, 0);

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department?.name,
      },
      statistics: {
        totalWorkingDays: allDays.length,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: (presentDays / allDays.length) * 100,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerDay: Math.round((totalHours / presentDays || 0) * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      },
      dailyRecords,
    };
  });

  return NextResponse.json({
    reportType: 'monthly',
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      month: format(startDate, 'MMMM yyyy'),
    },
    summary: {
      totalEmployees: employees.length,
      totalWorkingDays: allDays.length,
      averageAttendance: report.reduce((sum, emp) => sum + emp.statistics.attendancePercentage, 0) / report.length,
      totalHours: report.reduce((sum, emp) => sum + emp.statistics.totalHours, 0),
      totalOvertimeHours: report.reduce((sum, emp) => sum + emp.statistics.totalOvertimeHours, 0),
    },
    employees: report,
  });
}

// Generate daily attendance report
async function generateDailyReport(companyId: string, startDate: Date, endDate: Date, whereClause: any) {
  const attendanceRecords = await prisma.attendance.findMany({
    where: whereClause,
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
      }
    },
    orderBy: [{ date: 'desc' }, { checkIn: 'asc' }],
  });

  const groupedByDate = attendanceRecords.reduce((acc, record) => {
    const dateKey = format(record.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push({
      id: record.id,
      employee: {
        id: record.employee.id,
        name: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeId: record.employee.employeeId,
        department: record.employee.department?.name,
      },
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      totalHours: record.totalHours,
      overtimeHours: record.overtimeHours,
      isLate: record.isLate,
      isEarlyLeave: record.isEarlyLeave,
      checkInLocation: record.checkInLocation,
      checkOutLocation: record.checkOutLocation,
      notes: record.notes,
    });
    return acc;
  }, {} as Record<string, any[]>);

  const dailyReports = Object.entries(groupedByDate).map(([date, records]) => ({
    date,
    totalEmployees: records.length,
    presentCount: records.filter(r => r.status === 'present').length,
    absentCount: records.filter(r => r.status === 'absent').length,
    lateCount: records.filter(r => r.isLate).length,
    totalHours: records.reduce((sum, r) => sum + (r.totalHours || 0), 0),
    totalOvertimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
    records,
  }));

  return NextResponse.json({
    reportType: 'daily',
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    },
    dailyReports: dailyReports.sort((a, b) => b.date.localeCompare(a.date)),
  });
}

// Generate summary report
async function generateSummaryReport(companyId: string, startDate: Date, endDate: Date, whereClause: any) {
  const [
    totalEmployees,
    attendanceStats,
    departmentStats,
    overtimeStats,
  ] = await Promise.all([
    prisma.employee.count({
      where: {
        companyId,
        status: 'active',
      }
    }),

    prisma.attendance.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true },
    }),

    prisma.attendance.groupBy({
      by: ['employeeId'],
      where: whereClause,
      _count: { employeeId: true },
    }),

    prisma.attendance.aggregate({
      where: {
        ...whereClause,
        overtimeHours: { gt: 0 },
      },
      _sum: { overtimeHours: true },
      _avg: { overtimeHours: true },
      _count: { overtimeHours: true },
    }),
  ]);

  const statusCounts = attendanceStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.status;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    reportType: 'summary',
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    },
    summary: {
      totalEmployees,
      totalRecords: attendanceStats.reduce((sum, stat) => sum + stat._count.status, 0),
      statusBreakdown: statusCounts,
      attendancePercentage: statusCounts.present ? (statusCounts.present / (statusCounts.present + statusCounts.absent)) * 100 : 0,
      overtimeStats: {
        totalOvertimeHours: overtimeStats._sum.overtimeHours || 0,
        averageOvertimeHours: overtimeStats._avg.overtimeHours || 0,
        employeesWithOvertime: overtimeStats._count.overtimeHours || 0,
      },
    },
  });
}

// Generate overtime report
async function generateOvertimeReport(companyId: string, startDate: Date, endDate: Date, whereClause: any) {
  const overtimeRecords = await prisma.attendance.findMany({
    where: {
      ...whereClause,
      overtimeHours: { gt: 0 },
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
      }
    },
    orderBy: [{ overtimeHours: 'desc' }, { date: 'desc' }],
  });

  return NextResponse.json({
    reportType: 'overtime',
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    },
    summary: {
      totalRecords: overtimeRecords.length,
      totalOvertimeHours: overtimeRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
      averageOvertimeHours: overtimeRecords.length > 0 
        ? overtimeRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0) / overtimeRecords.length 
        : 0,
    },
    records: overtimeRecords.map(record => ({
      id: record.id,
      date: format(record.date, 'yyyy-MM-dd'),
      employee: {
        id: record.employee.id,
        name: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeId: record.employee.employeeId,
        department: record.employee.department?.name,
      },
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      totalHours: record.totalHours,
      overtimeHours: record.overtimeHours,
      notes: record.notes,
    })),
  });
}

// Generate late arrivals report
async function generateLateArrivalsReport(companyId: string, startDate: Date, endDate: Date, whereClause: any) {
  const lateRecords = await prisma.attendance.findMany({
    where: {
      ...whereClause,
      isLate: true,
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
      }
    },
    orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
  });

  return NextResponse.json({
    reportType: 'late-arrivals',
    period: {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    },
    summary: {
      totalLateArrivals: lateRecords.length,
      uniqueEmployees: new Set(lateRecords.map(r => r.employeeId)).size,
    },
    records: lateRecords.map(record => ({
      id: record.id,
      date: format(record.date, 'yyyy-MM-dd'),
      employee: {
        id: record.employee.id,
        name: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeId: record.employee.employeeId,
        department: record.employee.department?.name,
      },
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      totalHours: record.totalHours,
      checkInLocation: record.checkInLocation,
      notes: record.notes,
    })),
  });
}
