'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { TransactionDialog } from '@/components/finance/transaction-dialog';
import { TransactionsTable } from '@/components/finance/transactions-table';
import { EmptyState } from '@/components/finance/empty-state';
import { Button } from '@/components/ui/button';
import { PlusIcon, ArrowDownIcon, ArrowUpIcon, RefreshCw, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AccountDialog } from '@/components/finance/account-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  reference?: string;
  status: string;
  sourceType?: 'sales' | 'inventory';
  originalData?: any;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  initialBalance?: number;
  currentBalance?: number;
}

export default function FinancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    pendingIncome: 0,
    pendingExpenses: 0
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  
  // Filter, search and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  // Effect to fetch transactions only after accounts are loaded
  useEffect(() => {
    if (hasAccounts) {
      fetchTransactions();
      fetchSalesData();
      fetchInventoryData();
    }
  }, [hasAccounts]);

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
        setHasAccounts(accountsWithInitialBalance.length > 0);
      } else {
        toast.error('Failed to fetch accounts');
        setHasAccounts(false);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to fetch accounts');
      setHasAccounts(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions from the API
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/finance/transactions');
      
      if (response.ok) {
        const data = await response.json();
        
        // Map API data to match our expected format, ensuring category is a string
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
        calculateStats(mappedTransactions);
        
        // Extract categories and statuses for filtering
        const uniqueCategories = Array.from(new Set(mappedTransactions.map(t => t.category))).filter(Boolean);
        const uniqueStatuses = Array.from(new Set(mappedTransactions.map(t => t.status))).filter(Boolean);
        setAvailableCategories(uniqueCategories as string[]);
        setAvailableStatuses(uniqueStatuses as string[]);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sales data and convert to income transactions
  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales');
      
      if (response.ok) {
        const salesResponse = await response.json();
        
        if (!salesResponse.data || !Array.isArray(salesResponse.data)) {
          console.error('Invalid sales data format');
          return;
        }
        
        // Map sales data to transactions
        const salesTransactions: Transaction[] = salesResponse.data.map((sale: any) => ({
          id: `sales-${sale.id}`,
          date: sale.date,
          description: `Sale to ${sale.customer?.name || 'Customer'}`,
          amount: sale.total,
          type: 'income',
          category: 'Sales Revenue',
          account: 'Sales Account',
          reference: sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`,
          status: sale.status === 'paid' ? 'completed' : (sale.status || 'pending'),
          sourceType: 'sales',
          originalData: sale
        }));
        
        // Add to transactions array
        setTransactions(prev => {
          // Filter out any existing sales transactions to avoid duplicates
          const filtered = prev.filter(t => !t.id.startsWith('sales-'));
          return [...filtered, ...salesTransactions];
        });
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      // Recalculate stats with updated transactions
      setTransactions(current => {
        calculateStats(current);
        return current;
      });
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
          return [...filtered, ...inventoryTransactions];
        });
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      // Recalculate stats with updated transactions
      setTransactions(current => {
        calculateStats(current);
        return current;
      });
    }
  };

  // Calculate financial statistics and update account balances
  const calculateStats = (transactionsList: Transaction[]) => {
    const completedTransactions = transactionsList.filter(
      t => t.status === 'completed'
    );
    const pendingTransactions = transactionsList.filter(
      t => t.status === 'pending'
    );
    
    const totalIncome = completedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = completedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingIncome = pendingTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingExpenses = pendingTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setStats({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pendingIncome,
      pendingExpenses
    });

    // Update account balances based on transactions
    updateAccountBalances(completedTransactions);
  };

  // Update account balances based on completed transactions
  const updateAccountBalances = (completedTransactions: Transaction[]) => {
    // Create a copy of accounts
    const updatedAccounts = [...accounts];
    
    // Reset all account balances to their initial values
    updatedAccounts.forEach(account => {
      account.currentBalance = account.initialBalance || 0;
    });
    
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
  };

  // Handle adding a new transaction
  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setTransactionDialogOpen(true);
  };

  // Handle creating a new account
  const handleAddAccount = () => {
    setAccountDialogOpen(true);
  };

  // Handle editing a transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDialogOpen(true);
  };

  // Handle duplicating a transaction
  const handleDuplicateTransaction = (transaction: Transaction) => {
    const duplicatedTransaction = {
      ...transaction,
      id: 'temp-' + Date.now(), // Temporary ID that will be replaced by the server
      date: new Date().toISOString().split('T')[0], // Set to today
      description: `Copy of ${transaction.description}`
    };
    setSelectedTransaction(duplicatedTransaction);
    setTransactionDialogOpen(true);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = async (id: string) => {
    // Don't delete sales or inventory transactions
    if (id.startsWith('sales-') || id.startsWith('inventory-')) {
      toast.error('Cannot delete integrated transactions from this view');
      return;
    }
    
    try {
      const response = await fetch(`/api/finance/transactions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
        toast.success('Transaction deleted successfully');
        calculateStats(transactions.filter(t => t.id !== id));
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // Handle viewing original transaction
  const handleViewOriginal = (transaction: Transaction) => {
    if (transaction.sourceType === 'sales') {
      window.location.href = `/dashboard/sales/invoices/${transaction.id.replace('sales-', '')}`;
    } else if (transaction.sourceType === 'inventory') {
      window.location.href = `/dashboard/inventory/purchases/${transaction.id.replace('inventory-', '')}`;
    }
  };

  // Handle transaction form submission success
  const handleTransactionSuccess = () => {
    setTransactionDialogOpen(false);
    fetchTransactions();
    toast.success('Transaction saved successfully');
  };

  // Handle account form submission success
  const handleAccountSuccess = () => {
    setAccountDialogOpen(false);
    fetchAccounts();
    toast.success('Account saved successfully');
  };

  // Filter transactions based on all criteria
  const filteredTransactions = transactions.filter(transaction => {
    // Apply type filter (tab filter)
    if (activeFilterTab !== 'all' && transaction.type !== activeFilterTab) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const descriptionMatch = transaction.description.toLowerCase().includes(query);
      const categoryMatch = transaction.category.toLowerCase().includes(query);
      const accountMatch = transaction.account.toLowerCase().includes(query);
      const referenceMatch = transaction.reference ? transaction.reference.toLowerCase().includes(query) : false;
      
      if (!descriptionMatch && !categoryMatch && !accountMatch && !referenceMatch) {
        return false;
      }
    }
    
    // Apply category filter
    if (selectedCategory && transaction.category !== selectedCategory) {
      return false;
    }
    
    // Apply status filter
    if (selectedStatus && transaction.status.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }
    
    return true;
  });
  
  // Get current page of transactions
  const indexOfLastTransaction = currentPage * itemsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setCurrentPage(1);
  };
  
  // Apply filters and sync with ative tabs
  useEffect(() => {
    // Make sure we reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, activeFilterTab]);

  useEffect(() => {
    setActiveFilterTab(activeTab);
  }, [activeTab]);

  // Show loading state
  if (isLoading && !hasAccounts) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // No accounts state
  if (!hasAccounts) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Finance Dashboard</CardTitle>
            <CardDescription>
              To get started with your finances, you need to create at least one account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-xl font-medium">No Financial Accounts</h3>
              <p className="text-muted-foreground">
                Create your first bank, cash, or credit account to track your transactions.
              </p>
            </div>
            <Button size="lg" onClick={handleAddAccount}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </CardContent>
        </Card>
        
        <AccountDialog
          account={null}
          open={accountDialogOpen}
          onOpenChange={setAccountDialogOpen}
          onSuccess={handleAccountSuccess}
        />
      </div>
    );
  }

  // Show empty state if no transactions
  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleAddAccount}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Account
            </Button>
            <Button onClick={handleAddTransaction}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>
        
        <EmptyState onAddTransaction={handleAddTransaction} />
        
        <TransactionDialog
          transaction={selectedTransaction}
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          onSuccess={handleTransactionSuccess}
        />
        
        <AccountDialog
          account={null}
          open={accountDialogOpen}
          onOpenChange={setAccountDialogOpen}
          onSuccess={handleAccountSuccess}
        />
      </div>
    );
  }

  // Main dashboard with data
  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Finance Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              fetchTransactions();
              fetchSalesData();
              fetchInventoryData();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddAccount}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button size="sm" onClick={handleAddTransaction}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance across all accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Income
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingIncome)} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingExpenses)} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length}
            </div>
            <div className="mt-2 space-y-2 max-h-24 overflow-y-auto">
              {accounts && accounts.length > 0 ? accounts.map(account => (
                <div key={account.id} className="flex justify-between text-xs">
                  <span className="truncate mr-2">{account.name}</span>
                  <span className={account.currentBalance! >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(account.currentBalance || 0)}
                  </span>
                </div>
              )) : 'No accounts'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter and search bar */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search descriptions, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Category filter */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories
                    .filter(category => category && category.trim() !== '')
                    .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status filter */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {availableStatuses
                    .filter(status => status && status.trim() !== '')
                    .map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear filters button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleClearFilters}
              className="whitespace-nowrap h-10 w-10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            View and manage your financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-96" />
              ) : (
                <>
                  <TransactionsTable
                    transactions={currentTransactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onDuplicate={handleDuplicateTransaction}
                    onViewOriginal={handleViewOriginal}
                  />
                  
                  {/* Pagination */}
                  {filteredTransactions.length > 0 && (
                    <div className="flex justify-between items-center mt-4 px-2">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}-
                        {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length} transactions
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Previous</span>
                        </Button>
                        
                        <div className="text-sm">
                          Page {currentPage} of {totalPages}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Next</span>
                        </Button>
                        
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="10 per page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 per page</SelectItem>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="20">20 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <TransactionDialog
        transaction={selectedTransaction}
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onSuccess={handleTransactionSuccess}
      />
      
      <AccountDialog
        account={null}
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onSuccess={handleAccountSuccess}
      />
    </div>
  );
} 