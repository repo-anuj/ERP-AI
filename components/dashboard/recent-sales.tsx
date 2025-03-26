'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, PlusCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RecentSalesProps {
  data?: Array<{
    id: string;
    name: string;
    email: string;
    amount: number;
    date: string | Date;
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
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No sales yet</h3>
            <p className="text-sm text-muted-foreground">
              Start recording your first sale to track your business growth
            </p>
          </div>
          <Link href="/sales">
            <Button variant="outline" className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Record First Sale
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((sale) => {
        const saleDate = new Date(sale.date);
        const formattedDate = formatDate(saleDate);
        const initials = sale.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return (
          <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={sale.image} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none truncate">{sale.name}</p>
                <Badge variant="outline" className="ml-2 text-xs">
                  {formattedDate}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {sale.email || "No email provided"}
              </p>
            </div>
            <div className="ml-auto font-medium text-green-600">
              {formatCurrency(sale.amount)}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 text-center border-t">
        <Link href="/sales">
          <Button variant="ghost" size="sm" className="gap-1">
            <DollarSign className="h-4 w-4" />
            View all sales
          </Button>
        </Link>
      </div>
    </div>
  );
}
