'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  FileText,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowDownUp
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CashFlowReport } from '@/components/finance/reports/cash-flow-report';
import { ProfitLossReport } from '@/components/finance/reports/profit-loss-report';
import { BalanceSheetReport } from '@/components/finance/reports/balance-sheet-report';
import { ExpensesByCategoryReport } from '@/components/finance/reports/expenses-by-category-report';
import { addDays, subDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cash-flow');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Handle date range changes, ensuring we never set undefined
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate report when tab changes or date range changes
  useEffect(() => {
    generateReport();
  }, [activeTab, dateRange]);

  // Generate the selected report
  const generateReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select a valid date range');
      return;
    }

    setIsGenerating(true);
    setIsLoading(true);

    try {
      const response = await fetch('/api/finance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: activeTab,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  // Download report as CSV
  const downloadReport = () => {
    if (!reportData) {
      toast.error('No report data to download');
      return;
    }

    try {
      let csvContent = '';

      // Different CSV format based on report type
      if (activeTab === 'cash-flow') {
        csvContent = 'Date,Income,Expenses,Net Cash Flow\n';
        reportData.dailyCashFlow.forEach((day: any) => {
          csvContent += `${day.date},${day.income},${day.expenses},${day.netCashFlow}\n`;
        });
      } else if (activeTab === 'profit-loss') {
        csvContent = 'Category,Amount\n';
        csvContent += 'Income\n';
        reportData.income.categories.forEach((category: any) => {
          csvContent += `${category.name},${category.amount}\n`;
        });
        csvContent += 'Expenses\n';
        reportData.expenses.categories.forEach((category: any) => {
          csvContent += `${category.name},${category.amount}\n`;
        });
        csvContent += `\nTotal Income,${reportData.income.total}\n`;
        csvContent += `Total Expenses,${reportData.expenses.total}\n`;
        csvContent += `Net Profit/Loss,${reportData.netProfitLoss}\n`;
      } else if (activeTab === 'balance-sheet') {
        csvContent = 'Account,Balance\n';
        reportData.accounts.forEach((account: any) => {
          csvContent += `${account.name},${account.balance}\n`;
        });
        csvContent += `\nTotal Assets,${reportData.totalAssets}\n`;
        csvContent += `Total Liabilities,${reportData.totalLiabilities}\n`;
        csvContent += `Net Worth,${reportData.netWorth}\n`;
      } else if (activeTab === 'expenses-by-category') {
        csvContent = 'Category,Amount,Percentage\n';
        reportData.categories.forEach((category: any) => {
          csvContent += `${category.name},${category.amount},${category.percentage}%\n`;
        });
        csvContent += `\nTotal Expenses,${reportData.totalExpenses}\n`;
      }

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTab}-report-${dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start'}-to-${dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : 'end'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  // Quick date range selectors
  const setThisMonth = () => {
    const range: DateRange = {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    };
    setDateRange(range);
  };

  const setLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const range: DateRange = {
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth),
    };
    setDateRange(range);
  };

  const setLast30Days = () => {
    const today = new Date();
    const range: DateRange = {
      from: subDays(today, 30),
      to: today,
    };
    setDateRange(range);
  };

  const setLast90Days = () => {
    const today = new Date();
    const range: DateRange = {
      from: subDays(today, 90),
      to: today,
    };
    setDateRange(range);
  };

  const setThisYear = () => {
    const today = new Date();
    const range: DateRange = {
      from: new Date(today.getFullYear(), 0, 1),
      to: new Date(today.getFullYear(), 11, 31),
    };
    setDateRange(range);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateReport}
            disabled={isGenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={downloadReport}
            disabled={!reportData || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={setThisMonth}>
            This Month
          </Button>
          <Button variant="outline" size="sm" onClick={setLastMonth}>
            Last Month
          </Button>
          <Button variant="outline" size="sm" onClick={setLast30Days}>
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm" onClick={setLast90Days}>
            Last 90 Days
          </Button>
          <Button variant="outline" size="sm" onClick={setThisYear}>
            This Year
          </Button>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      <Tabs defaultValue="cash-flow" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4" />
            <span>Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Profit & Loss</span>
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Balance Sheet</span>
          </TabsTrigger>
          <TabsTrigger value="expenses-by-category" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Expenses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash-flow" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5" />
                Cash Flow Report
              </CardTitle>
              <CardDescription>
                Track your income and expenses over time to see your net cash flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <CashFlowReport data={reportData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>
                Summary of your income, expenses, and overall profitability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <ProfitLossReport data={reportData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>
                Overview of your assets, liabilities, and net worth
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <BalanceSheetReport data={reportData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses-by-category" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Expenses by Category
              </CardTitle>
              <CardDescription>
                Breakdown of your expenses by category to identify spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <ExpensesByCategoryReport data={reportData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
