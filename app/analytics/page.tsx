'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, 
  Users, 
  Timer, 
  MousePointerClick, 
  Clock, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  BarChart, 
  PieChart as PieChartIcon, 
  Search,
  Send,
  Brain,
  RefreshCw,
  FileBarChart,
  Rocket,
  AlertTriangle,
  TrendingDown,
  CreditCard
} from 'lucide-react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  Legend,
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';
import { EmptyAnalytics } from '@/components/analytics/empty-state';
import { AIAssistant } from '@/components/analytics/ai-assistant';
import { RealtimeDashboard } from '@/components/analytics/realtime-dashboard';

// Define types for different data sections
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  category: string;
}

interface SaleData {
  id: string;
  date: string;
  amount: number;
  customer: string;
  status: string;
  items: any[];
}

interface FinanceData {
  id: string;
  date: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  description?: string;
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  team: any[];
}

interface EmployeeData {
  id: string;
  name: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
}

interface InventoryMetrics {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  lowStock: number;
  categories: number;
}

interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
  pendingPayments: number;
  topCustomers: { name: string; amount: number }[];
}

interface FinanceMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  topExpenseCategories: { name: string; amount: number }[];
  topIncomeCategories: { name: string; amount: number }[];
}

interface AggregatedData {
  inventory: {
    items: InventoryItem[];
    metrics: InventoryMetrics;
  };
  sales: {
    transactions: SaleData[];
    metrics: SalesMetrics;
  };
  finance: {
    transactions: FinanceData[];
    metrics: FinanceMetrics;
  };
  projects: ProjectData[];
  employees: EmployeeData[];
  lastUpdated?: string;
}

// AI response interface
interface AIResponse {
  text: string;
  charts?: any[];
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(null);

