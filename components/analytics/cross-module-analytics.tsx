'use client';

import { useState } from 'react';
import {
  TrendingUp,
  BarChart4,
  ArrowUpDown,
  Link,
  Layers,
  Activity
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
  ScatterChartCard,
  LineChartCard,
  RadarChartCard,
  CHART_COLORS,
  INCOME_COLOR,
  EXPENSE_COLOR,
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
import { formatCurrency } from '@/lib/utils';

interface CrossModuleAnalyticsProps {
  data: any;
  isLoading: boolean;
}

export function CrossModuleAnalytics({
  data,
  isLoading
}: CrossModuleAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Extract data from all modules
  const inventory = data?.inventory || { metrics: {} };
  const sales = data?.sales || { metrics: {} };
  const finance = data?.finance || { metrics: {} };
  const employees = data?.employees || { metrics: {} };
  const projects = data?.projects || { metrics: {} };

  // Create cross-module metrics

  // 1. Inventory-Sales correlation
  const inventorySalesCorrelation = Array.isArray(sales.transactions) ? sales.transactions.flatMap((sale: any) => {
    if (!sale || !Array.isArray(sale.items)) return [];

    return sale.items.map((item: any) => {
      if (!item) return null;
      return {
        name: item.name || 'Unknown',
        quantity: item.quantity || 0,
        revenue: (item.price || 0) * (item.quantity || 0),
        date: sale.date || new Date().toISOString()
      };
    }).filter(Boolean);
  }) : [];

  // 2. Sales-Finance impact
  const salesFinanceImpact = Array.isArray(finance.metrics?.financeTimeSeries) ?
    finance.metrics.financeTimeSeries.map((entry: any, index: number) => {
      if (!entry) return null;

      const salesTimeSeries = Array.isArray(sales.metrics?.salesTimeSeries) ?
        sales.metrics.salesTimeSeries : [];

      const salesEntry = salesTimeSeries[index] || {
        date: entry.date || new Date().toISOString(),
        revenue: 0,
        sales: 0
      };

      return {
        date: entry.date || new Date().toISOString(),
        income: entry.income || 0,
        expenses: entry.expenses || 0,
        salesRevenue: salesEntry.revenue || 0,
        salesCount: salesEntry.sales || 0,
        profit: (entry.income || 0) - (entry.expenses || 0)
      };
    }).filter(Boolean) : [];

  // 3. Project profitability
  const projectProfitability = Array.isArray(projects.projects) ?
    projects.projects.map((project: any) => {
      if (!project) return null;

      // Calculate project costs and revenue (mock data for now)
      const revenue = Math.random() * 50000 + 10000;
      const costs = Math.random() * 40000 + 5000;
      const profit = revenue - costs;
      const margin = (profit / revenue) * 100;

      return {
        name: project.name || 'Unnamed Project',
        status: project.status || 'Unknown',
        revenue,
        costs,
        profit,
        margin
      };
    }).filter(Boolean) : [];

  // 4. Employee productivity
  const employeeProductivity = Array.isArray(employees.employees) ?
    employees.employees.map((employee: any) => {
      if (!employee) return null;

      // Calculate productivity metrics (mock data for now)
      const salesCount = Math.floor(Math.random() * 50) + 5;
      const salesValue = Math.random() * 100000 + 10000;
      const projectsCount = Math.floor(Math.random() * 5) + 1;

      return {
        name: employee.name || 'Unknown Employee',
        department: employee.department || 'General',
        salesCount,
        salesValue,
        projectsCount,
        productivity: salesValue / (employee.salary || 50000)
      };
    }).filter(Boolean) : [];

  // 5. Business health radar
  const businessHealthData = [
    {
      name: 'Financial',
      value: finance.metrics?.netCashflow > 0 ? 80 : 40,
      fullMark: 100,
    },
    {
      name: 'Sales',
      value: sales.metrics?.totalSales > 100 ? 75 : 50,
      fullMark: 100,
    },
    {
      name: 'Inventory',
      value: inventory.metrics?.lowStock < 10 ? 90 : 60,
      fullMark: 100,
    },
    {
      name: 'Projects',
      value: projects.metrics?.activeProjects > 5 ? 85 : 55,
      fullMark: 100,
    },
    {
      name: 'HR',
      value: employees.metrics?.totalEmployees > 20 ? 70 : 45,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Business Overview</TabsTrigger>
          <TabsTrigger value="sales-inventory">Sales & Inventory</TabsTrigger>
          <TabsTrigger value="finance-projects">Finance & Projects</TabsTrigger>
          <TabsTrigger value="employee-performance">Employee Performance</TabsTrigger>
        </TabsList>

        {/* Business Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Business Health Score"
              value="78/100"
              description="Overall business performance"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              trend="up"
              trendValue="+5 pts"
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Total Revenue"
              value={formatCurrency(sales.metrics?.totalRevenue || 0)}
              description={`From ${sales.metrics?.totalSales || 0} sales`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Net Profit"
              value={formatCurrency(finance.metrics?.netCashflow || 0)}
              description="Income minus expenses"
              icon={<BarChart4 className="h-4 w-4 text-muted-foreground" />}
              trend={finance.metrics?.netCashflow > 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(((finance.metrics?.netCashflow || 0) / (finance.metrics?.income || 1)) * 100).toFixed(1)}%`}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Active Projects"
              value={projects.metrics?.activeProjects || 0}
              description={`Out of ${projects.metrics?.totalProjects || 0} total`}
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadarChartCard
              title="Business Health Radar"
              description="Performance across all business areas"
              data={businessHealthData}
              dataKeys={[
                { key: 'value', name: 'Performance', color: CHART_COLORS[0] }
              ]}
              isLoading={isLoading}
              valueFormatter={numberFormatter}
            />

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>
                  Critical metrics across all business areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Profit Margin</TableCell>
                      <TableCell>
                        {finance.metrics?.income > 0
                          ? ((finance.metrics?.netCashflow / finance.metrics?.income) * 100).toFixed(1)
                          : 0}%
                      </TableCell>
                      <TableCell>20%</TableCell>
                      <TableCell>
                        {finance.metrics?.income > 0 && (finance.metrics?.netCashflow / finance.metrics?.income) * 100 >= 20
                          ? '✅'
                          : '⚠️'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Inventory Turnover</TableCell>
                      <TableCell>3.2</TableCell>
                      <TableCell>4.0</TableCell>
                      <TableCell>⚠️</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sales Growth</TableCell>
                      <TableCell>12.5%</TableCell>
                      <TableCell>10%</TableCell>
                      <TableCell>✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Project Completion</TableCell>
                      <TableCell>
                        {projects.metrics?.completedProjects && projects.metrics?.totalProjects
                          ? ((projects.metrics.completedProjects / projects.metrics.totalProjects) * 100).toFixed(1)
                          : 0}%
                      </TableCell>
                      <TableCell>75%</TableCell>
                      <TableCell>
                        {projects.metrics?.completedProjects && projects.metrics?.totalProjects &&
                          (projects.metrics.completedProjects / projects.metrics.totalProjects) * 100 >= 75
                          ? '✅'
                          : '⚠️'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales & Inventory Tab */}
        <TabsContent value="sales-inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartCard
              title="Top Selling Products"
              description="Revenue by product"
              data={inventorySalesCorrelation
                .reduce((acc: any[], item: any) => {
                  const existing = acc.find(i => i.name === item.name);
                  if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.revenue;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [])
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 10)
              }
              xAxisKey="name"
              bars={[
                { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Top Selling Products by Quantity"
              description="Units sold by product"
              data={inventorySalesCorrelation
                .reduce((acc: any[], item: any) => {
                  const existing = acc.find(i => i.name === item.name);
                  if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.revenue;
                  } else {
                    acc.push({ ...item });
                  }
                  return acc;
                }, [])
                .sort((a: any, b: any) => b.quantity - a.quantity)
                .slice(0, 10)
              }
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
              <CardTitle>Inventory-Sales Correlation</CardTitle>
              <CardDescription>
                Relationship between inventory levels and sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScatterChartCard
                title=""
                data={inventory.items?.map((item: any) => ({
                  name: item.name,
                  stock: item.quantity,
                  sales: inventorySalesCorrelation
                    .filter((sale: any) => sale.name === item.name)
                    .reduce((sum: number, sale: any) => sum + sale.quantity, 0),
                  revenue: inventorySalesCorrelation
                    .filter((sale: any) => sale.name === item.name)
                    .reduce((sum: number, sale: any) => sum + sale.revenue, 0)
                })) || []}
                xAxisKey="stock"
                yAxisKey="sales"
                zAxisKey="revenue"
                name="Products"
                isLoading={isLoading}
                xFormatter={numberFormatter}
                yFormatter={numberFormatter}
                height={350}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Efficiency Analysis</CardTitle>
              <CardDescription>
                Comparing inventory levels with sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock Level</TableHead>
                    <TableHead className="text-right">Sales (Units)</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Turnover Ratio</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.items?.slice(0, 10).map((item: any, index: number) => {
                    const sales = inventorySalesCorrelation
                      .filter((sale: any) => sale.name === item.name)
                      .reduce((sum: number, sale: any) => sum + sale.quantity, 0);
                    const revenue = inventorySalesCorrelation
                      .filter((sale: any) => sale.name === item.name)
                      .reduce((sum: number, sale: any) => sum + sale.revenue, 0);
                    const turnoverRatio = sales / (item.quantity || 1);

                    let recommendation = 'Maintain current levels';
                    if (turnoverRatio > 2) recommendation = 'Increase stock';
                    if (turnoverRatio < 0.5) recommendation = 'Reduce stock';

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{sales}</TableCell>
                        <TableCell className="text-right">{formatCurrency(revenue)}</TableCell>
                        <TableCell className="text-right">{turnoverRatio.toFixed(2)}</TableCell>
                        <TableCell>{recommendation}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance & Projects Tab */}
        <TabsContent value="finance-projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartCard
              title="Project Profitability"
              description="Profit and margin by project"
              data={projectProfitability.sort((a: any, b: any) => b.profit - a.profit)}
              xAxisKey="name"
              bars={[
                { dataKey: 'revenue', name: 'Revenue', color: INCOME_COLOR },
                { dataKey: 'costs', name: 'Costs', color: EXPENSE_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <LineChartCard
              title="Sales-Finance Impact"
              description="Relationship between sales and financial performance"
              data={salesFinanceImpact}
              xAxisKey="date"
              lines={[
                { dataKey: 'salesRevenue', name: 'Sales Revenue', color: CHART_COLORS[0] },
                { dataKey: 'profit', name: 'Net Profit', color: CHART_COLORS[2] }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Financial Performance</CardTitle>
              <CardDescription>
                Financial metrics for each project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Costs</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectProfitability.map((project: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.status}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.costs)}</TableCell>
                      <TableCell className={`text-right ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(project.profit)}
                      </TableCell>
                      <TableCell className={`text-right ${project.margin >= 20 ? 'text-green-600' : project.margin >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {project.margin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Performance Tab */}
        <TabsContent value="employee-performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartCard
              title="Employee Sales Performance"
              description="Sales value by employee"
              data={employeeProductivity.sort((a: any, b: any) => b.salesValue - a.salesValue).slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'salesValue', name: 'Sales Value', color: INCOME_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <BarChartCard
              title="Employee Productivity"
              description="Sales value per salary dollar"
              data={employeeProductivity.sort((a: any, b: any) => b.productivity - a.productivity).slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'productivity', name: 'Productivity Ratio', color: CHART_COLORS[3] }
              ]}
              isLoading={isLoading}
              valueFormatter={(value) => value.toFixed(2)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Metrics</CardTitle>
              <CardDescription>
                Comprehensive performance analysis by employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Sales Count</TableHead>
                    <TableHead className="text-right">Sales Value</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Productivity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeProductivity.map((employee: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-right">{employee.salesCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(employee.salesValue)}</TableCell>
                      <TableCell className="text-right">{employee.projectsCount}</TableCell>
                      <TableCell className={`text-right ${employee.productivity >= 2 ? 'text-green-600' : employee.productivity >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {employee.productivity.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
