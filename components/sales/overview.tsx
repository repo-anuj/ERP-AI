'use client';

import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewProps {
  data?: Array<{
    name: string;
    total: number;
  }>;
}

export function Overview({ data }: OverviewProps) {
  const [loading, setLoading] = useState(!data);
  const [salesData, setSalesData] = useState(data || []);

  useEffect(() => {
    if (!data) {
      fetchSalesData();
    } else {
      setSalesData(data);
      setLoading(false);
    }
  }, [data]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 30 }),
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
        }));
        
        setSalesData(formattedData);
      } else {
        // Fallback to monthly data if available
        if (salesMetrics.monthlySales && Array.isArray(salesMetrics.monthlySales)) {
          setSalesData(salesMetrics.monthlySales);
        }
      }
    } catch (error) {
      console.error('Error fetching sales data for chart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!salesData.length) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={salesData}>
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
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="total"
          stroke="currentColor"
          className="stroke-primary"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
