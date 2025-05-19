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
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface ProfitLossReportProps {
  data: {
    income: {
      categories: Array<{
        name: string;
        amount: number;
        percentage: number;
        color?: string;
      }>;
      total: number;
    };
    expenses: {
      categories: Array<{
        name: string;
        amount: number;
        percentage: number;
        color?: string;
      }>;
      total: number;
    };
    netProfitLoss: number;
    profitMargin: number;
  } | null;
}

// Default colors for the pie chart
const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
const EXPENSE_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

export function ProfitLossReport({ data }: ProfitLossReportProps) {
  if (!data || !data.income || !data.expenses) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Ensure categories exist before mapping
  const incomeCategories = data.income.categories || [];
  const expenseCategories = data.expenses.categories || [];

  // Prepare data for the pie charts
  const incomeData = incomeCategories.map((category, index) => ({
    name: category.name,
    value: category.amount,
    color: category.color || INCOME_COLORS[index % INCOME_COLORS.length],
  }));

  const expenseData = expenseCategories.map((category, index) => ({
    name: category.name,
    value: category.amount,
    color: category.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.income.total)}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.expenses.total)}</h3>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit/Loss</p>
                <h3 className={`text-2xl font-bold mt-1 ${data.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netProfitLoss)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Profit Margin: {data.profitMargin.toFixed(2)}%
                </p>
              </div>
              <div className={`p-2 rounded-full ${data.netProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.netProfitLoss > 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : data.netProfitLoss < 0 ? (
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Income by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {incomeData.map((entry, index) => (
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
          <h3 className="text-lg font-medium mb-4">Expenses by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Income Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Category</th>
                <th className="text-right py-2 px-4">Amount</th>
                <th className="text-right py-2 px-4">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {incomeCategories.map((category, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || INCOME_COLORS[index % INCOME_COLORS.length] }}
                      />
                      {category.name}
                    </div>
                  </td>
                  <td className="text-right py-2 px-4">{formatCurrency(category.amount)}</td>
                  <td className="text-right py-2 px-4">{category.percentage.toFixed(2)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-muted/50">
                <td className="py-2 px-4">Total Income</td>
                <td className="text-right py-2 px-4">{formatCurrency(data.income.total)}</td>
                <td className="text-right py-2 px-4">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Expense Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Category</th>
                <th className="text-right py-2 px-4">Amount</th>
                <th className="text-right py-2 px-4">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {expenseCategories.map((category, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                      />
                      {category.name}
                    </div>
                  </td>
                  <td className="text-right py-2 px-4">{formatCurrency(category.amount)}</td>
                  <td className="text-right py-2 px-4">{category.percentage.toFixed(2)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-muted/50">
                <td className="py-2 px-4">Total Expenses</td>
                <td className="text-right py-2 px-4">{formatCurrency(data.expenses.total)}</td>
                <td className="text-right py-2 px-4">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Profit/Loss */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Net Profit/Loss</h3>
          <p className={`text-xl font-bold ${data.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.netProfitLoss)}
          </p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <h3 className="text-sm text-muted-foreground">Profit Margin</h3>
          <p className={`text-sm font-medium ${data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.profitMargin.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}
