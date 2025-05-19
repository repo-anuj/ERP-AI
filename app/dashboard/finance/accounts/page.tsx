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
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { PlusIcon, Building2Icon, MoreHorizontal, Edit, Trash, RefreshCw } from 'lucide-react';
import { AccountDialog } from '@/components/finance/account-dialog';
import { RecalculateBalanceButton } from '@/components/finance/recalculate-balance-button';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string | { id: string; name: string; [key: string]: any };
  reference?: string;
  status: string;
  sourceType?: 'finance' | 'sales' | 'inventory';
  originalData?: any;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  initialBalance?: number;
  currentBalance?: number;
  currency: string;
  number?: string;
  institutionName?: string;
  description?: string;
}

export default function AccountsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isUpdatingBalances, setIsUpdatingBalances] = useState(false);

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Effect to fetch transactions only after accounts are loaded
  useEffect(() => {
    if (accounts.length > 0) {
      fetchTransactions();
    }
  }, [accounts.length]);

  // Fetch accounts from the API
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/finance/accounts');

      if (response.ok) {
        const data = await response.json();
        // Store initialBalance for later reference
        const accountsWithInitialBalance = data.map((account: Account) => ({
          ...account,
          initialBalance: account.balance,
          currentBalance: account.balance // Will be updated when transactions are loaded
        }));
        setAccounts(accountsWithInitialBalance);
        calculateTotalBalance(accountsWithInitialBalance);
      } else {
        toast.error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total balance across all accounts
  const calculateTotalBalance = (accountsList: Account[]) => {
    const total = accountsList.reduce((sum, account) => {
      // Use currentBalance if available, otherwise fall back to balance
      const balanceToUse = typeof account.currentBalance !== 'undefined'
        ? account.currentBalance
        : account.balance;

      // For credit accounts, negative balance is actually good
      const balanceValue = account.type === 'credit'
        ? -balanceToUse
        : balanceToUse;

      return sum + balanceValue;
    }, 0);

    setTotalBalance(total);
  };

  // Handle adding a new account
  const handleAddAccount = () => {
    setSelectedAccount(null);
    setAccountDialogOpen(true);
  };

  // Handle editing an account
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setAccountDialogOpen(true);
  };

  // Handle deleting an account
  const handleDeleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/accounts?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
        calculateTotalBalance(accounts.filter(a => a.id !== id));
        toast.success('Account deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  // Handle account form submission success
  const handleAccountSuccess = () => {
    setAccountDialogOpen(false);
    fetchAccounts();
  };

  // Fetch transactions from the API
  const fetchTransactions = async () => {
    try {
      setIsUpdatingBalances(true);
      const response = await fetch('/api/finance/transactions');

      if (response.ok) {
        const data = await response.json();

        // Map API data to match our expected format
        const mappedTransactions = data.map((transaction: any) => ({
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category?.name || (typeof transaction.category === 'string' ? transaction.category : 'Other'),
          account: transaction.account?.name || (typeof transaction.account === 'string' ? transaction.account : 'Default'),
          reference: transaction.reference,
          status: transaction.status,
        }));

        setTransactions(mappedTransactions);
        updateAccountBalances(mappedTransactions);

        // Also fetch related data from other modules
        fetchSalesData();
        fetchInventoryData();
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsUpdatingBalances(false);
    }
  };

  // Fetch sales data and convert to income transactions
  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales/invoices?status=paid');

      if (response.ok) {
        const invoicesData = await response.json();

        if (!Array.isArray(invoicesData)) {
          console.error('Invalid sales data format');
          return;
        }

        // Map sales data to transactions
        const salesTransactions: Transaction[] = invoicesData.map((invoice: any) => ({
          id: `sales-${invoice.id}`,
          date: invoice.paymentDate || invoice.date,
          description: `Invoice #${invoice.number}: ${invoice.customerName || 'Customer'}`,
          amount: invoice.total,
          type: 'income',
          category: 'Sales',
          account: invoice.paymentMethod || 'Default Account',
          reference: invoice.number,
          status: invoice.status === 'paid' ? 'completed' : 'pending',
          sourceType: 'sales',
          originalData: invoice
        }));

        // Add to transactions array
        setTransactions(prev => {
          // Filter out any existing sales transactions to avoid duplicates
          const filtered = prev.filter(t => !t.id.startsWith('sales-'));
          const combined = [...filtered, ...salesTransactions];
          updateAccountBalances(combined);
          return combined;
        });
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  // Fetch inventory data and convert to expense transactions
  const fetchInventoryData = async () => {
    try {
      const response = await fetch('/api/inventory/purchases');

      if (response.ok) {
        const purchasesData = await response.json();

        if (!Array.isArray(purchasesData)) {
          console.error('Invalid inventory data format');
          return;
        }

        // Map inventory data to transactions
        const inventoryTransactions: Transaction[] = purchasesData.map((purchase: any) => ({
          id: `inventory-${purchase.id}`,
          date: purchase.date,
          description: `Purchase: ${purchase.itemName || 'Inventory item'}`,
          amount: purchase.totalCost,
          type: 'expense',
          category: 'Inventory Purchase',
          account: 'Inventory Account',
          reference: purchase.purchaseOrder || purchase.reference || `PO-${purchase.id.substring(0, 8)}`,
          status: purchase.status === 'paid' ? 'completed' : (purchase.status || 'pending'),
          sourceType: 'inventory',
          originalData: purchase
        }));

        // Add to transactions array
        setTransactions(prev => {
          // Filter out any existing inventory transactions to avoid duplicates
          const filtered = prev.filter(t => !t.id.startsWith('inventory-'));
          const combined = [...filtered, ...inventoryTransactions];
          updateAccountBalances(combined);
          return combined;
        });
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    }
  };

  // Update account balances based on completed transactions
  const updateAccountBalances = (transactionsList: Transaction[]) => {
    // Create a copy of accounts
    const updatedAccounts = [...accounts];

    // Reset all account balances to their initial values
    updatedAccounts.forEach(account => {
      account.currentBalance = account.initialBalance || 0;
    });

    // Only use completed transactions to update balances
    const completedTransactions = transactionsList.filter(t => t.status === 'completed');

    // Update balances based on transactions
    completedTransactions.forEach(transaction => {
      // Find the account this transaction belongs to
      const accountIndex = updatedAccounts.findIndex(a => {
        // Match by name or by id if available
        return a.name === transaction.account ||
               (typeof transaction.account === 'object' && transaction.account?.id === a.id);
      });

      if (accountIndex >= 0) {
        // Found the account, update its balance
        if (transaction.type === 'income') {
          updatedAccounts[accountIndex].currentBalance! += transaction.amount;
        } else if (transaction.type === 'expense') {
          updatedAccounts[accountIndex].currentBalance! -= transaction.amount;
        }
      }
    });

    setAccounts(updatedAccounts);
    calculateTotalBalance(updatedAccounts);
  };

  // Get icon for account type
  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building2Icon className="h-4 w-4 text-blue-500" />;
      case 'cash':
        return <span className="text-green-500">💵</span>;
      case 'credit':
        return <span className="text-purple-500">💳</span>;
      case 'investment':
        return <span className="text-amber-500">📈</span>;
      default:
        return <span className="text-gray-500">💼</span>;
    }
  };

  // Get human-readable account type
  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank: 'Bank Account',
      cash: 'Cash',
      credit: 'Credit Card',
      investment: 'Investment',
      other: 'Other',
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Show empty state if no accounts
  if (accounts.length === 0) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Financial Accounts</h1>
          <Button onClick={handleAddAccount}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Building2Icon className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold">No Accounts Found</h2>
            <p className="text-muted-foreground max-w-md">
              You haven't created any financial accounts yet. Create your first account to track your income and expenses.
            </p>
            <Button size="lg" onClick={handleAddAccount}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Your First Account
            </Button>
          </div>
        </Card>

        <AccountDialog
          account={selectedAccount}
          open={accountDialogOpen}
          onOpenChange={setAccountDialogOpen}
          onSuccess={handleAccountSuccess}
        />
      </div>
    );
  }

  // Main accounts page with data
  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Financial Accounts</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAccounts();
              fetchTransactions();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isUpdatingBalances ? 'Updating...' : 'Refresh'}
          </Button>
          <RecalculateBalanceButton
            onSuccess={() => {
              fetchAccounts();
              toast.success('Account balances recalculated successfully');
            }}
          />
          <Button size="sm" onClick={handleAddAccount}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accounts.length} accounts
              {isUpdatingBalances && ' • Updating balances...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Accounts Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
              {Array.from(new Set(accounts.map(a => a.type))).map(type => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {getAccountTypeIcon(type)}
                  {getAccountTypeLabel(type)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
          <CardDescription>
            Manage your financial accounts and track balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getAccountTypeIcon(account.type)}
                        {account.name}
                        {account.number && (
                          <span className="text-xs text-muted-foreground">
                            {account.number}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getAccountTypeLabel(account.type)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={
                          account.type === 'credit'
                            ? ((account.currentBalance || account.balance) > 0 ? 'text-red-600' : 'text-green-600')
                            : ((account.currentBalance || account.balance) >= 0 ? 'text-green-600' : 'text-red-600')
                        }>
                          {formatCurrency(account.currentBalance || account.balance)} {account.currency !== 'USD' && account.currency}
                        </div>
                        {account.currentBalance !== account.initialBalance && (
                          <div className="text-xs text-muted-foreground">
                            Initial: {formatCurrency(account.initialBalance || account.balance)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{account.institutionName || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {account.description || '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                toast.loading('Recalculating balance...');
                                const response = await fetch('/api/finance/accounts/recalculate', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ accountId: account.id }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to recalculate balance');
                                }

                                toast.dismiss();
                                toast.success('Balance recalculated successfully');
                                fetchAccounts();
                              } catch (error) {
                                toast.dismiss();
                                toast.error('Failed to recalculate balance');
                                console.error('Error recalculating balance:', error);
                              }
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Recalculate Balance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteAccount(account.id)}
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
          </div>
        </CardContent>
      </Card>

      <AccountDialog
        account={selectedAccount}
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onSuccess={handleAccountSuccess}
      />
    </div>
  );
}