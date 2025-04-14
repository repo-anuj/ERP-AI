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
import { BudgetComparison } from './budget-comparison';
import { BudgetAlerts } from './budget-alerts';
import { toast } from 'sonner';
import { Edit, RefreshCw, AlertTriangle, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BudgetDetailsProps {
  budgetId: string;
  onEdit: () => void;
}

export function BudgetDetails({ budgetId, onEdit }: BudgetDetailsProps) {
  const [budget, setBudget] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { defaultCurrency } = useCurrency();

  const fetchBudgetDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/finance/budgets/track?budgetId=${budgetId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch budget details');
      }

      const data = await response.json();
      setBudget(data);
    } catch (error) {
      console.error('Error fetching budget details:', error);
      toast.error('Failed to load budget details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (budgetId) {
      fetchBudgetDetails();
    }
  }, [budgetId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBudgetDetails();
    setIsRefreshing(false);
  };

  const getBudgetStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 90) return 'bg-warning';
    return 'bg-primary';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over-budget':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return null;
    }
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

  if (!budget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Not Found</CardTitle>
          <CardDescription>
            The requested budget could not be found or has been deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle>{budget.name}</CardTitle>
              {getBudgetStatusBadge(budget.status)}
            </div>
            <CardDescription>
              {budget.type.charAt(0).toUpperCase() + budget.type.slice(1)} Budget •
              {formatDate(budget.startDate)} to {formatDate(budget.endDate)}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Budget Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Budget Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay
                    value={budget.totalBudget}
                    currency={defaultCurrency}
                    showOriginal={false}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay
                    value={budget.totalSpent}
                    currency={defaultCurrency}
                    showOriginal={false}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay
                    value={budget.remainingBudget}
                    currency={defaultCurrency}
                    showOriginal={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Budget Utilization</span>
              <span className="text-sm font-medium">
                {budget.spentPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={budget.spentPercentage}
              className={`h-2 ${getProgressColor(budget.spentPercentage)}`}
            />
          </div>
        </div>

        {/* Budget Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Budget Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budgeted</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category?.name || 'Uncategorized'}</TableCell>
                  <TableCell>
                    <CurrencyDisplay
                      value={item.amount}
                      currency={defaultCurrency}
                      showOriginal={false}
                    />
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay
                      value={item.spent}
                      currency={defaultCurrency}
                      showOriginal={false}
                    />
                  </TableCell>
                  <TableCell>
                    <CurrencyDisplay
                      value={item.remaining}
                      currency={defaultCurrency}
                      showOriginal={false}
                    />
                  </TableCell>
                  <TableCell className="w-[180px]">
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={item.spentPercentage}
                        className={`h-2 ${getProgressColor(item.spentPercentage)}`}
                      />
                      <span className="text-xs w-12 text-right">
                        {item.spentPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(item.status)}
                      <span className="text-xs">
                        {item.status === 'over-budget' ? 'Over Budget' :
                         item.status === 'warning' ? 'Near Limit' : 'On Track'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      </Card>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="comparison">
            <BarChart2 className="h-4 w-4 mr-2" />
            Budget vs. Actual
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Budget Alerts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comparison">
          <BudgetComparison budgetId={budgetId} />
        </TabsContent>
        <TabsContent value="alerts">
          <BudgetAlerts threshold={90} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
