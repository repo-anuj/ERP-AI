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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle,
  Bell,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BudgetAlertsProps {
  threshold?: number;
}

export function BudgetAlerts({ threshold = 90 }: BudgetAlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/finance/budgets/alerts?threshold=${threshold}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch budget alerts');
      }
      
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      toast.error('Failed to load budget alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [threshold]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    setIsRefreshing(false);
  };

  const handleCreateNotification = async (alert: any) => {
    try {
      const response = await fetch('/api/finance/budgets/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alert.id,
          budgetId: alert.budgetId,
          itemId: alert.itemId,
          message: alert.message,
          severity: alert.severity,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
      
      toast.success('Notification created');
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    }
  };

  const handleViewBudget = (budgetId: string) => {
    router.push(`/dashboard/finance/budgets?id=${budgetId}`);
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') {
      return <Badge variant="destructive">Critical</Badge>;
    }
    return <Badge variant="warning">Warning</Badge>;
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
    return <AlertTriangle className="h-5 w-5 text-warning" />;
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Budget Alerts</CardTitle>
          <CardDescription>
            Alerts for budgets that have reached {threshold}% of their allocation
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No Budget Alerts</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no budgets that have reached the {threshold}% threshold of their allocation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{alert.budgetName}</h4>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {alert.percentSpent.toFixed(1)}% of budget used
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewBudget(alert.budgetId)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCreateNotification(alert)}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>
            Showing alerts for budgets that have reached {threshold}% of their allocation
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