  useEffect(() => {
    // Fetch data from all sections
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch inventory data - use the direct inventory API endpoint
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryItems = inventoryResponse.ok ? await inventoryResponse.json() : [];
      
      // Fetch inventory categories - we need to fetch this separately
      const categoriesResponse = await fetch('/api/inventory/categories');
      const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
      
      // Fetch inventory suppliers
      const suppliersResponse = await fetch('/api/inventory/suppliers');
      const suppliersData = suppliersResponse.ok ? await suppliersResponse.json() : [];
      
      // Build inventory metrics from actual data
      const inventoryMetrics = {
        totalItems: inventoryItems.length,
        totalQuantity: inventoryItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        totalValue: inventoryItems.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.price || 0)), 0),
        lowStock: inventoryItems.filter((item: any) => (item.quantity || 0) <= (item.reorderLevel || 5)).length,
        categories: categoriesData.length || new Set(inventoryItems.map((item: any) => item.category)).size
      };
      
      // Fetch sales data - use both GET and PATCH endpoints for complete data
      const salesResponse = await fetch('/api/sales');
      const salesData = salesResponse.ok ? await salesResponse.json() : { data: [] };
      const salesTransactions = salesData.data || [];
      
      // Fetch sales metrics using the PATCH endpoint (same as in the sales page)
      const salesMetricsResponse = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 30 }), // Last 30 days metrics
      });
      
      let salesMetricsData = {
        currentPeriod: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0, uniqueCustomers: 0 },
        previousPeriod: { totalSales: 0, totalRevenue: 0, averageOrderValue: 0, uniqueCustomers: 0 },
        growth: { sales: 0, revenue: 0, averageOrderValue: 0, customers: 0 },
        salesByDay: []
      };
      
      if (salesMetricsResponse.ok) {
        salesMetricsData = await salesMetricsResponse.json();
        console.log('Sales metrics loaded:', salesMetricsData);
      }
      
      // Fetch customers for better sales data
      const customersResponse = await fetch('/api/customers');
      const customersData = customersResponse.ok ? await customersResponse.json() : [];
      
      // Calculate sales metrics from actual data, using both transaction data and metrics data from the API
      const topCustomersMap = salesTransactions.reduce((map: Map<string, number>, sale: any) => {
        const customerName = sale.customer?.name || 'Unknown';
        map.set(customerName, (map.get(customerName) || 0) + (sale.totalAmount || 0));
        return map;
      }, new Map<string, number>());
      
      const topCustomersEntries: Array<[string, number]> = Array.from(topCustomersMap);
      const topCustomersArray = topCustomersEntries.map(
        (entry): { name: string; amount: number } => ({ 
          name: entry[0], 
          amount: entry[1] 
        })
      ).sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
      const salesMetrics = {
        totalSales: salesMetricsData.currentPeriod?.totalSales || salesTransactions.length,
        totalRevenue: salesMetricsData.currentPeriod?.totalRevenue || 
          salesTransactions.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0),
        averageSale: salesMetricsData.currentPeriod?.averageOrderValue || 
          (salesTransactions.length > 0 ? 
            salesTransactions.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0) / salesTransactions.length : 0),
        pendingPayments: salesTransactions.filter((sale: any) => sale.status === 'pending' || sale.status === 'unpaid').length,
        topCustomers: topCustomersArray,
        growth: salesMetricsData.growth || { sales: 0, revenue: 0, averageOrderValue: 0, customers: 0 },
        salesByDay: salesMetricsData.salesByDay || []
      };
      
      // Fetch finance transactions - use the direct finance/transactions API endpoint
      const financeResponse = await fetch('/api/finance/transactions');
      const financeTransactions = financeResponse.ok ? await financeResponse.json() : [];
      
      // Calculate financial metrics from actual transactions
      const incomeTransactions = financeTransactions.filter((t: any) => t.type === 'income');
      const expenseTransactions = financeTransactions.filter((t: any) => t.type === 'expense');
      
      const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      
      // Create expense categories map
      const expenseCategoriesMap = expenseTransactions.reduce((map: Map<string, number>, t: any) => {
        const category = t.category?.name || 'Uncategorized';
        map.set(category, (map.get(category) || 0) + (t.amount || 0));
        return map;
      }, new Map<string, number>());
      
      // Create income categories map
      const incomeCategoriesMap = incomeTransactions.reduce((map: Map<string, number>, t: any) => {
        const category = t.category?.name || 'Uncategorized';
        map.set(category, (map.get(category) || 0) + (t.amount || 0));
        return map;
      }, new Map<string, number>());
      
      // Convert to arrays with explicit type casting
      const topExpenseCategoriesEntries: Array<[string, number]> = Array.from(expenseCategoriesMap);
      const topExpenseCategories = topExpenseCategoriesEntries.map(
        (entry): { name: string; amount: number } => ({ 
          name: entry[0], 
          amount: entry[1] 
        })
      ).sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
      const topIncomeCategoriesEntries: Array<[string, number]> = Array.from(incomeCategoriesMap);
      const topIncomeCategories = topIncomeCategoriesEntries.map(
        (entry): { name: string; amount: number } => ({ 
          name: entry[0], 
          amount: entry[1] 
        })
      ).sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
      const financeMetrics = {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        cashFlow: totalIncome - totalExpenses,
        topExpenseCategories,
        topIncomeCategories
      };
      
      // Fetch projects data - use the direct projects API endpoint
      const projectsResponse = await fetch('/api/projects');
      const projectsData = projectsResponse.ok ? await projectsResponse.json() : [];
      
      // Fetch employees data - use the direct employees API endpoint
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];

      // Aggregate all data with enhanced structure
      const allData = {
        inventory: {
          items: inventoryItems,
          metrics: inventoryMetrics
        },
        sales: {
          transactions: salesTransactions,
          metrics: salesMetrics
        },
        finance: {
          transactions: financeTransactions,
          metrics: financeMetrics
        },
        projects: projectsData || [],
        employees: employeesData || [],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Analytics data loaded:', {
        inventoryCount: inventoryItems.length,
        salesCount: salesTransactions.length,
        financeCount: financeTransactions.length,
        projectsCount: projectsData.length,
        employeesCount: employeesData.length
      });
      
      setAggregatedData(allData);
      
      // Check if there's any data
      const hasAnyData = 
        (inventoryItems.length > 0) ||
        (salesTransactions.length > 0) ||
        (financeTransactions.length > 0) ||
        (projectsData.length > 0) ||
        (employeesData.length > 0);
      
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate overview data with enhanced metrics
  const getOverviewData = () => {
    if (!aggregatedData) return null;
    
    return {
      // Core metrics
      totalInventory: aggregatedData.inventory.metrics.totalItems,
      totalInventoryValue: aggregatedData.inventory.metrics.totalValue,
      lowStockItems: aggregatedData.inventory.metrics.lowStock,
      totalSales: aggregatedData.sales.metrics.totalSales,
      totalRevenue: aggregatedData.sales.metrics.totalRevenue,
      averageSale: aggregatedData.sales.metrics.averageSale,
      totalProjects: aggregatedData.projects.length,
      totalEmployees: aggregatedData.employees.length,
      netProfit: aggregatedData.finance.metrics.netProfit,
      cashFlow: aggregatedData.finance.metrics.cashFlow,
      
      // Sales metrics
      salesByMonth: generateMonthlySalesData(),
      topCustomers: aggregatedData.sales.metrics.topCustomers,
      pendingPayments: aggregatedData.sales.metrics.pendingPayments,
      
      // Inventory metrics
      inventoryByCategory: generateInventoryCategoryData(),
      inventoryValue: aggregatedData.inventory.metrics.totalValue,
      inventoryQuantity: aggregatedData.inventory.metrics.totalQuantity,
      
      // Project metrics
      projectsByStatus: generateProjectStatusData(),
      activeProjects: aggregatedData.projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
      completedProjects: aggregatedData.projects.filter(p => p.status === 'completed').length,
      
      // Financial metrics
      financeByType: generateFinanceTypeData(),
      topExpenseCategories: aggregatedData.finance.metrics.topExpenseCategories,
      topIncomeCategories: aggregatedData.finance.metrics.topIncomeCategories,
      incomeVsExpense: [
        { name: 'Income', value: aggregatedData.finance.metrics.totalIncome },
        { name: 'Expenses', value: aggregatedData.finance.metrics.totalExpenses }
      ],
      
      // Last updated timestamp
      lastUpdated: aggregatedData.lastUpdated
    };
  };
  
  // Helper functions to transform data for charts
  const generateMonthlySalesData = () => {
    if (!aggregatedData?.sales.metrics.salesByDay || !aggregatedData?.sales.metrics.salesByDay.length) {
      // Fallback to calculating from transaction data if the API data is not available
      if (!aggregatedData?.sales.transactions.length) return [];
      
      const monthMap: {[key: string]: {revenue: number, profit: number}} = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months
      months.forEach(month => {
        monthMap[month] = {revenue: 0, profit: 0};
      });
      
      // Sum up sales by month
      aggregatedData.sales.transactions.forEach(sale => {
        const date = new Date(sale.date);
        const month = months[date.getMonth()];
        monthMap[month].revenue += sale.amount;
        // Estimate profit as 30% of revenue for visualization purposes
        monthMap[month].profit += sale.amount * 0.3;
      });
      
      // Convert to array format for chart
      return months.map(name => ({
        name,
        revenue: monthMap[name].revenue,
        profit: monthMap[name].profit
      }));
    }
    
    // If we have data from the API, use it for more accurate visualization
    const salesByDay = aggregatedData.sales.metrics.salesByDay;
    const monthMap: {[key: string]: {revenue: number, profit: number}} = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach(month => {
      monthMap[month] = {revenue: 0, profit: 0};
    });
    
    // Process the daily sales data into monthly buckets
    salesByDay.forEach(day => {
      const date = new Date(day.date);
      const month = months[date.getMonth()];
      monthMap[month].revenue += day.revenue || 0;
      // Estimate profit as 30% of revenue for visualization purposes
      monthMap[month].profit += (day.revenue || 0) * 0.3;
    });
    
    // Convert to array format for chart
    return months.map(name => ({
      name,
      revenue: monthMap[name].revenue,
      profit: monthMap[name].profit
    }));
  };
  
  const generateSalesByStatus = () => {
    if (!aggregatedData?.sales.transactions.length) return [];
    
    const statusMap: {[key: string]: number} = {};
    
    // Count sales by status
    aggregatedData.sales.transactions.forEach(sale => {
      const status = sale.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.keys(statusMap).map(name => ({
      name,
      value: statusMap[name]
    }));
  };
  
  const generateTopCustomers = () => {
    if (!aggregatedData?.sales.transactions.length) return [];
    
    const customerMap: {[key: string]: number} = {};
    
    // Sum up purchases by customer
    aggregatedData.sales.transactions.forEach(sale => {
      const customer = sale.customer || 'Unknown';
      customerMap[customer] = (customerMap[customer] || 0) + sale.amount;
    });
    
    // Convert to array and sort by value
    return Object.keys(customerMap)
      .map(name => ({ name, value: customerMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 customers
  };
  
  const generateInventoryCategoryData = () => {
    if (!aggregatedData?.inventory.items.length) return [];
    
    const categoryMap: {[key: string]: number} = {};
    
    // Count items by category
    aggregatedData.inventory.items.forEach(item => {
      const category = item.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.keys(categoryMap).map(category => ({
      name: category,
      value: categoryMap[category]
    }));
  };
  
  const generateInventoryValueByCategory = () => {
    if (!aggregatedData?.inventory.items.length) return [];
    
    const categoryMap: {[key: string]: number} = {};
    
    // Sum up values by category
    aggregatedData.inventory.items.forEach(item => {
      const category = item.category || 'Uncategorized';
      const itemValue = item.price * item.quantity;
      categoryMap[category] = (categoryMap[category] || 0) + itemValue;
    });
    
    // Convert to array format for chart
    return Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));
  };
  
  const generateProjectStatusData = () => {
    if (!aggregatedData?.projects.length) return [];
    
    const statusMap: {[key: string]: number} = {};
    
    // Count projects by status
    aggregatedData.projects.forEach(project => {
      const status = project.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status]
    }));
  };
  
  const generateFinanceTypeData = () => {
    if (!aggregatedData?.finance.transactions.length) return [];
    
    const typeMap: {[key: string]: number} = {
      income: 0,
      expense: 0
    };
    
    // Sum up amounts by type
    aggregatedData.finance.transactions.forEach(item => {
      if (!item) return;
      const type = item.type || 'unknown';
      typeMap[type] = (typeMap[type] || 0) + (typeof item.amount === 'number' ? item.amount : 0);
    });
    
    // Convert to array format for chart
    return Object.keys(typeMap).map(type => ({
      name: type,
      value: typeMap[type]
    }));
  };

  const calculateNetBalance = () => {
    if (!aggregatedData?.finance.transactions.length) return 0;
    
    return aggregatedData.finance.metrics.netProfit || 0;
  };
  
  const generateIncomeExpenseByMonth = () => {
    if (!aggregatedData?.finance.transactions.length) return [];
    
    const monthMap: {[key: string]: {income: number, expense: number}} = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach(month => {
      monthMap[month] = {income: 0, expense: 0};
    });
    
    // Sum up income and expenses by month
    aggregatedData.finance.transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return;
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates
        
        const month = months[date.getMonth()];
        if (transaction.type === 'income') {
          monthMap[month].income += (typeof transaction.amount === 'number' ? transaction.amount : 0);
        } else if (transaction.type === 'expense') {
          monthMap[month].expense += (typeof transaction.amount === 'number' ? transaction.amount : 0);
        }
      } catch (error) {
        console.error('Error processing transaction date:', error);
      }
    });
    
    // Convert to array format for chart
    return Object.keys(monthMap).map(month => ({
      month,
      income: monthMap[month].income,
      expense: monthMap[month].expense
    }));
  };
  
  const generateExpenseByCategory = () => {
    if (!aggregatedData?.finance.metrics.topExpenseCategories) return [];
    
    // Use the precomputed top expense categories
    return aggregatedData.finance.metrics.topExpenseCategories.map(category => ({
      name: category.name,
      value: category.amount
    })) as Array<{name: string, value: number}>;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83a6ed'];

  const overviewData = getOverviewData();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <Skeleton className="h-10 w-[180px]" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((_, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[120px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return <EmptyAnalytics onRefresh={fetchAllData} />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        <Button>
            <FileBarChart className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1">
              <Card className="p-6">
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              </Card>
            </div>
          ) : (
            <RealtimeDashboard 
              data={overviewData} 
              isLoading={isLoading} 
              onRefresh={fetchAllData} 
            />
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total sales recorded in the system
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.totalInventory || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Products currently in inventory
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Projects currently being managed
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total team members
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Monthly Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewData?.salesByMonth.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={overviewData.salesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ReTooltip />
                      <Area type="monotone" dataKey="revenue" fill="#8884d8" stroke="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No sales data available</p>
            </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewData?.inventoryByCategory.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overviewData.inventoryByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {overviewData.inventoryByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No inventory data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-insights">
          <AIAssistant aggregatedData={aggregatedData || {
            inventory: { items: [], metrics: {} },
            sales: { transactions: [], metrics: {} },
            finance: { transactions: [], metrics: {} },
            projects: [],
            employees: []
          }} isLoading={isLoading} />
        </TabsContent>
        
        {/* Sales analytics tab */}
        <TabsContent value="sales">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Analytics</CardTitle>
                <CardDescription>Detailed insights into your sales performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${aggregatedData?.sales.metrics.totalRevenue.toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total revenue from all sales
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                      <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${aggregatedData?.sales.metrics.averageSale.toFixed(2) || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average value per transaction
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aggregatedData?.sales.transactions.filter(sale => sale.status === 'completed').length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Number of completed sales
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aggregatedData?.sales.transactions.filter(sale => sale.status === 'pending').length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Number of pending sales
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Sales Trend by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  {overviewData?.salesByMonth.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={overviewData.salesByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No sales data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Sales by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {aggregatedData?.sales.transactions.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generateSalesByStatus()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateSalesByStatus().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No sales data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {aggregatedData?.sales.transactions.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ReBarChart data={generateTopCustomers()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ReTooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Total Purchases" />
                    </ReBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No customer data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Inventory analytics tab */}
        <TabsContent value="inventory">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Analytics</CardTitle>
                <CardDescription>Detailed insights into your inventory management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aggregatedData?.inventory.items.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total items in inventory
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${aggregatedData?.inventory.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString() || '0'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total inventory value
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Categories</CardTitle>
                      <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(aggregatedData?.inventory.items.map(item => item.category) || []).size}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Number of unique categories
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aggregatedData?.inventory.items.filter(item => item.quantity < 10).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Items with quantity less than 10
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Inventory Value by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {overviewData?.inventoryByCategory.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ReBarChart data={generateInventoryValueByCategory()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Value ($)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No inventory data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Items by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {overviewData?.inventoryByCategory.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={overviewData.inventoryByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {overviewData.inventoryByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No inventory data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Items Requiring Restock</CardTitle>
                <CardDescription>Items with low quantity in stock</CardDescription>
              </CardHeader>
              <CardContent>
                {aggregatedData?.inventory.items.filter(item => item.quantity < 10).length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="py-2 px-3 text-left border-b">Name</th>
                          <th className="py-2 px-3 text-left border-b">Category</th>
                          <th className="py-2 px-3 text-left border-b">Quantity</th>
                          <th className="py-2 px-3 text-left border-b">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.inventory.items
                          .filter(item => item.quantity < 10)
                          .sort((a, b) => a.quantity - b.quantity)
                          .map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-2 px-3">{item.name}</td>
                              <td className="py-2 px-3">{item.category || 'Uncategorized'}</td>
                              <td className="py-2 px-3">{item.quantity}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                  item.quantity === 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : item.quantity < 5 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.quantity === 0 ? 'Out of Stock' : item.quantity < 5 ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p>No low stock items found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Finance analytics tab */}
        <TabsContent value="finance">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>Detailed insights into your financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(aggregatedData?.finance.metrics.totalIncome || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total income transactions
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(aggregatedData?.finance.metrics.totalExpenses || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total expense transactions
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Balance</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(aggregatedData?.finance.metrics.netProfit || 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Net balance (income - expenses)
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {aggregatedData?.finance.transactions.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total number of transactions
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {aggregatedData?.finance.transactions.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ReBarChart data={generateIncomeExpenseByMonth()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Bar dataKey="income" fill="#4ade80" name="Income" />
                        <Bar dataKey="expense" fill="#f87171" name="Expense" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No finance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {aggregatedData?.finance.transactions.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generateExpenseByCategory()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateExpenseByCategory().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No expense data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {aggregatedData?.finance.transactions.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-left p-2">Category</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.finance.transactions
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((transaction) => (
                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                              <td className="p-2">{transaction.description || 'N/A'}</td>
                              <td className="p-2">{transaction.category && typeof transaction.category === 'object' ? transaction.category.name : transaction.category}</td>
                              <td className="p-2">
                                <span className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="p-2">${transaction.amount}</td>
                              <td className="p-2">{transaction.status}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-muted-foreground">No financial transactions available</p>
                  </div>
                )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}