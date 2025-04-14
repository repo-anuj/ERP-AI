'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart4,
  ArrowUpDown,
  CreditCard
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
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaginationControls } from './pagination-controls';

interface FinanceAnalyticsProps {
  data: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function FinanceAnalytics({
  data,
  isLoading,
  onPageChange,
  onPageSizeChange
}: FinanceAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Extract metrics from data
  const metrics = data?.metrics || {
    totalTransactions: 0,
    income: 0,
    expenses: 0,
    netCashflow: 0,
    incomeByCategory: [],
    expensesByCategory: [],
    financeTimeSeries: []
  };

  // Format data for charts
  const incomeByCategory = metrics.incomeByCategory || [];
  const expensesByCategory = metrics.expensesByCategory || [];
  const financeTimeSeries = metrics.financeTimeSeries || [];
  const transactions = data?.transactions || [];

  // Calculate profit margin
  const profitMargin = metrics.income > 0
    ? (metrics.netCashflow / metrics.income) * 100
    : 0;

  // Format time series data for charts
  const formattedTimeSeries = Array.isArray(financeTimeSeries) ? financeTimeSeries.map((entry: any) => ({
    date: entry.date || new Date().toISOString().split('T')[0],
    income: entry.income || 0,
    expenses: entry.expenses || 0,
    netCashflow: (entry.income || 0) - (entry.expenses || 0)
  })) : [];

  // Calculate budget vs actual (mock data for now)
  const budgetVsActual = [
    { category: 'Revenue', budget: 150000, actual: metrics.income, variance: metrics.income - 150000 },
    { category: 'Expenses', budget: 100000, actual: metrics.expenses, variance: metrics.expenses - 100000 },
    { category: 'Profit', budget: 50000, actual: metrics.netCashflow, variance: metrics.netCashflow - 50000 }
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Net Cashflow"
              value={formatCurrency(metrics.netCashflow)}
              description={`From ${metrics.totalTransactions} transactions`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              trend={metrics.netCashflow > 0 ? 'up' : metrics.netCashflow < 0 ? 'down' : 'neutral'}
              trendValue={`${Math.abs(profitMargin).toFixed(1)}% margin`}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Total Income"
              value={formatCurrency(metrics.income)}
              description={`Across ${incomeByCategory.length} categories`}
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Total Expenses"
              value={formatCurrency(metrics.expenses)}
              description={`Across ${expensesByCategory.length} categories`}
              icon={<TrendingDown className="h-4 w-4 text-red-500" />}
              isLoading={isLoading}
            />

            <AnalyticsCard
              title="Profit Margin"
              value={`${profitMargin.toFixed(1)}%`}
              description="Net income / Total revenue"
              icon={<ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
              trend={profitMargin > 20 ? 'up' : profitMargin > 0 ? 'neutral' : 'down'}
              trendValue={profitMargin > 20 ? 'Healthy' : profitMargin > 0 ? 'Moderate' : 'Negative'}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AreaChartCard
              title="Income vs Expenses"
              description="Comparison over time"
              data={formattedTimeSeries}
              xAxisKey="date"
              areas={[
                { dataKey: 'income', name: 'Income', color: INCOME_COLOR, fillOpacity: 0.6 },
                { dataKey: 'expenses', name: 'Expenses', color: EXPENSE_COLOR, fillOpacity: 0.6 }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />

            <LineChartCard
              title="Net Cashflow Trend"
              description="Profit/loss over time"
              data={formattedTimeSeries}
              xAxisKey="date"
              lines={[
                { dataKey: 'netCashflow', name: 'Net Cashflow', color: CHART_COLORS[2] }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((transaction: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === 'income' ? 'default' :
                            transaction.type === 'expense' ? 'destructive' :
                            'outline'
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right ${
                        transaction.type === 'income' ? 'text-green-600' :
                        transaction.type === 'expense' ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PieChartCard
              title="Income by Category"
              description="Distribution across categories"
              data={incomeByCategory}
              nameKey="name"
              dataKey="amount"
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
              colors={[...Array(incomeByCategory.length)].map((_, i) => CHART_COLORS[i % CHART_COLORS.length])}
            />

            <BarChartCard
              title="Top Income Sources"
              description="Highest revenue categories"
              data={incomeByCategory.slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'amount', name: 'Amount', color: INCOME_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income Details</CardTitle>
              <CardDescription>
                Breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeByCategory.map((category: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(category.amount)}</TableCell>
                      <TableCell className="text-right">{category.count}</TableCell>
                      <TableCell className="text-right">
                        {metrics.income > 0 ? ((category.amount / metrics.income) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PieChartCard
              title="Expenses by Category"
              description="Distribution across categories"
              data={expensesByCategory}
              nameKey="name"
              dataKey="amount"
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
              colors={[...Array(expensesByCategory.length)].map((_, i) => CHART_COLORS[i % CHART_COLORS.length])}
            />

            <BarChartCard
              title="Top Expense Categories"
              description="Highest expense categories"
              data={expensesByCategory.slice(0, 10)}
              xAxisKey="name"
              bars={[
                { dataKey: 'amount', name: 'Amount', color: EXPENSE_COLOR }
              ]}
              isLoading={isLoading}
              valueFormatter={currencyFormatter}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>
                Breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesByCategory.map((category: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(category.amount)}</TableCell>
                      <TableCell className="text-right">{category.count}</TableCell>
                      <TableCell className="text-right">
                        {metrics.expenses > 0 ? ((category.amount / metrics.expenses) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetVsActual.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-medium">{formatCurrency(item.budget)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="font-medium">{formatCurrency(item.actual)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Variance</span>
                    <span className={`font-medium ${
                      (item.category === 'Expenses' && item.variance < 0) ||
                      ((item.category === 'Revenue' || item.category === 'Profit') && item.variance > 0)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          (item.category === 'Expenses' && item.actual <= item.budget) ||
                          ((item.category === 'Revenue' || item.category === 'Profit') && item.actual >= item.budget)
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, (item.actual / item.budget) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {Math.min(100, Math.max(0, (item.actual / item.budget) * 100)).toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground">Target: 100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual by Category</CardTitle>
              <CardDescription>
                Comparison of budgeted and actual amounts by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard
                title=""
                data={[
                  { name: 'Sales', budget: 120000, actual: 115000 },
                  { name: 'Services', budget: 30000, actual: 35000 },
                  { name: 'Salaries', budget: 50000, actual: 52000 },
                  { name: 'Marketing', budget: 20000, actual: 18000 },
                  { name: 'Operations', budget: 15000, actual: 14000 },
                  { name: 'Office', budget: 10000, actual: 9500 },
                  { name: 'Other', budget: 5000, actual: 6500 }
                ]}
                xAxisKey="name"
                bars={[
                  { dataKey: 'budget', name: 'Budget', color: CHART_COLORS[3] },
                  { dataKey: 'actual', name: 'Actual', color: CHART_COLORS[0] }
                ]}
                isLoading={isLoading}
                valueFormatter={currencyFormatter}
                height={300}
              />
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
