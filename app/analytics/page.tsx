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

interface AggregatedData {
  inventory: InventoryItem[];
  sales: SaleData[];
  finance: FinanceData[];
  projects: ProjectData[];
  employees: EmployeeData[];
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
      // Fetch inventory data
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryData = inventoryResponse.ok ? await inventoryResponse.json() : { items: [] };
      
      // Fetch sales data
      const salesResponse = await fetch('/api/sales');
      const salesData = salesResponse.ok ? await salesResponse.json() : { data: [] };
      
      // Fetch finance data
      const financeResponse = await fetch('/api/finance/transactions');
      const financeData = financeResponse.ok ? await financeResponse.json() : [];
      
      // Fetch projects data
      const projectsResponse = await fetch('/api/projects');
      const projectsData = projectsResponse.ok ? await projectsResponse.json() : [];
      
      // Fetch employees data
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];

      // Aggregate all data
      const allData = {
        inventory: inventoryData.items || [],
        sales: salesData.data || [],
        finance: financeData || [],
        projects: projectsData || [],
        employees: employeesData || []
      };
      
      setAggregatedData(allData);
      
      // Check if there's any data
      const hasAnyData = 
        (allData.inventory && allData.inventory.length > 0) ||
        (allData.sales && allData.sales.length > 0) ||
        (allData.finance && allData.finance.length > 0) ||
        (allData.projects && allData.projects.length > 0) ||
        (allData.employees && allData.employees.length > 0);
      
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate overview data
  const getOverviewData = () => {
    if (!aggregatedData) return null;
    
    return {
      totalInventory: aggregatedData.inventory.length,
      totalSales: aggregatedData.sales.length,
      totalProjects: aggregatedData.projects.length,
      totalEmployees: aggregatedData.employees.length,
      
      // Sales summary
      salesByMonth: generateMonthlySalesData(),
      
      // Inventory by category
      inventoryByCategory: generateInventoryCategoryData(),
      
      // Project status
      projectsByStatus: generateProjectStatusData(),
      
      // Financial summary
      financeByType: generateFinanceTypeData()
    };
  };
  
  // Helper functions to transform data for charts
  const generateMonthlySalesData = () => {
    if (!aggregatedData?.sales.length) return [];
    
    const monthMap: {[key: string]: number} = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach(month => {
      monthMap[month] = 0;
    });
    
    // Sum up sales by month
    aggregatedData.sales.forEach(sale => {
      const date = new Date(sale.date);
      const month = months[date.getMonth()];
      monthMap[month] += sale.amount;
    });
    
    // Convert to array format for chart
    return Object.keys(monthMap).map(month => ({
      month,
      value: monthMap[month]
    }));
  };
  
  const generateSalesByStatus = () => {
    if (!aggregatedData?.sales.length) return [];
    
    const statusMap: {[key: string]: number} = {};
    
    // Count sales by status
    aggregatedData.sales.forEach(sale => {
      const status = sale.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status]
    }));
  };
  
  const generateTopCustomers = () => {
    if (!aggregatedData?.sales.length) return [];
    
    const customerMap: {[key: string]: number} = {};
    
    // Sum up purchases by customer
    aggregatedData.sales.forEach(sale => {
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
    if (!aggregatedData?.inventory.length) return [];
    
    const categoryMap: {[key: string]: number} = {};
    
    // Count items by category
    aggregatedData.inventory.forEach(item => {
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
    if (!aggregatedData?.inventory.length) return [];
    
    const categoryMap: {[key: string]: number} = {};
    
    // Sum up values by category
    aggregatedData.inventory.forEach(item => {
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
    if (!aggregatedData?.finance.length) return [];
    
    const typeMap: {[key: string]: number} = {
      income: 0,
      expense: 0
    };
    
    // Sum up amounts by type
    aggregatedData.finance.forEach(item => {
      const type = item.type || 'unknown';
      typeMap[type] = (typeMap[type] || 0) + item.amount;
    });
    
    // Convert to array format for chart
    return Object.keys(typeMap).map(type => ({
      name: type,
      value: typeMap[type]
    }));
  };

  const calculateNetBalance = () => {
    if (!aggregatedData?.finance.length) return 0;
    
    const income = aggregatedData.finance
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
      
    const expenses = aggregatedData.finance
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
      
    return income - expenses;
  };
  
  const generateIncomeExpenseByMonth = () => {
    if (!aggregatedData?.finance.length) return [];
    
    const monthMap: {[key: string]: {income: number, expense: number}} = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months
    months.forEach(month => {
      monthMap[month] = {income: 0, expense: 0};
    });
    
    // Sum up income and expenses by month
    aggregatedData.finance.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = months[date.getMonth()];
      if (transaction.type === 'income') {
        monthMap[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthMap[month].expense += transaction.amount;
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
    if (!aggregatedData?.finance.length) return [];
    
    const categoryMap: {[key: string]: number} = {};
    
    // Sum up expenses by category
    aggregatedData.finance
      .filter(item => item.type === 'expense')
      .forEach(expense => {
        const category = expense.category || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
      });
    
    // Convert to array format for chart
    return Object.keys(categoryMap)
      .map(name => ({
        name,
        value: categoryMap[name]
      }))
      .sort((a, b) => b.value - a.value);
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
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ReTooltip />
                      <Area type="monotone" dataKey="value" fill="#8884d8" stroke="#8884d8" />
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
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
            inventory: [],
            sales: [],
            finance: [],
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
                        ${aggregatedData?.sales.reduce((sum, sale) => sum + sale.amount, 0).toLocaleString() || '0'}
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
                        ${aggregatedData?.sales.length 
                          ? (aggregatedData.sales.reduce((sum, sale) => sum + sale.amount, 0) / aggregatedData.sales.length).toFixed(2)
                          : '0'}
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
                        {aggregatedData?.sales.filter(sale => sale.status === 'completed').length || 0}
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
                        {aggregatedData?.sales.filter(sale => sale.status === 'pending').length || 0}
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
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ReTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" name="Revenue" />
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
                  {aggregatedData?.sales.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generateSalesByStatus()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                {aggregatedData?.sales.length ? (
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
                        {aggregatedData?.inventory.length || 0}
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
                        ${aggregatedData?.inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString() || '0'}
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
                        {new Set(aggregatedData?.inventory.map(item => item.category) || []).size}
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
                        {aggregatedData?.inventory.filter(item => item.quantity < 10).length || 0}
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
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                {aggregatedData?.inventory.filter(item => item.quantity < 10).length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Category</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Price</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.inventory
                          .filter(item => item.quantity < 10)
                          .sort((a, b) => a.quantity - b.quantity)
                          .map((item) => (
                            <tr key={item.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.category}</td>
                              <td className="p-2">{item.quantity}</td>
                              <td className="p-2">${item.price}</td>
                              <td className="p-2">{item.status}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-muted-foreground">No items require restocking</p>
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
                        ${aggregatedData?.finance
                          .filter(item => item.type === 'income')
                          .reduce((sum, item) => sum + item.amount, 0)
                          .toLocaleString() || '0'}
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
                        ${aggregatedData?.finance
                          .filter(item => item.type === 'expense')
                          .reduce((sum, item) => sum + item.amount, 0)
                          .toLocaleString() || '0'}
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
                        ${calculateNetBalance().toLocaleString()}
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
                        {aggregatedData?.finance.length || 0}
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
                  {aggregatedData?.finance.length ? (
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
                  {aggregatedData?.finance.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generateExpenseByCategory()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                {aggregatedData?.finance.length ? (
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
                        {aggregatedData.finance
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((transaction) => (
                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{new Date(transaction.date).toLocaleDateString()}</td>
                              <td className="p-2">{transaction.description || 'N/A'}</td>
                              <td className="p-2">{transaction.category}</td>
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