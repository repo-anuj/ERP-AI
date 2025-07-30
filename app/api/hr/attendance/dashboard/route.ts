import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch attendance dashboard data
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
    const dateRange = searchParams.get('range') || 'today';
    const departmentId = searchParams.get('departmentId');

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last7days':
        startDate = startOfDay(subDays(now, 6));
        endDate = endOfDay(now);
        break;
      case 'last30days':
        startDate = startOfDay(subDays(now, 29));
        endDate = endOfDay(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    // Build where clause for attendance records
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

    // Parallel data fetching for better performance
    const [
      attendanceRecords,
      totalEmployees,
      attendanceStats,
      departmentStats,
      recentActivity,
      overtimeStats,
      lateArrivals,
      earlyDepartures
    ] = await Promise.all([
      // Attendance records
      prisma.attendance.findMany({
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
        orderBy: { date: 'desc' },
        take: 100,
      }),

      // Total active employees
      prisma.employee.count({
        where: {
          companyId: user.companyId,
          status: 'active',
          ...(departmentId && { departmentId }),
        }
      }),

      // Attendance statistics
      prisma.attendance.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true,
        },
      }),

      // Department-wise attendance - get unique employee IDs first
      prisma.attendance.groupBy({
        by: ['employeeId'],
        where: whereClause,
        _count: {
          employeeId: true,
        }
      }),

      // Recent attendance activity
      prisma.attendance.findMany({
        where: {
          companyId: user.companyId,
          date: {
            gte: startOfDay(now),
            lte: endOfDay(now),
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
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

      // Overtime statistics
      prisma.attendance.aggregate({
        where: {
          ...whereClause,
          overtimeHours: { gt: 0 },
        },
        _sum: { overtimeHours: true },
        _avg: { overtimeHours: true },
        _count: { overtimeHours: true },
      }),

      // Late arrivals
      prisma.attendance.count({
        where: {
          ...whereClause,
          isLate: true,
        },
      }),

      // Early departures
      prisma.attendance.count({
        where: {
          ...whereClause,
          isEarlyLeave: true,
        },
      }),
    ]);

    // Process attendance statistics
    const statusCounts = attendanceStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Calculate attendance percentage
    const totalRecords = attendanceRecords.length;
    const presentCount = statusCounts.present || 0;
    const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Calculate average working hours
    const totalHours = attendanceRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const averageHours = totalRecords > 0 ? totalHours / totalRecords : 0;

    // Process department-wise data
    const departmentAttendance = await Promise.all(
      (await prisma.department.findMany({
        where: { companyId: user.companyId },
        include: {
          employees: {
            where: { status: 'active' },
            include: {
              attendance: {
                where: {
                  date: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
            },
          },
        },
      })).map(async (dept) => {
        const totalEmployees = dept.employees.length;
        const totalAttendanceRecords = dept.employees.reduce(
          (sum, emp) => sum + emp.attendance.length,
          0
        );
        const presentRecords = dept.employees.reduce(
          (sum, emp) => sum + emp.attendance.filter(att => att.status === 'present').length,
          0
        );
        
        return {
          id: dept.id,
          name: dept.name,
          totalEmployees,
          attendancePercentage: totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0,
          totalRecords: totalAttendanceRecords,
        };
      })
    );

    // Generate daily attendance trend for the period
    const dailyTrend = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayRecords = attendanceRecords.filter(record => 
        format(new Date(record.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      );
      
      const dayPresent = dayRecords.filter(record => record.status === 'present').length;
      const dayTotal = dayRecords.length;
      
      dailyTrend.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        present: dayPresent,
        total: dayTotal,
        percentage: dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const dashboardData = {
      summary: {
        totalEmployees,
        presentToday: statusCounts.present || 0,
        absentToday: statusCounts.absent || 0,
        lateToday: statusCounts.late || 0,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        averageWorkingHours: Math.round(averageHours * 100) / 100,
        totalOvertimeHours: overtimeStats._sum.overtimeHours || 0,
        averageOvertimeHours: Math.round((overtimeStats._avg.overtimeHours || 0) * 100) / 100,
        lateArrivals,
        earlyDepartures,
      },
      
      statusBreakdown: {
        present: statusCounts.present || 0,
        absent: statusCounts.absent || 0,
        late: statusCounts.late || 0,
        'half-day': statusCounts['half-day'] || 0,
        leave: statusCounts.leave || 0,
        holiday: statusCounts.holiday || 0,
      },

      departmentStats: departmentAttendance,
      
      dailyTrend,
      
      recentActivity: recentActivity.map(record => ({
        id: record.id,
        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeId: record.employee.employeeId,
        action: record.checkOut ? 'Check Out' : 'Check In',
        time: record.checkOut || record.checkIn,
        status: record.status,
        location: record.checkOut ? record.checkOutLocation : record.checkInLocation,
      })),

      attendanceRecords: attendanceRecords.map(record => ({
        id: record.id,
        date: record.date,
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
        employee: {
          id: record.employee.id,
          name: `${record.employee.firstName} ${record.employee.lastName}`,
          employeeId: record.employee.employeeId,
          department: record.employee.department?.name,
        },
      })),

      filters: {
        dateRange,
        departmentId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[ATTENDANCE_DASHBOARD_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
