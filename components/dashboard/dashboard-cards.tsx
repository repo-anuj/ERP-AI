'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Users, Package, ShoppingCart, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface DashboardCardProps {
  data?: {
    revenue?: number;
    users?: number;
    inventory?: number;
    projects?: number;
  };
}

export function DashboardCards({ data }: DashboardCardProps) {
  const hasData = data && Object.keys(data).length > 0 && 
    ((data.revenue ?? 0) > 0 || (data.users ?? 0) > 0 || (data.inventory ?? 0) > 0 || (data.projects ?? 0) > 0);

  if (!hasData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No revenue data yet</p>
              <Link href="/sales">
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No employees added yet</p>
              <Link href="/hr">
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Employee
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No inventory items yet</p>
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-3">
              <PlusCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No sales yet</p>
              <Link href="/sales">
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/dashboard/finance" className="block">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {(data?.revenue ?? 0) > 0 ? (
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  View financial details
                </span>
              ) : (
                "No previous data"
              )}
            </p>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/hr" className="block">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(data?.users ?? 0) > 0 ? (
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  View HR dashboard
                </span>
              ) : (
                "No previous data"
              )}
            </p>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/inventory" className="block">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.inventory || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(data?.inventory ?? 0) > 0 ? (
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  View inventory
                </span>
              ) : (
                "No previous data"
              )}
            </p>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/sales" className="block">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.projects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(data?.projects ?? 0) > 0 ? (
                <span className="text-emerald-500 flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  View sales dashboard
                </span>
              ) : (
                "No previous data"
              )}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
