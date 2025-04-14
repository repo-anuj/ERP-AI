'use client';

import { useState } from 'react';
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Calendar,
  BarChart4
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AnalyticsCard,
  BarChartCard,
  PieChartCard,
  LineChartCard,
  AreaChartCard,
  CHART_COLORS,
  INCOME_COLOR,
  currencyFormatter,
  numberFormatter
} from './chart-components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaginationControls } from './pagination-controls';

interface SalesAnalyticsProps {
  data: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function SalesAnalytics({
  data,
  isLoading,
  onPageChange,
  onPageSizeChange
}: SalesAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Extract metrics from data
  const metrics = data?.metrics || {
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [],
    salesByCustomer: [],
    salesTimeSeries: []
  };

  // Format data for charts
  const salesByCustomer = metrics.salesByCustomer || [];
  const salesTimeSeries = metrics.salesTimeSeries || [];
  const recentSales = metrics.recentSales || [];
  const transactions = data?.transactions || [];

  // Calculate average sale value
  const avgSaleValue = metrics.totalSales > 0
    ? metrics.totalRevenue / metrics.totalSales
    : 0;

  // Calculate sales growth (mock data for now)
  const salesGrowth = metrics.totalSales > 0 ? 12.5 : 0; // This would come from the API in a real implementation

  // Calculate top selling products
  const topProducts = Array.isArray(transactions) ? transactions.reduce((acc: any[], sale: any) => {
    if (!sale.items || !Array.isArray(sale.items)) return acc;

    sale.items.forEach((item: any) => {
      if (!item) return;

      const id = item.id || 'unknown';
      const name = item.name || 'Unknown Product';
      const quantity = item.quantity || 0;
      const price = item.price || 0;

      const existingProduct = acc.find(p => p.id === id);
      if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.revenue += price * quantity;
      } else {
        acc.push({
          id,
          name,
          quantity,
          revenue: price * quantity
        });
      }
    });

    return acc;
  }, []).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10) : [];

  // Format time series data
  const formattedTimeSeries = Array.isArray(salesTimeSeries) ? salesTimeSeries.map((entry: any) => ({
    date: entry.date || new Date().toISOString().split('T')[0],
    sales: entry.sales || 0,
    revenue: entry.revenue || 0
  })) : [];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Total Revenue"
              value={formatCurrency(metrics.totalRevenue)}
              description={`From ${metrics.totalSales} sales`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Average Sale"
              value={formatCurrency(avgSaleValue)}
              description="Per transaction"
              icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Sales Growth"
              value={`${salesGrowth}%`}
              description="Compared to last period"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              trend={salesGrowth > 0 ? 'up' : salesGrowth < 0 ? 'down' : 'neutral'}
              trendValue={`${Math.abs(salesGrowth)}%`}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Unique Customers"
              value={salesByCustomer.length}
              description="With purchases"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LineChartCard
              title="Sales Over Time"
              description="Revenue trend over the selected period"
              data={formattedTimeSeries}
              xAxisKey="date"
              lines={[
                { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Sales Count Over Time"
              description="Number of sales over the selected period"
              data={formattedTimeSeries}
              xAxisKey="date"
              bars={[
                { dataKey: 'sales', name: 'Sales', color: CHART_COLORS[0] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                Latest transactions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell className="font-medium">{typeof sale.customer === 'object' ? sale.customer.name || 'Unknown' : sale.customer}</TableCell>
                      <TableCell>{Array.isArray(sale.items) ? sale.items.length : sale.items}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === 'completed' ? 'default' :
                            sale.status === 'pending' ? 'secondary' :
                            'outline'
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PieChartCard
              title="Revenue by Customer"
              description="Top customers by revenue"
              data={salesByCustomer.slice(0, 10)}
              nameKey="name"
              dataKey="revenue"
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Sales by Customer"
              description="Number of sales by customer"
              data={salesByCustomer.slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'sales', name: 'Sales', color: CHART_COLORS[0] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                Detailed breakdown of sales by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg. Sale</TableHead>
                    <TableHead className="text-right">Last Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByCustomer.map((customer: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right">{customer.sales}</TableCell>
                      <TableCell className="text-right">{formatCurrency(customer.revenue)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(customer.sales > 0 ? customer.revenue / customer.sales : 0)}
                      </TableCell>
                      <TableCell className="text-right">{formatDate(customer.lastPurchase)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartCard
              title="Top Products by Revenue"
              description="Highest revenue generating products"
              data={topProducts}
              xAxisKey="name"
              bars={[
                { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Top Products by Quantity"
              description="Most sold products by quantity"
              data={topProducts}
              xAxisKey="name"
              bars={[
                { dataKey: 'quantity', name: 'Quantity', color: CHART_COLORS[1] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Sales Details</CardTitle>
              <CardDescription>
                Detailed breakdown of product sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.quantity > 0 ? product.revenue / product.quantity : 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <AreaChartCard
              title="Sales Trends"
              description="Revenue and sales count over time"
              data={formattedTimeSeries}
              xAxisKey="date"
              areas={[
                { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR, fillOpacity: 0.6 }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
              height={300}
            />

            <Card>
              <CardHeader>
                <CardTitle>Sales Seasonality</CardTitle>
                <CardDescription>
                  Analysis of sales patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Daily Trends</h3>
                    <BarChartCard
                      title=""
                      data={[
                        { day: 'Mon', sales: 120, revenue: 12000 },
                        { day: 'Tue', sales: 132, revenue: 13200 },
                        { day: 'Wed', sales: 145, revenue: 14500 },
                        { day: 'Thu', sales: 160, revenue: 16000 },
                        { day: 'Fri', sales: 180, revenue: 18000 },
                        { day: 'Sat', sales: 220, revenue: 22000 },
                        { day: 'Sun', sales: 190, revenue: 19000 }
                      ]}
                      xAxisKey="day"
                      bars={[
                        { dataKey: 'sales', name: 'Sales', color: CHART_COLORS[0] }
                      ]}
                      isLoading={isLoading}
                      valueFormatter={numberFormatter}
                      height={200}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Monthly Trends</h3>
                    <BarChartCard
                      title=""
                      data={[
                        { month: 'Jan', sales: 1200, revenue: 120000 },
                        { month: 'Feb', sales: 1100, revenue: 110000 },
                        { month: 'Mar', sales: 1300, revenue: 130000 },
                        { month: 'Apr', sales: 1400, revenue: 140000 },
                        { month: 'May', sales: 1500, revenue: 150000 },
                        { month: 'Jun', sales: 1600, revenue: 160000 }
                      ]}
                      xAxisKey="month"
                      bars={[
                        { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR }
                      ]}
                      isLoading={isLoading}
                      valueFormatter={currencyFormatter}
                      height={200}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination controls */}
      {data?.totalCount > 0 && (
        <PaginationControls
          currentPage={data._meta?.pagination?.page || 1}
          pageSize={data._meta?.pagination?.pageSize || 50}
          totalItems={data.totalCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
