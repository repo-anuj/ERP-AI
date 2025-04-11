import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Need this for Prisma

type DateRange = {
  startDate?: string;
  endDate?: string;
};

// Process filters to generate Prisma WHERE conditions
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
    const token = cookies().get('token')?.value;
    
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

    // Parse request body for filters
    const requestData = await req.json();
    const { 
      dateRange, 
      modules = ['inventory', 'sales', 'finance', 'employees', 'projects'],
      filters = {} 
    } = requestData;

    // Create date filter conditions for various tables
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

    // Fetch all requested data in parallel
    const promises = [];

    // INVENTORY DATA
    if (modules.includes('inventory')) {
      const inventoryPromise = prisma.inventoryItem.findMany({
        where: { 
          companyId,
          ...(filters.inventory || {})
        },
        include: {
          transactions: {
            where: {
              date: dateFilters.sales
            }
          }
        }
      }).then(items => {
        // Calculate basic metrics
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStock = items.filter(item => item.quantity < item.reorderPoint).length;
        
        // Get unique categories
        const categories = new Set(items.map(item => item.category || 'Uncategorized'));
        
        // Calculate distribution by category
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

        // Calculate stock alerts
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

        // Calculate top moving items based on transactions
        const itemMovement = items.map(item => {
          const totalTransactions = item.transactions?.length || 0;
          const turnoverRate = totalTransactions > 0 
            ? (item.quantity / totalTransactions) 
            : 0;
          
          return {
            id: item.id,
            name: item.name,
            totalTransactions,
            turnoverRate,
            value: item.price * item.quantity,
            category: item.category || 'Uncategorized'
          };
        }).sort((a, b) => b.totalTransactions - a.totalTransactions);

        // Get top 10 moving items
        const topMovingItems = itemMovement.slice(0, 10);

        result.inventory = {
          items,
          metrics: {
            totalItems,
            totalQuantity,
            totalValue,
            lowStock,
            categories: categories.size,
            categoryDistribution,
            stockAlerts,
            topMovingItems,
            itemMovement: itemMovement.slice(0, 20) // Limit to top 20 for performance
          }
        };
      });
      
      promises.push(inventoryPromise);
    }

    // SALES DATA
    if (modules.includes('sales')) {
      const salesPromise = prisma.sale.findMany({
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
        orderBy: { date: 'desc' }
      }).then(transactions => {
        // Calculate metrics
        const totalSales = transactions.length;
        const totalRevenue = transactions.reduce((sum, sale) => sum + sale.total, 0);
        
        // Recent sales
        const recentSales = transactions.slice(0, 5);
        
        // Sales by customer
        const customerSales: Record<string, number> = {};
        transactions.forEach(sale => {
          const customerId = sale.customer?.id || 'unknown';
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
      const financePromise = prisma.transaction.findMany({
        where: { 
          companyId,
          ...(dateFilters.finance && { date: dateFilters.finance }),
          ...(filters.finance || {})
        },
        orderBy: { date: 'desc' }
      }).then(transactions => {
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
          const category = t.category || 'Uncategorized';
          if (!categorySums[category]) {
            categorySums[category] = { income: 0, expense: 0 };
          }
          
          if (t.type === 'income') {
            categorySums[category].income += t.amount;
          } else {
            categorySums[category].expense += t.amount;
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
      const employeesPromise = prisma.employee.findMany({
        where: { 
          companyId,
          ...(filters.employees || {})
        }
      }).then(employees => {
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
      const projectsPromise = prisma.project.findMany({
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
      }).then(projects => {
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
    if (modules.includes('crossModuleAnalysis')) {
      // We'll add this after all other data is collected
      // The promise will be resolved in the Promise.all below
    }

    // Wait for all data to be fetched
    await Promise.all(promises);

    // Add cross-module metrics if requested
    if (modules.includes('crossModuleAnalysis') && 
        result.sales?.transactions && 
        result.inventory?.items) {
      
      // Calculate product performance (which inventory items are selling best)
      const productPerformance = [];
      const salesItemCounts: Record<string, number> = {};
      const salesItemRevenue: Record<string, number> = {};
      
      // This assumes you have product names in sale items
      result.sales.transactions.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            const productName = item.product || item.description || item.name || 'Unknown';
            
            if (!salesItemCounts[productName]) {
              salesItemCounts[productName] = 0;
              salesItemRevenue[productName] = 0;
            }
            
            salesItemCounts[productName] += item.quantity || 1;
            salesItemRevenue[productName] += (item.unitPrice || item.price || 0) * (item.quantity || 1);
          });
        }
      });
      
      // Map to inventory items
      if (result.inventory.items && Array.isArray(result.inventory.items)) {
        result.inventory.items.forEach(item => {
          productPerformance.push({
            id: item.id,
            name: item.name,
            category: item.category || 'Uncategorized',
            quantitySold: salesItemCounts[item.name] || 0,
            revenue: salesItemRevenue[item.name] || 0,
            stockLevel: item.quantity,
            price: item.price
          });
        });
      }
      
      // Add employee sales performance if we have employee data
      if (result.employees?.employees && result.sales?.transactions) {
        const employeeSalesPerformance = [];
        
        result.employees.employees.forEach(emp => {
          const empSales = result.sales.transactions.filter(
            sale => sale.employee?.id === emp.id
          );
          
          employeeSalesPerformance.push({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.position,
            department: emp.department,
            salesCount: empSales.length,
            totalRevenue: empSales.reduce((sum, sale) => sum + sale.total, 0),
            averageSale: empSales.length > 0 
              ? empSales.reduce((sum, sale) => sum + sale.total, 0) / empSales.length 
              : 0
          });
        });
        
        result.crossModuleAnalysis = {
          productPerformance: productPerformance.sort((a, b) => b.revenue - a.revenue),
          employeeSalesPerformance: employeeSalesPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue)
        };
      }
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in analytics data API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
