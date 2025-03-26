'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ShoppingCart, TrendingUp, Users, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DataTable } from '@/components/sales/data-table';
import { columns } from '@/components/sales/columns';
import { AddSaleDialog } from '@/components/sales/add-sale-dialog';
import { Overview } from '@/components/sales/overview';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function SalesPage() {
  const [salesData, setSalesData] = useState<any>({
    currentPeriod: {},
    growth: {},
    salesByDay: []
  });
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sales metrics
        const metricsResponse = await fetch('/api/sales', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ days: 30 }),
        });
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setSalesData(metricsData);
        }
        
        // Fetch all sales
        const salesResponse = await fetch('/api/sales');
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          setSales(salesData.data || []);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sales data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const hasSales = sales.length > 0;
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <AddSaleDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : hasSales ? (
              <>
                <div className="text-2xl font-bold">{salesData.currentPeriod?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {salesData.growth?.sales !== null && salesData.growth?.sales !== undefined
                    ? `${salesData.growth?.sales > 0 ? '+' : ''}${salesData.growth?.sales.toFixed(1)}% from last period` 
                    : 'No previous data'}
                </p>
              </>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No sales yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : hasSales ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(salesData.currentPeriod?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {salesData.growth?.revenue !== null && salesData.growth?.revenue !== undefined
                    ? `${salesData.growth?.revenue > 0 ? '+' : ''}${salesData.growth?.revenue.toFixed(1)}% from last period` 
                    : 'No previous data'}
                </p>
              </>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No revenue yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : hasSales ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(salesData.currentPeriod?.averageOrderValue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {salesData.growth?.averageOrderValue !== null && salesData.growth?.averageOrderValue !== undefined
                    ? `${salesData.growth?.averageOrderValue > 0 ? '+' : ''}${salesData.growth?.averageOrderValue.toFixed(1)}% from last period` 
                    : 'No previous data'}
                </p>
              </>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No order data yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : hasSales ? (
              <>
                <div className="text-2xl font-bold">{salesData.currentPeriod?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {salesData.growth?.customers !== null && salesData.growth?.customers !== undefined
                    ? `${salesData.growth?.customers > 0 ? '+' : ''}${salesData.growth?.customers.toFixed(1)}% from last period` 
                    : 'No previous data'}
                </p>
              </>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No customers yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading sales data...</p>
              </div>
            ) : hasSales && salesData.salesByDay?.length > 0 ? (
              <Overview 
                data={salesData.salesByDay?.map((item: any) => ({
                  name: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  total: item.revenue || 0,
                }))} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 h-64">
                <div className="text-center space-y-3">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">No Sales Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Start adding sales to see your sales trends.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Sales Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading growth data...</p>
              </div>
            ) : hasSales ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                    <span className="text-sm font-medium">Sales</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {salesData.growth?.sales !== null && salesData.growth?.sales !== undefined
                        ? `${salesData.growth?.sales > 0 ? '+' : ''}${salesData.growth?.sales.toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                    {salesData.growth?.sales !== undefined && salesData.growth?.sales > 0 && 
                      <TrendingUp className="ml-1 h-4 w-4 text-green-500" />}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm font-medium">Revenue</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {salesData.growth?.revenue !== null && salesData.growth?.revenue !== undefined
                        ? `${salesData.growth?.revenue > 0 ? '+' : ''}${salesData.growth?.revenue.toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                    {salesData.growth?.revenue !== undefined && salesData.growth?.revenue > 0 && 
                      <TrendingUp className="ml-1 h-4 w-4 text-green-500" />}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm font-medium">Customers</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {salesData.growth?.customers !== null && salesData.growth?.customers !== undefined
                        ? `${salesData.growth?.customers > 0 ? '+' : ''}${salesData.growth?.customers.toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                    {salesData.growth?.customers !== undefined && salesData.growth?.customers > 0 && 
                      <TrendingUp className="ml-1 h-4 w-4 text-green-500" />}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">Avg. Order Value</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {salesData.growth?.averageOrderValue !== null && salesData.growth?.averageOrderValue !== undefined
                        ? `${salesData.growth?.averageOrderValue > 0 ? '+' : ''}${salesData.growth?.averageOrderValue.toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                    {salesData.growth?.averageOrderValue !== undefined && salesData.growth?.averageOrderValue > 0 && 
                      <TrendingUp className="ml-1 h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 h-64">
                <div className="text-center space-y-3">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">No Growth Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Add sales to see growth metrics over time.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading sales data...</p>
            </div>
          ) : hasSales ? (
            <DataTable columns={columns} data={sales} />
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-center space-y-3">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No Sales Data Available</h3>
                <p className="text-sm text-muted-foreground">
                  Start adding sales to see your business metrics and analytics.
                </p>
                <AddSaleDialog />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
