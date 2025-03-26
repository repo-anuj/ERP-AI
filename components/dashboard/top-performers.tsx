'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TopPerformersProps {
  data?: Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    totalSales: number;
    salesCount: number;
  }>;
}

export function TopPerformers({ data }: TopPerformersProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <Award className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No sales data yet</h3>
            <p className="text-sm text-muted-foreground">
              Employee performance will be shown here once sales are recorded
            </p>
          </div>
          <Link href="/sales">
            <Button variant="outline" className="mt-4">
              <TrendingUp className="mr-2 h-4 w-4" />
              Add First Sale
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((employee, index) => {
        const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return (
          <div key={employee.id} className="flex items-center">
            <div className="relative">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </div>
              )}
            </div>
            <div className="ml-4 space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none truncate">{employee.name}</p>
                <Badge variant="outline" className="ml-2 text-xs">
                  {employee.salesCount} sales
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {employee.position} • {employee.department}
              </p>
            </div>
            <div className="ml-auto font-medium text-green-600">
              {formatCurrency(employee.totalSales)}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 text-center border-t">
        <Link href="/analytics">
          <Button variant="ghost" size="sm" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            View performance analytics
          </Button>
        </Link>
      </div>
    </div>
  );
}
