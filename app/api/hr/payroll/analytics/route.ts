import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch payroll analytics for finance dashboard
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
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    // Build date filters
    const dateFilters: any = {
      payrollYear: year,
    };

    if (month) {
      dateFilters.payrollMonth = month;
    }

    // Get payroll summary statistics
    const payrollSummary = await prisma.payroll.aggregate({
      where: {
        companyId: user.companyId,
        ...dateFilters,
      },
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
        pfEmployee: true,
        pfEmployer: true,
        esiEmployee: true,
        esiEmployer: true,
        professionalTax: true,
        tds: true,
        bonus: true,
        incentives: true,
        overtimeAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get payroll by status
    const payrollByStatus = await prisma.payroll.groupBy({
      by: ['status'],
      where: {
        companyId: user.companyId,
        ...dateFilters,
      },
      _count: {
        id: true,
      },
      _sum: {
        netSalary: true,
      },
    });

    // Get monthly payroll trends (last 12 months)
    const monthlyTrends = await prisma.payroll.groupBy({
      by: ['payrollYear', 'payrollMonth'],
      where: {
        companyId: user.companyId,
        OR: [
          {
            payrollYear: year,
          },
          {
            payrollYear: year - 1,
            payrollMonth: { gte: new Date().getMonth() + 1 },
          },
        ],
      },
      _sum: {
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
        pfEmployer: true,
        esiEmployer: true,
      },
      _count: {
        id: true,
      },
      orderBy: [
        { payrollYear: 'asc' },
        { payrollMonth: 'asc' },
      ],
    });

    // Get department-wise payroll breakdown
    const departmentPayroll = await prisma.payroll.findMany({
      where: {
        companyId: user.companyId,
        ...dateFilters,
      },
      include: {
        employee: {
          select: {
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
    });

    // Group by department
    const departmentSummary = departmentPayroll.reduce((acc: any, payroll) => {
      const deptName = payroll.employee.department?.name || 'No Department';
      if (!acc[deptName]) {
        acc[deptName] = {
          department: deptName,
          employeeCount: 0,
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0,
          totalCost: 0, // Including employer contributions
        };
      }
      
      acc[deptName].employeeCount++;
      acc[deptName].totalGross += payroll.grossSalary;
      acc[deptName].totalNet += payroll.netSalary;
      acc[deptName].totalDeductions += payroll.totalDeductions;
      acc[deptName].totalCost += payroll.grossSalary + payroll.pfEmployer + payroll.esiEmployer;
      
      return acc;
    }, {});

    // Get top salary earners
    const topEarners = await prisma.payroll.findMany({
      where: {
        companyId: user.companyId,
        ...dateFilters,
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
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        netSalary: 'desc',
      },
      take: 10,
    });

    // Calculate cost to company (CTC) breakdown
    const ctcBreakdown = {
      totalGrossSalary: payrollSummary._sum.grossSalary || 0,
      totalEmployerPF: payrollSummary._sum.pfEmployer || 0,
      totalEmployerESI: payrollSummary._sum.esiEmployer || 0,
      totalBonus: payrollSummary._sum.bonus || 0,
      totalIncentives: payrollSummary._sum.incentives || 0,
      totalOvertime: payrollSummary._sum.overtimeAmount || 0,
    };

    const totalCTC = ctcBreakdown.totalGrossSalary + 
                     ctcBreakdown.totalEmployerPF + 
                     ctcBreakdown.totalEmployerESI + 
                     ctcBreakdown.totalBonus + 
                     ctcBreakdown.totalIncentives + 
                     ctcBreakdown.totalOvertime;

    // Format monthly trends for charts
    const formattedMonthlyTrends = monthlyTrends.map(trend => ({
      month: `${trend.payrollYear}-${trend.payrollMonth.toString().padStart(2, '0')}`,
      monthName: new Date(trend.payrollYear, trend.payrollMonth - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      employeeCount: trend._count.id,
      grossSalary: trend._sum.grossSalary || 0,
      netSalary: trend._sum.netSalary || 0,
      deductions: trend._sum.totalDeductions || 0,
      employerContributions: (trend._sum.pfEmployer || 0) + (trend._sum.esiEmployer || 0),
      totalCost: (trend._sum.grossSalary || 0) + (trend._sum.pfEmployer || 0) + (trend._sum.esiEmployer || 0),
    }));

    // Format status breakdown
    const statusBreakdown = payrollByStatus.map(status => ({
      status: status.status,
      count: status._count.id,
      totalAmount: status._sum.netSalary || 0,
    }));

    return NextResponse.json({
      summary: {
        totalEmployees: payrollSummary._count.id,
        totalGrossSalary: payrollSummary._sum.grossSalary || 0,
        totalNetSalary: payrollSummary._sum.netSalary || 0,
        totalDeductions: payrollSummary._sum.totalDeductions || 0,
        totalEmployerPF: payrollSummary._sum.pfEmployer || 0,
        totalEmployerESI: payrollSummary._sum.esiEmployer || 0,
        totalProfessionalTax: payrollSummary._sum.professionalTax || 0,
        totalTDS: payrollSummary._sum.tds || 0,
        totalBonus: payrollSummary._sum.bonus || 0,
        totalIncentives: payrollSummary._sum.incentives || 0,
        totalOvertime: payrollSummary._sum.overtimeAmount || 0,
        totalCTC,
      },
      statusBreakdown,
      monthlyTrends: formattedMonthlyTrends,
      departmentBreakdown: Object.values(departmentSummary),
      topEarners: topEarners.map(payroll => ({
        employeeId: payroll.employee.employeeId,
        name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        department: payroll.employee.department?.name || 'No Department',
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        deductions: payroll.totalDeductions,
      })),
      ctcBreakdown,
      period: {
        year,
        month,
        monthName: month ? new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `Year ${year}`,
      },
    });

  } catch (error) {
    console.error('[PAYROLL_ANALYTICS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
