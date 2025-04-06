'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  BarChart4
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Define color schemes for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const INCOME_COLOR = '#10B981';  // Green for income
const EXPENSE_COLOR = '#EF4444';  // Red for expenses
const NEUTRAL_COLOR = '#6366F1';  // Purple for neutral

// Interface for the metrics data
interface RealtimeDashboardProps {
  data: any;
  isLoading: boolean;
  onRefresh: () => void;
}

export function RealtimeDashboard({ data, isLoading, onRefresh }: RealtimeDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  
  useEffect(() => {
    if (data?.lastUpdated) {
      setLastUpdated(data.lastUpdated);
    }
  }, [data]);

  const handleRefresh = () => {
    onRefresh();
    setLastUpdated(new Date().toISOString());
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Format date from ISO string
  const formatDate = (isoString: string): string => {
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Loading skeleton for cards
  const MetricCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-20 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );

  // Loading skeleton for charts
  const ChartSkeleton = () => (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="h-80">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <Button onClick={handleRefresh} disabled size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Loading...
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
    );
  }

  // If no data is available
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <BarChart4 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No analytics data available</h2>
        <p className="text-muted-foreground mb-4">Start adding data to your ERP system to see analytics.</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    );
  }

  // Extract data from props for easier access
  const {
    totalInventory = 0,
    totalInventoryValue = 0,
    lowStockItems = 0,
    totalSales = 0,
    totalRevenue = 0,
    averageSale = 0,
    totalProjects = 0,
    activeProjects = 0,
    totalEmployees = 0,
    netProfit = 0,
    cashFlow = 0,
    salesByMonth = [],
    topCustomers = [],
    inventoryByCategory = [],
    projectsByStatus = [],
    financeByType = [],
    topExpenseCategories = [],
    topIncomeCategories = [],
    incomeVsExpense = []
  } = data;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Realtime Analytics</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {formatDate(lastUpdated)}
          </Badge>
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">
                {netProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cash Flow: {formatCurrency(cashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalInventory} Items</div>
                <p className="text-xs text-muted-foreground">
                  Value: {formatCurrency(totalInventoryValue)}
                  {lowStockItems > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {lowStockItems} Low Stock
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">
                <ShoppingCart className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalSales} Sales</div>
                <p className="text-xs text-muted-foreground">
                  Revenue: {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HR Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalEmployees} Staff</div>
                <p className="text-xs text-muted-foreground">
                  {totalProjects} Projects ({activeProjects} Active)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
            <CardDescription>
              Revenue generated each month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesByMonth}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    activeDot={{ r: 8 }}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    activeDot={{ r: 8 }}
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Expenses Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Finance Breakdown</CardTitle>
            <CardDescription>
              Income vs Expenses Analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeVsExpense}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {incomeVsExpense.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'Income' ? INCOME_COLOR : EXPENSE_COLOR} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Category */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>
              Distribution of inventory items across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventoryByCategory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" name="Quantity" fill="#3B82F6" />
                  <Bar dataKey="value" name="Value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>
              Customers with highest purchase value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCustomers}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="amount" name="Purchase Amount" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>
              Distribution of projects by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Expenses</CardTitle>
            <CardDescription>
              Highest expense categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topExpenseCategories.slice(0, 5).map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm">{formatCurrency(category.amount)}</span>
                  </div>
                  <Progress 
                    value={category.amount / topExpenseCategories[0].amount * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Income Categories */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Income</CardTitle>
            <CardDescription>
              Highest income categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIncomeCategories.slice(0, 5).map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm">{formatCurrency(category.amount)}</span>
                  </div>
                  <Progress 
                    value={category.amount / topIncomeCategories[0].amount * 100} 
                    className="h-2"
                    indicatorColor="bg-green-500" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last updated timestamp */}
      <div className="flex justify-end items-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Data as of {formatDate(lastUpdated)}
      </div>
    </div>
  );
}
