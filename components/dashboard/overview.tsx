'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, TrendingUp } from 'lucide-react';

interface OverviewProps {
  data?: Array<{
    name: string;
    total: number;
  }>;
}

export function Overview({ data }: OverviewProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <LineChart className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No revenue data available</h3>
            <p className="text-sm text-muted-foreground">
              Start adding sales to see your revenue trends
            </p>
          </div>
          <Button variant="outline" className="mt-4">
            <TrendingUp className="mr-2 h-4 w-4" />
            Add Your First Sale
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}