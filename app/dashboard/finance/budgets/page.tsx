'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, ScrollText } from 'lucide-react';

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Management</CardTitle>
          <CardDescription>
            Set up and track budgets to manage your company finances
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-center">Coming Soon</h3>
          <p className="text-center text-muted-foreground max-w-md">
            Budget management features are coming soon. You'll be able to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Create monthly and annual budgets</li>
            <li>Set limits for expense categories</li>
            <li>Track actual spending against budgeted amounts</li>
            <li>Get alerts when approaching budget limits</li>
            <li>View budget performance reports</li>
          </ul>
          <div className="flex items-center mt-4 pt-4 border-t w-full justify-center">
            <ScrollText className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Check back soon for these features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 