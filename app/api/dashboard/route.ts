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
      where: { email: payload.email as string },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const companyId = user.companyId;

    // Get employee count
    const employeeCount = await prisma.employee.count({
      where: { companyId }
    });

    // Get inventory count
    const inventoryCount = await prisma.inventoryItem.count({
      where: { companyId }
    });

    // Get active sales count (excluding returns)
    const activeSalesCount = await prisma.sale.count({
      where: {
        companyId,
        status: { not: 'returned' }
      }
    });

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        status: { not: 'returned' } // Exclude returns
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    // Get recent sales for dashboard
    const recentSales = sales.slice(0, 5).map(sale => ({
      id: sale.id,
      name: sale.customer.name,
      email: sale.customer.email || '',
      amount: sale.total,
      date: sale.date
    }));

    // Get recent employees
    const recentEmployees = await prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: true,
        createdAt: true
      }
    });

    // Get department distribution
    // Group employees by department
    const employees = await prisma.employee.findMany({
      where: { companyId },
      select: {
        department: true
      }
    });

    // Count employees by department
    const departmentCounts: Record<string, number> = {};
    employees.forEach(emp => {
      const dept = emp.department;
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const departmentDistribution = Object.entries(departmentCounts).map(([name, count]) => ({
      name,
      count
    }));

    // Calculate monthly sales for the current year
    const currentYear = new Date().getFullYear();
    const monthlySalesMap = new Map();

    // Initialize with zero values for all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
      monthlySalesMap.set(index, { name: month, total: 0 });
    });

    // Populate with actual sales data
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate.getFullYear() === currentYear) {
        const month = saleDate.getMonth();
        const currentTotal = monthlySalesMap.get(month).total;
        monthlySalesMap.set(month, {
          name: months[month],
          total: currentTotal + sale.total
        });
      }
    });

    const monthlySales = Array.from(monthlySalesMap.values());

    // Get top performing employees (by sales)
    const topEmployees = await prisma.employee.findMany({
      where: { companyId },
      include: {
        sales: {
          where: {
            status: { not: 'returned' }
          }
        }
      },
      take: 5
    });

    const topPerformingEmployees = topEmployees
      .map(employee => {
        const totalSales = employee.sales.reduce((sum, sale) => sum + sale.total, 0);
        return {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employee.position,
          department: employee.department,
          totalSales,
          salesCount: employee.sales.length
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    // Return dashboard data
    return NextResponse.json({
      employeeCount,
      inventoryCount,
      activeSalesCount,
      totalSales: sales.length,
      totalRevenue,
      recentSales,
      monthlySales,
      recentEmployees,
      departmentDistribution,
      topPerformingEmployees
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
