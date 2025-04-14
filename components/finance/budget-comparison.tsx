'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { CurrencyDisplay } from './currency-display';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetComparisonProps {
  budgetId: string;
}

export function BudgetComparison({ budgetId }: BudgetComparisonProps) {
  const [comparison, setComparison] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [period, setPeriod] = useState<string>('month');

  const fetchComparisonData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/finance/budgets/comparison?budgetId=${budgetId}&period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget comparison data');
      }
      
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Error fetching budget comparison:', error);
      toast.error('Failed to load budget comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (budgetId) {
      fetchComparisonData();
    }
  }, [budgetId, period]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchComparisonData();
    setIsRefreshing(false);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed >= 100) return 'bg-destructive';
    if (percentUsed >= 90) return 'bg-warning';
    return 'bg-primary';
  };

  const getStatusIcon = (percentUsed: number) => {
    if (percentUsed >= 100) return <XCircle className="h-4 w-4 text-destructive" />;
    if (percentUsed >= 90) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    return <TrendingDown className="h-4 w-4 text-success" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparison Data Not Available</CardTitle>
          <CardDescription>
            The budget comparison data could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Budget vs. Actual Comparison</CardTitle>
          <CardDescription>
            Comparing budget "{comparison.budget.name}" with actual spending
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budgeted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay 
                  value={comparison.summary.totalBudgeted} 
                  showOriginal={false} 
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actual Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay 
                  value={comparison.summary.totalActual} 
                  showOriginal={false} 
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Variance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getVarianceIcon(comparison.summary.totalVariance)}
                <div className="text-2xl font-bold ml-2">
                  <CurrencyDisplay 
                    value={Math.abs(comparison.summary.totalVariance)} 
                    showOriginal={false} 
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {comparison.summary.totalVariance > 0 ? 'Over budget' : 'Under budget'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getStatusIcon(comparison.summary.totalPercentUsed)}
                <div className="text-2xl font-bold ml-2">
                  {comparison.summary.totalPercentUsed.toFixed(1)}%
                </div>
              </div>
              <div className="mt-2">
                <Progress 
                  value={comparison.summary.totalPercentUsed} 
                  className={`h-2 ${getProgressColor(comparison.summary.totalPercentUsed)}`} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Comparison Table */}
        <div>
          <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Budgeted</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>% Used</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.categories.map((category: any) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <CurrencyDisplay 
                      value={category.budgeted} 
                      showOriginal={false} 
                    />
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay 
                      value={category.actual} 
                      showOriginal={false} 
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getVarianceIcon(category.variance)}
                      <span className="ml-1">
                        <CurrencyDisplay 
                          value={Math.abs(category.variance)} 
                          showOriginal={false} 
                        />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={category.percentUsed} 
                        className={`h-2 w-24 ${getProgressColor(category.percentUsed)}`} 
                      />
                      <span className="text-xs w-12 text-right">
                        {category.percentUsed.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(category.percentUsed)}
                      <span className="text-xs">
                        {category.percentUsed >= 100 ? 'Over Budget' : 
                         category.percentUsed >= 90 ? 'Near Limit' : 'On Track'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          <span>
            Data for period: {formatDate(comparison.budget.startDate)} to {formatDate(comparison.budget.endDate)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
