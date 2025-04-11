'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, BarChartBig, Plus, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  onAddTransaction: () => void;
}

export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-10 w-10 text-primary" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-medium">No Financial Data Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Start tracking your finances by adding your first transaction. You can record income, expenses, and manage your budget categories.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onAddTransaction}>
            <Plus className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">Add Transaction</h4>
            <p className="text-sm text-muted-foreground">Record income or expenses</p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <BarChartBig className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">Create Budget</h4>
            <p className="text-sm text-muted-foreground">Set budget categories and limits</p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center text-center space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium">View Reports</h4>
            <p className="text-sm text-muted-foreground">Analyze your financial data</p>
          </Card>
        </div>
        
        <Button onClick={onAddTransaction} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Add First Transaction
        </Button>
      </CardContent>
    </Card>
  );
} 