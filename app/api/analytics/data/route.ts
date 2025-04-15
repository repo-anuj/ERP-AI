import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/db-utils';
import { Sale, SaleItem, Employee, InventoryItem } from '@prisma/client';
import { analyticsCache } from '@/lib/analytics-cache';

export const runtime = 'nodejs';

type DateRange = {
  startDate?: string;
  endDate?: string;
};

// Define types for analytics data
interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  stockLevel: number;
  price: number;
}

interface EmployeeSalesPerformance {
  id: string;
  name: string;
  position: string;
  department: string;
  salesCount: number;
  totalRevenue: number;
  averageSale: number;
}

interface SaleWithRelations extends Sale {
  items: SaleItem[];
  employee?: Employee;
}

function processDateRange(dateRange?: DateRange) {
  if (!dateRange) return {};

  const conditions: any = {};

  if (dateRange.startDate) {
    conditions.gte = new Date(dateRange.startDate);
  }

  if (dateRange.endDate) {
    conditions.lte = new Date(dateRange.endDate);
  }

  return conditions;
}

export async function POST(req: Request) {
  try {
    // Parse request data first to check cache
    const requestData = await req.json();

    // Generate cache key from request data
    const cacheKey = analyticsCache.generateKey(requestData);

    // Check if we have cached data for this request
    const cachedData = analyticsCache.get(cacheKey);
    if (cachedData) {
      console.log('Using cached analytics data');
      // Update the cached flag and timestamp
      const updatedCachedData = {
        ...cachedData,
        _meta: {
          ...cachedData._meta,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        }
      };
      return NextResponse.json(updatedCachedData);
    }

    console.log('Fetching fresh analytics data');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);

    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    // Use retry logic for user lookup
    const user = await withRetry(async () => {
      return prisma.user.findUnique({
        where: { email: payload.email as string },
        include: { company: true }
      });
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    // Extract parameters from the already parsed request data
    const {
      dateRange,
      modules = ['inventory', 'sales', 'finance', 'employees', 'projects'],
      filters = {},
      pagination = { page: 1, pageSize: 50 }
    } = requestData;

    // Validate pagination parameters
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.min(100, Math.max(10, pagination.pageSize || 50)); // Between 10 and 100
    const skip = (page - 1) * pageSize;

    const dateFilters = {
      sales: processDateRange(dateRange),
      finance: processDateRange(dateRange),
      employees: processDateRange(dateRange),
      projects: processDateRange(dateRange),
    };

    const companyId = user.companyId;
    const result: any = {
      timestamp: new Date().toISOString(),
      filters: { ...requestData },
    };

    const promises = [];

    // INVENTORY DATA
    if (modules.includes('inventory')) {
      const inventoryPromise = withRetry(async () => {
        // Get total count for pagination metadata
        const totalCount = await prisma.inventoryItem.count({
          where: {
            companyId,
            ...(filters.inventory || {})
          }
        });

        // Get paginated items
        const items = await prisma.inventoryItem.findMany({
          where: {
            companyId,
            ...(filters.inventory || {})
          },
          skip: modules.length > 1 ? 0 : skip, // Only apply pagination when specifically requesting inventory module
          take: modules.length > 1 ? 100 : pageSize, // Limit results when fetching multiple modules
          orderBy: { updatedAt: 'desc' }
        });

        // Calculate metrics
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStock = items.filter(item => item.quantity < item.reorderPoint).length;

        const categories = new Set(items.map(item => item.category || 'Uncategorized'));

        const categoryDistribution = Array.from(categories).map(catName => {
          const categoryItems = items.filter(item =>
            (item.category || 'Uncategorized') === catName
          );
          return {
            name: catName,
            count: categoryItems.length,
            value: categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            quantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0)
          };
        }).sort((a, b) => b.value - a.value);

        const stockAlerts = items
          .filter(item => item.quantity <= item.reorderPoint)
          .map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint,
            category: item.category || 'Uncategorized'
          }))
          .sort((a, b) => a.quantity - b.quantity);

        // Get sales data for inventory movement
        const sales = await prisma.sale.findMany({
          where: {
            companyId,
            date: dateFilters.sales
          },
          include: {
            items: true
          }
        });

        // Calculate item movement
        const itemMovement = items.map(item => {
          const itemSales = sales.reduce((count, sale) => {
            const saleItems = sale.items.filter(si => si.product === item.name);
            return count + saleItems.reduce((total, si) => total + si.quantity, 0);
          }, 0);

          return {
            id: item.id,
            name: item.name,
            totalTransactions: itemSales,
            turnoverRate: itemSales > 0 ? (item.quantity / itemSales) : 0,
            value: item.price * item.quantity,
            category: item.category || 'Uncategorized'
          };
        }).sort((a, b) => b.totalTransactions - a.totalTransactions);

        result.inventory = {
          items,
          totalCount,
          metrics: {
            totalItems,
            totalQuantity,
            totalValue,
            lowStock,
            categories: categories.size,
            categoryDistribution,
            stockAlerts,
            topMovingItems: itemMovement.slice(0, 10),
            itemMovement: itemMovement.slice(0, 20)
          }
        };
      });

      promises.push(inventoryPromise);
    }

    // SALES DATA
    if (modules.includes('sales')) {
      const salesPromise = withRetry(async () => {
        // Get total count for pagination metadata
        const totalCount = await prisma.sale.count({
          where: {
            companyId,
            ...(dateFilters.sales && { date: dateFilters.sales }),
            ...(filters.sales || {})
          }
        });

        // Get paginated transactions
        const transactions = await prisma.sale.findMany({
          where: {
            companyId,
            ...(dateFilters.sales && { date: dateFilters.sales }),
            ...(filters.sales || {})
          },
          include: {
            customer: true,
            employee: true,
            items: true
          },
          skip: modules.length > 1 ? 0 : skip,
          take: modules.length > 1 ? 100 : pageSize,
          orderBy: { date: 'desc' }
        });

        // Calculate metrics
        const totalSales = transactions.length;
        const totalRevenue = transactions.reduce((sum, sale) => sum + sale.total, 0);

        // Recent sales
        const recentSales = transactions.slice(0, 5);

        // Sales by customer
        const customerSales: Record<string, number> = {};
        transactions.forEach(sale => {
          // Use customer name directly
          const customerName = sale.customer?.name || 'Unknown Customer';
          customerSales[customerName] = (customerSales[customerName] || 0) + sale.total;
        });

        const salesByCustomer = Object.entries(customerSales)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        // Sales over time (by day)
        const salesByDay: Record<string, { date: string, count: number, revenue: number }> = {};
        transactions.forEach(sale => {
          const date = new Date(sale.date).toISOString().split('T')[0];
          if (!salesByDay[date]) {
            salesByDay[date] = { date, count: 0, revenue: 0 };
          }
          salesByDay[date].count += 1;
          salesByDay[date].revenue += sale.total;
        });

        const salesTimeSeries = Object.values(salesByDay).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        result.sales = {
          transactions,
          totalCount,
          metrics: {
            totalSales,
            totalRevenue,
            recentSales,
            salesByCustomer,
            salesTimeSeries
          }
        };
      });

      promises.push(salesPromise);
    }

    // FINANCE DATA
    if (modules.includes('finance')) {
      const financePromise = withRetry(async () => {
        // Get total count for pagination metadata
        const totalCount = await prisma.transaction.count({
          where: {
            companyId,
            ...(dateFilters.finance && { date: dateFilters.finance }),
            ...(filters.finance || {})
          }
        });

        // Get paginated transactions
        const transactions = await prisma.transaction.findMany({
          where: {
            companyId,
            ...(dateFilters.finance && { date: dateFilters.finance }),
            ...(filters.finance || {})
          },
          include: {
            category: true,
            account: true
          },
          skip: modules.length > 1 ? 0 : skip,
          take: modules.length > 1 ? 100 : pageSize,
          orderBy: { date: 'desc' }
        });

        // Calculate metrics
        const totalTransactions = transactions.length;
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const netCashflow = income - expenses;

        // Group by category
        const categorySums: Record<string, { income: number, expense: number }> = {};

        transactions.forEach(t => {
          const categoryName = t.category?.name || 'Uncategorized';
          if (!categorySums[categoryName]) {
            categorySums[categoryName] = { income: 0, expense: 0 };
          }

          if (t.type === 'income') {
            categorySums[categoryName].income += t.amount;
          } else {
            categorySums[categoryName].expense += t.amount;
          }
        });

        // Convert to arrays for charts
        const incomeByCategory = Object.entries(categorySums)
          .map(([category, sums]) => ({
            name: category,
            amount: sums.income
          }))
          .filter(item => item.amount > 0)
          .sort((a, b) => b.amount - a.amount);

        const expensesByCategory = Object.entries(categorySums)
          .map(([category, sums]) => ({
            name: category,
            amount: sums.expense
          }))
          .filter(item => item.amount > 0)
          .sort((a, b) => b.amount - a.amount);

        // Financial time series
        const financeByDay: Record<string, {
          date: string,
          income: number,
          expense: number,
          net: number
        }> = {};

        transactions.forEach(t => {
          const date = new Date(t.date).toISOString().split('T')[0];
          if (!financeByDay[date]) {
            financeByDay[date] = { date, income: 0, expense: 0, net: 0 };
          }

          if (t.type === 'income') {
            financeByDay[date].income += t.amount;
          } else {
            financeByDay[date].expense += t.amount;
          }

          financeByDay[date].net = financeByDay[date].income - financeByDay[date].expense;
        });

        const financeTimeSeries = Object.values(financeByDay).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        result.finance = {
          transactions,
          totalCount,
          metrics: {
            totalTransactions,
            income,
            expenses,
            netCashflow,
            incomeByCategory,
            expensesByCategory,
            financeTimeSeries
          }
        };
      });

      promises.push(financePromise);
    }

    // EMPLOYEES DATA
    if (modules.includes('employees')) {
      const employeesPromise = withRetry(async () => {
        // Get total count for pagination metadata
        const totalCount = await prisma.employee.count({
          where: {
            companyId,
            ...(filters.employees || {})
          }
        });

        // Get paginated employees
        const employees = await prisma.employee.findMany({
          where: {
            companyId,
            ...(filters.employees || {})
          },
          skip: modules.length > 1 ? 0 : skip,
          take: modules.length > 1 ? 100 : pageSize,
          orderBy: { createdAt: 'desc' }
        });

        // Calculate metrics
        const totalEmployees = employees.length;

        // Department distribution
        const departmentCounts: Record<string, number> = {};
        employees.forEach(emp => {
          const dept = emp.department;
          departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });

        const departmentDistribution = Object.entries(departmentCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        result.employees = {
          employees,
          totalCount,
          metrics: {
            totalEmployees,
            departments: Object.keys(departmentCounts).length,
            departmentDistribution
          }
        };
      });

      promises.push(employeesPromise);
    }

    // PROJECTS DATA
    if (modules.includes('projects')) {
      const projectsPromise = withRetry(async () => {
        // Get total count for pagination metadata
        const totalCount = await prisma.project.count({
          where: {
            companyId,
            ...(dateFilters.projects && {
              OR: [
                { startDate: dateFilters.projects },
                { endDate: dateFilters.projects }
              ]
            }),
            ...(filters.projects || {})
          }
        });

        // Get paginated projects
        const projects = await prisma.project.findMany({
          where: {
            companyId,
            ...(dateFilters.projects && {
              OR: [
                { startDate: dateFilters.projects },
                { endDate: dateFilters.projects }
              ]
            }),
            ...(filters.projects || {})
          },
          skip: modules.length > 1 ? 0 : skip,
          take: modules.length > 1 ? 50 : pageSize,
          orderBy: { updatedAt: 'desc' }
        });

        // Calculate metrics
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;

        // Calculate projects by status
        const statusCounts: Record<string, number> = {};

        projects.forEach(project => {
          const status = project.status;
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const projectsByStatus = Object.entries(statusCounts)
          .map(([status, count]) => ({ status, count, value: count }))
          .sort((a, b) => b.count - a.count);

        result.projects = {
          projects,
          totalCount,
          metrics: {
            totalProjects,
            activeProjects,
            completedProjects,
            projectsByStatus
          }
        };
      });

      promises.push(projectsPromise);
    }

    // CROSS-MODULE ANALYSIS
    if (modules.includes('crossModuleAnalysis') && result.sales?.transactions && result.inventory?.items) {
      const productPerformance: ProductPerformance[] = [];
      const salesItemCounts: Record<string, number> = {};
      const salesItemRevenue: Record<string, number> = {};

      (result.sales.transactions as SaleWithRelations[]).forEach((sale: SaleWithRelations) => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach((item: SaleItem) => {
            const productName = item.product;

            if (!salesItemCounts[productName]) {
              salesItemCounts[productName] = 0;
              salesItemRevenue[productName] = 0;
            }

            salesItemCounts[productName] += item.quantity;
            salesItemRevenue[productName] += item.unitPrice * item.quantity;
          });
        }
      });

      if (result.inventory.items && Array.isArray(result.inventory.items)) {
        (result.inventory.items as InventoryItem[]).forEach((item: InventoryItem) => {
          productPerformance.push({
            id: item.id,
            name: item.name,
            category: item.category,
            quantitySold: salesItemCounts[item.name] || 0,
            revenue: salesItemRevenue[item.name] || 0,
            stockLevel: item.quantity,
            price: item.price
          });
        });
      }

      if (result.employees?.employees && result.sales?.transactions) {
        const employeeSalesPerformance: EmployeeSalesPerformance[] = [];

        result.employees.employees.forEach((emp: Employee) => {
          const empSales = (result.sales.transactions as SaleWithRelations[]).filter(
            sale => sale.employee?.id === emp.id
          );

          employeeSalesPerformance.push({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.position,
            department: emp.department,
            salesCount: empSales.length,
            totalRevenue: empSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total, 0),
            averageSale: empSales.length > 0
              ? empSales.reduce((sum: number, sale: SaleWithRelations) => sum + sale.total, 0) / empSales.length
              : 0
          });
        });

        result.crossModuleAnalysis = {
          productPerformance: productPerformance.sort((a, b) => b.revenue - a.revenue),
          employeeSalesPerformance: employeeSalesPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue)
        };
      }
    }

    try {
      await Promise.all(promises);

      // Add pagination metadata to the response
      const paginationMeta = {
        page,
        pageSize,
        hasMore: false // This will be set by individual modules if they have more data
      };

      // Add pagination metadata to each module if it was requested individually
      if (modules.length === 1) {
        const module = modules[0];
        if (result[module]) {
          // Add pagination metadata to the module
          result[module].pagination = {
            ...paginationMeta,
            total: result[module].totalCount || 0,
            hasMore: (page * pageSize) < (result[module].totalCount || 0)
          };
        }
      }

      // Prepare the response data
      const responseData = {
        ...result,
        _meta: {
          pagination: paginationMeta,
          timestamp: new Date().toISOString(),
          filters: filters,
          dateRange,
          cached: false
        }
      };

      // Store in cache for future requests
      analyticsCache.set(cacheKey, responseData);

      return NextResponse.json(responseData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to fetch analytics data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in analytics data API:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
