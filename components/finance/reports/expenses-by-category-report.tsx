'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ArrowDownRight } from 'lucide-react';

interface ExpensesByCategoryReportProps {
  data: {
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
      color?: string;
      icon?: string;
      transactions: number;
    }>;
    totalExpenses: number;
    largestCategory: {
      name: string;
      amount: number;
      percentage: number;
    };
    smallestCategory: {
      name: string;
      amount: number;
      percentage: number;
    };
    averageCategorySpend: number;
  } | null;
}

// Default colors for the charts
const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
];

export function ExpensesByCategoryReport({ data }: ExpensesByCategoryReportProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Prepare data for the pie chart
  const pieData = data.categories.map((category, index) => ({
    name: category.name,
    value: category.amount,
    color: category.color || COLORS[index % COLORS.length],
  }));

  // Prepare data for the bar chart
  const barData = [...data.categories]
    .sort((a, b) => b.amount - a.amount)
    .map((category, index) => ({
      name: category.name,
      amount: category.amount,
      color: category.color || COLORS[index % COLORS.length],
    }));

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.totalExpenses)}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Across {data.categories.length} categories
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Expense Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Top Expense Categories</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData.slice(0, 5)} // Show only top 5 categories
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount">
                  {barData.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Largest Category</p>
            <h3 className="text-xl font-bold mt-1">{data.largestCategory.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                {data.largestCategory.percentage.toFixed(1)}% of total
              </p>
              <p className="text-sm font-medium">{formatCurrency(data.largestCategory.amount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Smallest Category</p>
            <h3 className="text-xl font-bold mt-1">{data.smallestCategory.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                {data.smallestCategory.percentage.toFixed(1)}% of total
              </p>
              <p className="text-sm font-medium">{formatCurrency(data.smallestCategory.amount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Average per Category</p>
            <h3 className="text-xl font-bold mt-1">{formatCurrency(data.averageCategorySpend)}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Across {data.categories.length} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Expense Categories</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Category</th>
                <th className="text-right py-2 px-4">Amount</th>
                <th className="text-right py-2 px-4">Percentage</th>
                <th className="text-right py-2 px-4">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((category, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {category.icon ? (
                        <span className="text-lg">{category.icon}</span>
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                        />
                      )}
                      {category.name}
                    </div>
                  </td>
                  <td className="text-right py-2 px-4">{formatCurrency(category.amount)}</td>
                  <td className="text-right py-2 px-4">{category.percentage.toFixed(2)}%</td>
                  <td className="text-right py-2 px-4">{category.transactions}</td>
                </tr>
              ))}
              <tr className="font-bold bg-muted/50">
                <td className="py-2 px-4">Total</td>
                <td className="text-right py-2 px-4">{formatCurrency(data.totalExpenses)}</td>
                <td className="text-right py-2 px-4">100%</td>
                <td className="text-right py-2 px-4">
                  {data.categories.reduce((sum, category) => sum + category.transactions, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
