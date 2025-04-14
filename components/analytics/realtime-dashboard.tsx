'use client';

import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { websocketService, AnalyticsEventType, ConnectionState } from '@/lib/websocket-service';
import { alertsService } from '@/lib/alerts-service';

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
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (data?.timestamp) {
      setLastUpdated(data.timestamp);
    }
  }, [data]);

  // Initialize WebSocket connection and alerts service
  useEffect(() => {
    // Initialize alerts service
    alertsService.init();

    // In a real application, this would connect to a real WebSocket server
    // For demo purposes, we'll use a mock implementation
    // const mockWebSocketUrl = 'wss://mock-analytics-websocket.example.com';
    // websocketService.init(mockWebSocketUrl);

    // Subscribe to connection state changes
    const handleConnectionStateChange = () => {
      setConnectionState(websocketService.getConnectionState());
    };

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        onRefresh();

        // Randomly trigger alerts (for demo purposes)
        if (Math.random() > 0.8) {
          const alertTypes = ['info', 'warning', 'error', 'success'];
          const modules = ['inventory', 'sales', 'finance'];

          const randomAlert = {
            title: `${modules[Math.floor(Math.random() * modules.length)]} Alert`,
            message: `This is a random ${alertTypes[Math.floor(Math.random() * alertTypes.length)]} alert for demonstration purposes.`,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as 'info' | 'warning' | 'error' | 'success',
            module: modules[Math.floor(Math.random() * modules.length)]
          };

          alertsService.createAlert(
            randomAlert.title,
            randomAlert.message,
            randomAlert.type as any,
            randomAlert.module
          );
        }
      }, 10000); // Refresh every 10 seconds
    }

    return () => {
      // Clean up interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Disconnect WebSocket in a real implementation
      // websocketService.disconnect();
    };
  }, [autoRefresh, onRefresh]);

  const handleRefresh = () => {
    onRefresh();
    setLastUpdated(new Date().toISOString());
    toast.success('Dashboard refreshed');
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
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
        <p className="text-muted-foreground mb-4">There is no data to display for the selected filters.</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    );
  }

  // Extract data from the provided data prop
  const {
    inventory = {},
    sales = {},
    finance = {},
    employees = {},
    projects = {},
    crossModuleAnalysis = {}
  } = data;

  // Prepare data for charts
  const inventoryValue = inventory?.metrics?.totalValue || 0;
  const totalRevenue = sales?.metrics?.totalRevenue || 0;
  const totalExpenses = finance?.metrics?.expenses || 0;
  const netProfit = (finance?.metrics?.income || 0) - totalExpenses;

  // Sales time series data
  const salesTimeData = sales?.metrics?.salesTimeSeries || [];

  // Financial data
  const financeTimeData = finance?.metrics?.financeTimeSeries || [];

  // Top selling products
  const topProducts = crossModuleAnalysis?.productPerformance || [];

  // Department distribution
  const departmentData = employees?.metrics?.departmentDistribution || [];

  // Project status data
  const projectsByStatus = projects?.metrics?.projectsByStatus || [];

  // Top expense categories
  const topExpenseCategories = finance?.metrics?.expensesByCategory || [];

  // Top income categories
  const topIncomeCategories = finance?.metrics?.incomeByCategory || [];

  // Sales by customer
  const salesByCustomer = sales?.metrics?.salesByCustomer || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Real-time Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {formatDate(lastUpdated)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectionState === ConnectionState.CONNECTED ? 'success' : 'outline'}>
            {connectionState === ConnectionState.CONNECTED ? 'Connected' :
             connectionState === ConnectionState.CONNECTING ? 'Connecting...' :
             connectionState === ConnectionState.ERROR ? 'Connection Error' : 'Disconnected'}
          </Badge>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={toggleAutoRefresh}
            size="sm"
          >
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading || autoRefresh} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {sales?.metrics?.totalSales || 0} sales
            </p>
          </CardContent>
        </Card>

        {/* Inventory Value Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventory?.metrics?.totalItems || 0} items
            </p>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {finance?.metrics?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {netProfit >= 0 ?
              <TrendingUp className="h-4 w-4 text-green-500" /> :
              <TrendingDown className="h-4 w-4 text-red-500" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfit >= 0 ? 'Profitable' : 'Loss'} period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Revenue Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Sales revenue by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTimeData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d');
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMMM d, yyyy');
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income vs. Expenses Over Time */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>
              Income vs. Expenses by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={financeTimeData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d');
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMMM d, yyyy');
                      } catch (e) {
                        return value;
                      }
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stackId="1"
                    stroke={INCOME_COLOR}
                    fill={INCOME_COLOR}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stackId="2"
                    stroke={EXPENSE_COLOR}
                    fill={EXPENSE_COLOR}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net"
                    stroke={NEUTRAL_COLOR}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>
              Employee count by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {departmentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Employees']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Based on sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.slice(0, 5)}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[0, 4, 4, 0]} />
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
                    nameKey="status"
                    label={({ status, percent }: { status: string, percent: number }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectsByStatus.map((entry: any, index: number) => (
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
              {(topExpenseCategories.slice(0, 5) || []).map((category: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm">{formatCurrency(category.amount)}</span>
                  </div>
                  <Progress
                    value={topExpenseCategories[0]?.amount ? (category.amount / topExpenseCategories[0].amount * 100) : 0}
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
              {(topIncomeCategories.slice(0, 5) || []).map((category: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm">{formatCurrency(category.amount)}</span>
                  </div>
                  <Progress
                    value={topIncomeCategories[0]?.amount ? (category.amount / topIncomeCategories[0].amount * 100) : 0}
                    className="h-2 bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${topIncomeCategories[0]?.amount ? (category.amount / topIncomeCategories[0].amount * 100) : 0}%` }} />
                  </Progress>
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
