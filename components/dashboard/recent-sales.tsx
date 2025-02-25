'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, PlusCircle } from 'lucide-react';

interface RecentSalesProps {
  data?: Array<{
    id: string;
    name: string;
    email: string;
    amount: number;
    image?: string;
  }>;
}

export function RecentSales({ data }: RecentSalesProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <DollarSign className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No sales yet</h3>
            <p className="text-sm text-muted-foreground">
              Start recording your first sale to track your business growth
            </p>
          </div>
          <Button variant="outline" className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Record First Sale
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {data.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={sale.image} />
            <AvatarFallback>{sale.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">+${sale.amount.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}