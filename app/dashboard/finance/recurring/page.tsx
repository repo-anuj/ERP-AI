'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PlusIcon, MoreHorizontal, Edit, Trash, Play, Pause, RefreshCw, CalendarIcon } from 'lucide-react';
import { RecurringTransactionDialog } from '@/components/finance/recurring-transaction-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';

export default function RecurringTransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch recurring transactions on page load
  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  // Fetch recurring transactions from the API
  const fetchRecurringTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/finance/recurring');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recurring transactions');
      }
      
      const data = await response.json();
      setRecurringTransactions(data);
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      toast.error('Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new recurring transaction
  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setIsDialogOpen(true);
  };

  // Handle editing a recurring transaction
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  // Handle deleting a recurring transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/finance/recurring?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recurring transaction');
      }
      
      toast.success('Recurring transaction deleted successfully');
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  // Handle changing the status of a recurring transaction
  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const transaction = recurringTransactions.find(tx => tx.id === id);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      const response = await fetch(`/api/finance/recurring?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transaction,
          status: newStatus,
          startDate: transaction.startDate,
          endDate: transaction.endDate,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update transaction status');
      }
      
      toast.success(`Transaction ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast.error('Failed to update transaction status');
    }
  };

  // Process due recurring transactions
  const processRecurringTransactions = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/finance/recurring/process', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to process recurring transactions');
      }
      
      const result = await response.json();
      
      if (result.processed === 0) {
        toast.info('No recurring transactions due for processing');
      } else {
        toast.success(`Processed ${result.successful} recurring transactions successfully`);
        
        if (result.failed > 0) {
          toast.error(`Failed to process ${result.failed} transactions`);
        }
      }
      
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      toast.error('Failed to process recurring transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get the status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get the type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'income':
        return <Badge variant="success">Income</Badge>;
      case 'expense':
        return <Badge variant="destructive">Expense</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Filter transactions based on active tab
  const filteredTransactions = recurringTransactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={processRecurringTransactions}
            disabled={isProcessing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing...' : 'Process Due Transactions'}
          </Button>
          <Button size="sm" onClick={handleAddTransaction}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Recurring Transaction
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Transactions</CardTitle>
              <CardDescription>
                Manage your recurring income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No recurring transactions found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first recurring transaction to automate your finances
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddTransaction}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Recurring Transaction
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.name}
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {transaction.interval > 1 ? `Every ${transaction.interval} ` : 'Every '}
                          {transaction.frequency === 'daily' && 'days'}
                          {transaction.frequency === 'weekly' && 'weeks'}
                          {transaction.frequency === 'monthly' && 'months'}
                          {transaction.frequency === 'yearly' && 'years'}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.nextDueDate)}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.nextDueDate), { addSuffix: true })}
                          </p>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(transaction.type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              
                              {transaction.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleChangeStatus(transaction.id, 'paused')}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </DropdownMenuItem>
                              ) : transaction.status === 'paused' ? (
                                <DropdownMenuItem onClick={() => handleChangeStatus(transaction.id, 'active')}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              ) : null}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecurringTransactionDialog
        recurringTransaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchRecurringTransactions}
      />
    </div>
  );
}
