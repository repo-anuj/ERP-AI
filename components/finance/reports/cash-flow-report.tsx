'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface CashFlowReportProps {
  data: {
    dailyCashFlow: Array<{
      date: string;
      income: number;
      expenses: number;
      netCashFlow: number;
    }>;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    averageDailyIncome: number;
    averageDailyExpenses: number;
    averageDailyNetCashFlow: number;
  } | null;
}

export function CashFlowReport({ data }: CashFlowReportProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Format the data for the chart
  const chartData = data.dailyCashFlow.map((day) => ({
    date: format(parseISO(day.date), 'MMM dd'),
    Income: day.income,
    Expenses: -day.expenses, // Negative for better visualization
    'Net Cash Flow': day.netCashFlow,
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
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.totalIncome)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {formatCurrency(data.averageDailyIncome)}/day
                </p>
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
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.totalExpenses)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {formatCurrency(data.averageDailyExpenses)}/day
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
                <h3 className={`text-2xl font-bold mt-1 ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netCashFlow)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {formatCurrency(data.averageDailyNetCashFlow)}/day
                </p>
              </div>
              <div className={`p-2 rounded-full ${data.netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.netCashFlow > 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : data.netCashFlow < 0 ? (
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(Math.abs(value))}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="Income" fill="#10b981" name="Income" />
            <Bar dataKey="Expenses" fill="#ef4444" name="Expenses" />
            <Bar dataKey="Net Cash Flow" fill="#3b82f6" name="Net Cash Flow" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Date</th>
              <th className="text-right py-2 px-4">Income</th>
              <th className="text-right py-2 px-4">Expenses</th>
              <th className="text-right py-2 px-4">Net Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyCashFlow.map((day, index) => (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="py-2 px-4">{format(parseISO(day.date), 'MMM dd, yyyy')}</td>
                <td className="text-right py-2 px-4 text-green-600">{formatCurrency(day.income)}</td>
                <td className="text-right py-2 px-4 text-red-600">{formatCurrency(day.expenses)}</td>
                <td className={`text-right py-2 px-4 ${day.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(day.netCashFlow)}
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-muted/50">
              <td className="py-2 px-4">Total</td>
              <td className="text-right py-2 px-4 text-green-600">{formatCurrency(data.totalIncome)}</td>
              <td className="text-right py-2 px-4 text-red-600">{formatCurrency(data.totalExpenses)}</td>
              <td className={`text-right py-2 px-4 ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netCashFlow)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
