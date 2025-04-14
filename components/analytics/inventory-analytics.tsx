'use client';

import { useState } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart4,
  PieChart as PieChartIcon,
  ArrowUpDown
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AnalyticsCard,
  BarChartCard,
  PieChartCard,
  LineChartCard,
  TreemapChartCard,
  CHART_COLORS,
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
import { formatCurrency } from '@/lib/utils';
import { PaginationControls } from './pagination-controls';

interface InventoryAnalyticsProps {
  data: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function InventoryAnalytics({
  data,
  isLoading,
  onPageChange,
  onPageSizeChange
}: InventoryAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Extract metrics from data
  const metrics = data?.metrics || {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStock: 0,
    categories: 0,
    categoryDistribution: [],
    stockAlerts: [],
    topMovingItems: [],
    itemMovement: []
  };

  // Format data for charts
  const categoryData = metrics.categoryDistribution || [];
  const stockAlerts = metrics.stockAlerts || [];
  const topMovingItems = metrics.topMovingItems || [];
  const itemMovement = metrics.itemMovement || [];

  // Calculate turnover rate
  const avgTurnoverRate = Array.isArray(itemMovement) && itemMovement.length > 0
    ? itemMovement.reduce((sum: number, item: any) => sum + (item.turnoverRate || 0), 0) / itemMovement.length
    : 0;

  // Calculate stock health
  const stockHealth = metrics.totalItems > 0
    ? ((metrics.totalItems - (metrics.lowStock || 0)) / metrics.totalItems) * 100
    : 100;

  // Prepare data for treemap
  const treemapData = Array.isArray(categoryData) ? categoryData.map((category: any) => ({
    name: category.name || 'Unknown',
    value: category.value || 0,
    quantity: category.quantity || 0
  })) : [];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="movement">Inventory Movement</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Total Inventory Value"
              value={formatCurrency(metrics.totalValue)}
              description={`${metrics.totalItems} unique items`}
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Total Quantity"
              value={metrics.totalQuantity.toLocaleString()}
              description={`Across ${metrics.categories} categories`}
              icon={<BarChart4 className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Stock Health"
              value={`${stockHealth.toFixed(1)}%`}
              description={`${metrics.lowStock} items low on stock`}
              icon={
                stockHealth > 80
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : stockHealth > 50
                  ? <TrendingDown className="h-4 w-4 text-yellow-500" />
                  : <AlertTriangle className="h-4 w-4 text-red-500" />
              }
              trend={
                stockHealth > 80
                  ? 'up'
                  : stockHealth > 50
                  ? 'neutral'
                  : 'down'
              }
              trendValue={`${metrics.lowStock} alerts`}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Avg. Turnover Rate"
              value={avgTurnoverRate.toFixed(2)}
              description="Lower is better"
              icon={<ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PieChartCard
              title="Inventory Value by Category"
              description="Distribution of inventory value across categories"
              data={categoryData}
              nameKey="name"
              dataKey="value"
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Top Moving Items"
              description="Items with highest transaction volume"
              data={topMovingItems.slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'totalTransactions', name: 'Transactions', color: CHART_COLORS[0] },
                { dataKey: 'value', name: 'Value', color: CHART_COLORS[1] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Breakdown of inventory by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TreemapChartCard
                  title=""
                  data={treemapData}
                  dataKey="value"
                  nameKey="name"
                  isLoading={isLoading}
                  height={400}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of inventory categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Avg. Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((category: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.count}</TableCell>
                        <TableCell>{category.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.value)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(category.quantity > 0 ? category.value / category.quantity : 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Movement Tab */}
        <TabsContent value="movement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartCard
              title="Top Moving Items"
              description="Items with highest transaction volume"
              data={topMovingItems}
              xAxisKey="name"
              bars={[
                { dataKey: 'totalTransactions', name: 'Transactions', color: CHART_COLORS[0] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />

            <BarChartCard
              title="Inventory Value by Movement"
              description="Value of inventory by transaction volume"
              data={topMovingItems}
              xAxisKey="name"
              bars={[
                { dataKey: 'value', name: 'Value', color: CHART_COLORS[1] }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement Details</CardTitle>
              <CardDescription>
                Detailed breakdown of inventory movement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Turnover Rate</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemMovement.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.totalTransactions}</TableCell>
                      <TableCell className="text-right">
                        {item.turnoverRate.toFixed(2)}
                        <Badge
                          variant={item.turnoverRate < 1 ? 'default' : item.turnoverRate < 3 ? 'secondary' : 'outline'}
                          className="ml-2"
                        >
                          {item.turnoverRate < 1 ? 'Fast' : item.turnoverRate < 3 ? 'Medium' : 'Slow'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>
                Items that need to be restocked soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Quantity</TableHead>
                    <TableHead className="text-right">Reorder Point</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockAlerts.map((item: any, index: number) => {
                    const stockLevel = item.quantity / item.reorderPoint;
                    let status = 'Normal';
                    let variant: 'default' | 'destructive' | 'outline' = 'outline';

                    if (stockLevel <= 0.25) {
                      status = 'Critical';
                      variant = 'destructive';
                    } else if (stockLevel <= 0.75) {
                      status = 'Low';
                      variant = 'default';
                    }

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.reorderPoint}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={variant}>
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
