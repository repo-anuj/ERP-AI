'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Area, 
  AreaChart,
  Bar, 
  BarChart, 
  CartesianGrid,
  Legend,
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart2, LineChart as LineChartIcon, TrendingUp, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OverviewProps {
  data?: Array<{
    name: string;
    total: number;
  }>;
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-2 shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{formatCurrency(payload[0].value)}</p>
        {payload[1] && (
          <p className="text-blue-500">{payload[1].dataKey === 'transactions' ? 
            `${payload[1].value} transactions` : 
            formatCurrency(payload[1].value)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function Overview({ data }: OverviewProps) {
  const [loading, setLoading] = useState(!data);
  const [salesData, setSalesData] = useState(data || []);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      
      const response = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: Number(timeRange) }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const salesMetrics = await response.json();
      
      // Extract sales by day data and format it for the chart
      if (salesMetrics.salesByDay && Array.isArray(salesMetrics.salesByDay)) {
        const formattedData = salesMetrics.salesByDay.map((item: any) => ({
          name: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: item.revenue || 0,
          transactions: item.count || 0,
          profit: (item.revenue || 0) * 0.3, // Example calculation, replace with actual profit data if available
        }));
        
        setSalesData(formattedData);
      } else {
        // Fallback to monthly data if available
        if (salesMetrics.monthlySales && Array.isArray(salesMetrics.monthlySales)) {
          setSalesData(salesMetrics.monthlySales);
        }
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching sales data for chart:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (!data) {
      fetchSalesData();
    } else {
      setSalesData(data);
      setLoading(false);
    }
    
    // Set up auto-refresh every 2 minutes
    const refreshInterval = setInterval(() => {
      fetchSalesData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [data, fetchSalesData]);
  
  // Refresh data when time range changes
  useEffect(() => {
    fetchSalesData();
  }, [timeRange, fetchSalesData]);

  const handleRefresh = () => {
    fetchSalesData();
  };

  if (loading && !salesData.length) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!salesData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <LineChartIcon className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No sales data available</h3>
            <p className="text-sm text-muted-foreground">
              Start adding sales to see your revenue trends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              name="Revenue"
              dataKey="total"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
            <Bar 
              name="Transactions"
              dataKey="transactions" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              name="Revenue"
              type="monotone"
              dataKey="total"
              stroke="currentColor"
              strokeWidth={2}
              className="stroke-primary"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              name="Profit"
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              name="Revenue"
              type="monotone"
              dataKey="total"
              stroke="currentColor"
              fillOpacity={0.3}
              fill="currentColor"
              className="stroke-primary fill-primary"
            />
          </AreaChart>
        );
      default:
        return <div>No chart type selected</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant={chartType === 'bar' ? 'default' : 'outline'} 
            onClick={() => setChartType('bar')}
          >
            <BarChart2 className="h-4 w-4 mr-1" />
            Bar
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'line' ? 'default' : 'outline'} 
            onClick={() => setChartType('line')}
          >
            <LineChartIcon className="h-4 w-4 mr-1" />
            Line
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'area' ? 'default' : 'outline'} 
            onClick={() => setChartType('area')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Area
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button 
              size="sm" 
              variant={timeRange === '7' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('7')}
              className="rounded-none"
            >
              7d
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === '30' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('30')}
              className="rounded-none"
            >
              30d
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === '90' ? 'default' : 'outline'} 
              onClick={() => setTimeRange('90')}
              className="rounded-none"
            >
              90d
            </Button>
          </div>
          
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-muted-foreground text-right">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}