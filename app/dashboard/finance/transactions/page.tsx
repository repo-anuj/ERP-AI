'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RefreshCw, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionsTable } from '@/components/finance/transactions-table';
import { TransactionDialog } from '@/components/finance/transaction-dialog';
import { EmptyState } from '@/components/finance/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
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

// Define transaction type
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

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Fetch transaction data from API
  const fetchTransactionData = async () => {
    setLoading(true);
    try {
      // Fetch regular transactions
      const transactionResponse = await fetch('/api/finance/transactions');
      let mappedTransactions = [];
      
      if (transactionResponse.ok) {
        const data = await transactionResponse.json();
        
        // Map API data to match our expected format
        mappedTransactions = data.map((transaction: any) => ({
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category?.name || (typeof transaction.category === 'string' ? transaction.category : 'Other'),
          account: transaction.account?.name || (typeof transaction.account === 'string' ? transaction.account : 'Default Account'),
          reference: transaction.reference,
          status: transaction.status,
        }));
      } else {
        console.error('Failed to fetch transactions');
      }
      
      // Fetch sales data
      let salesTransactions: Transaction[] = [];
      try {
        const salesResponse = await fetch('/api/sales');
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          if (salesData && salesData.data && Array.isArray(salesData.data)) {
            salesTransactions = salesData.data.map((sale: any) => ({
              id: `sales-${sale.id}`,
              date: sale.date,
              description: `Sale: ${sale.customer?.name || 'Customer'}`,
              amount: sale.total,
              type: 'income' as 'income',
              category: 'Sales Revenue',
              account: 'Sales Account',
              reference: sale.invoiceNumber || `INV-${sale.id.substring(0, 8)}`,
              status: sale.status === 'paid' ? 'completed' : (sale.status || 'pending'),
              sourceType: 'sales' as 'sales',
              originalData: sale // Store original data for potential use
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
      
      // Fetch inventory purchases data
      let inventoryTransactions: Transaction[] = [];
      try {
        const inventoryResponse = await fetch('/api/inventory/purchases');
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          if (inventoryData && Array.isArray(inventoryData)) {
            inventoryTransactions = inventoryData.map((purchase: any) => ({
              id: `inventory-${purchase.id}`,
              date: purchase.date,
              description: `Inventory: ${purchase.itemName || 'Inventory item'}`,
              amount: purchase.totalCost,
              type: 'expense' as 'expense',
              category: 'Inventory Purchase',
              account: 'Inventory Account',
              reference: purchase.purchaseOrder || purchase.reference || `PO-${purchase.id.substring(0, 8)}`,
              status: purchase.status === 'paid' ? 'completed' : (purchase.status || 'pending'),
              sourceType: 'inventory' as 'inventory',
              originalData: purchase // Store original data for potential use
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      }
      
      // Combine all transactions
      const allTransactions = [...mappedTransactions, ...salesTransactions, ...inventoryTransactions];
      
      // Sort transactions by date (newest first)
      allTransactions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setTransactions(allTransactions);
      
      // Extract unique categories and statuses for filters
      const uniqueCategories = Array.from(new Set(allTransactions.map(t => t.category))).filter(Boolean);
      const uniqueStatuses = Array.from(new Set(allTransactions.map(t => t.status))).filter(Boolean);
      
      setCategories(uniqueCategories as string[]);
      setStatuses(uniqueStatuses as string[]);
      
      // Calculate summary stats
      const income = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
      });

      // Apply initial filters
      applyFilters(allTransactions);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      toast.error('Failed to load transactions');
      // Set empty transactions but don't fail completely
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/finance/categories');
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueCategories = Array.from(new Set(data.map(c => c.name))).filter(Boolean);
          setCategories(uniqueCategories as string[]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Apply all filters and pagination
  const applyFilters = (transactionsToFilter = transactions) => {
    // Apply tab filter
    let filtered = transactionsToFilter;
    if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.type === activeTab);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.account.toLowerCase().includes(query) ||
        (t.reference && t.reference.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(t => t.status.toLowerCase() === selectedStatus.toLowerCase());
    }
    
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    
    // If current page is now beyond total pages, adjust it
    if (currentPage > Math.max(1, Math.ceil(filtered.length / itemsPerPage))) {
      setCurrentPage(1);
    }
    
    // Store the filtered results
    setFilteredTransactions(filtered);
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchTransactionData();
    fetchCategories();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [activeTab, searchQuery, selectedCategory, selectedStatus, transactions]);

  const handleRefresh = () => {
    fetchTransactionData();
    toast.success('Transactions refreshed');
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/transactions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }
      
      // Update local state
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      toast.success('Transaction deleted successfully');
      
      // Re-calculate stats
      const income = updatedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = updatedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        netIncome: income - expenses,
      });
      
      // Re-apply filters
      applyFilters(updatedTransactions);
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const handleDuplicateTransaction = (transaction: Transaction) => {
    const duplicatedTransaction = {
      ...transaction,
      id: `temp-${Date.now()}`, // Temporary ID that will be replaced by the server
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    
    // Open the dialog with the duplicated transaction
    setEditingTransaction(duplicatedTransaction);
    setDialogOpen(true);
  };

  const handleTransactionSuccess = () => {
    // Close the dialog and refresh data
    setDialogOpen(false);
    fetchTransactionData();
    toast.success('Transaction saved successfully');
  };

  // Get paginated transactions
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Add function to navigate to original records
  const handleViewOriginal = (transaction: Transaction) => {
    if (transaction.sourceType === 'sales') {
      window.location.href = `/dashboard/sales/invoices/${transaction.id.replace('sales-', '')}`;
    } else if (transaction.sourceType === 'inventory') {
      window.location.href = `/dashboard/inventory/purchases/${transaction.id.replace('inventory-', '')}`;
    }
  }

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xl">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddTransaction}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(Math.abs(stats.netIncome))}
              {stats.netIncome < 0 && ' loss'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
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
                  {categories
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
                  {statuses
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
              onClick={handleClearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredTransactions.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <TransactionsTable
                  transactions={paginatedTransactions}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onDuplicate={handleDuplicateTransaction}
                  onViewOriginal={handleViewOriginal}
                />
              </CardContent>
              
              {/* Pagination */}
              <CardFooter className="flex items-center justify-between border-t p-4">
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
                    <span className="sr-only">Previous Page</span>
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
                    <span className="sr-only">Next Page</span>
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
              </CardFooter>
            </Card>
          ) : (
            <EmptyState onAddTransaction={handleAddTransaction} />
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <TransactionDialog
        transaction={editingTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
} 