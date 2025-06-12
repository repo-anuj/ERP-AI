import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
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

    // Get all employees with their start dates
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId },
      select: { startDate: true }
    });

    // Group employees by month and year of start date
    const employeesByMonth: Record<string, number> = {};

    // Initialize with the last 12 months
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      employeesByMonth[monthYear] = 0;
    }

    // Count employees by month
    employees.forEach(employee => {
      const date = new Date(employee.startDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (employeesByMonth[monthYear] !== undefined) {
        employeesByMonth[monthYear]++;
      }
    });

    // Convert to array for chart data
    const growthData = Object.entries(employeesByMonth)
      .map(([monthYear, count]) => {
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          year: year,
          count: count
        };
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.year}-${a.month}-01`);
        const dateB = new Date(`${b.year}-${b.month}-01`);
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json({
      totalEmployees: employees.length,
      growthData
    });
  } catch (error) {
    console.error('Error fetching employee growth data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
