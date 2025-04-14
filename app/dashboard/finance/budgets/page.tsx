'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetDialog } from '@/components/finance/budget-dialog';
import { BudgetDetails } from '@/components/finance/budget-details';
import { BudgetComparison } from '@/components/finance/budget-comparison';
import { BudgetAlerts } from '@/components/finance/budget-alerts';
import { CurrencyDisplay } from '@/components/finance/currency-display';
import { CurrencySettings } from '@/components/finance/currency-settings';

import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  RefreshCw,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart2,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  // Fetch budgets from the API
  const fetchBudgets = async () => {
    try {
      setIsLoading(true);

      // Build the query string with filters
      let queryString = '';
      if (activeTab === 'active') {
        queryString += 'active=true';
      }
      if (typeFilter && typeFilter !== 'all') {
        queryString += `${queryString ? '&' : ''}type=${typeFilter}`;
      }
      if (statusFilter && statusFilter !== 'all') {
        queryString += `${queryString ? '&' : ''}status=${statusFilter}`;
      }

      const response = await fetch(`/api/finance/budgets${queryString ? `?${queryString}` : ''}`);

      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }

      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [activeTab, typeFilter, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBudgets();
    setIsRefreshing(false);
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setDialogOpen(true);
  };

  const handleEditBudget = (budget: any) => {
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleViewBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/budgets?id=${budgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      toast.success('Budget deleted successfully');
      fetchBudgets();

      // If the deleted budget was being viewed, go back to the list
      if (selectedBudgetId === budgetId) {
        setSelectedBudgetId(null);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const handleDialogSuccess = () => {
    fetchBudgets();
  };

  const filteredBudgets = budgets.filter((budget) => {
    if (searchQuery) {
      return budget.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

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

  const getBudgetTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'annual':
        return 'Annual';
      case 'project':
        return 'Project';
      default:
        return type;
    }
  };

  const getProgressColor = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 90) return 'bg-warning';
    return 'bg-primary';
  };

  const getStatusIcon = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return <XCircle className="h-4 w-4 text-destructive" />;
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
          </div>
        </div>

        {selectedBudgetId ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedBudgetId(null)}>
              ← Back to Budgets
            </Button>
            <BudgetDetails
              budgetId={selectedBudgetId}
              onEdit={() => {
                const budget = budgets.find(b => b.id === selectedBudgetId);
                if (budget) {
                  handleEditBudget(budget);
                }
              }}
            />
          </div>
        ) : (
          <>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Budgets</TabsTrigger>
                  <TabsTrigger value="active">Active Budgets</TabsTrigger>
                </TabsList>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search budgets..."
                      className="pl-8 w-[200px] md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Budget Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredBudgets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      <div className="rounded-full bg-primary/10 p-6">
                        <DollarSign className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-center">No Budgets Found</h3>
                      <p className="text-center text-muted-foreground max-w-md">
                        You haven't created any budgets yet. Click the "Create Budget" button to get started.
                      </p>
                      <Button onClick={handleCreateBudget}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Spent</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBudgets.map((budget) => {
                          const spentPercentage = budget.totalSpent > 0
                            ? (budget.totalSpent / budget.totalBudget) * 100
                            : 0;

                          return (
                            <TableRow key={budget.id}>
                              <TableCell className="font-medium">{budget.name}</TableCell>
                              <TableCell>{getBudgetTypeLabel(budget.type)}</TableCell>
                              <TableCell>
                                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                              </TableCell>
                              <TableCell>{getBudgetStatusBadge(budget.status)}</TableCell>
                              <TableCell>
                                <CurrencyDisplay value={budget.totalBudget} showOriginal={false} />
                              </TableCell>
                              <TableCell>
                                <CurrencyDisplay value={budget.totalSpent} showOriginal={false} />
                              </TableCell>
                              <TableCell className="w-[180px]">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(budget.totalSpent, budget.totalBudget)}
                                  <Progress
                                    value={spentPercentage}
                                    className={`h-2 ${getProgressColor(budget.totalSpent, budget.totalBudget)}`}
                                  />
                                  <span className="text-xs w-12 text-right">
                                    {spentPercentage.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewBudget(budget.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredBudgets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      <div className="rounded-full bg-primary/10 p-6">
                        <Calendar className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-center">No Active Budgets</h3>
                      <p className="text-center text-muted-foreground max-w-md">
                        You don't have any active budgets for the current period.
                      </p>
                      <Button onClick={handleCreateBudget}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Budget
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Spent</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBudgets.map((budget) => {
                          const spentPercentage = budget.totalSpent > 0
                            ? (budget.totalSpent / budget.totalBudget) * 100
                            : 0;

                          return (
                            <TableRow key={budget.id}>
                              <TableCell className="font-medium">{budget.name}</TableCell>
                              <TableCell>{getBudgetTypeLabel(budget.type)}</TableCell>
                              <TableCell>
                                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                              </TableCell>
                              <TableCell>{getBudgetStatusBadge(budget.status)}</TableCell>
                              <TableCell>
                                <CurrencyDisplay value={budget.totalBudget} showOriginal={false} />
                              </TableCell>
                              <TableCell>
                                <CurrencyDisplay value={budget.totalSpent} showOriginal={false} />
                              </TableCell>
                              <TableCell className="w-[180px]">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(budget.totalSpent, budget.totalBudget)}
                                  <Progress
                                    value={spentPercentage}
                                    className={`h-2 ${getProgressColor(budget.totalSpent, budget.totalBudget)}`}
                                  />
                                  <span className="text-xs w-12 text-right">
                                    {spentPercentage.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewBudget(budget.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Currency Settings */}
            <div className="space-y-6 mt-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Budget Analysis</h3>
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
                    {budgets.length > 0 ? (
                      <BudgetComparison budgetId={budgets[0].id} />
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                          <div className="rounded-full bg-primary/10 p-6">
                            <BarChart2 className="h-10 w-10 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-center">No Budget Data Available</h3>
                          <p className="text-center text-muted-foreground max-w-md">
                            Create a budget to see budget vs. actual comparison data.
                          </p>
                          <Button onClick={handleCreateBudget}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Budget
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  <TabsContent value="alerts">
                    <BudgetAlerts threshold={90} />
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Currency Settings</h3>
                <CurrencySettings />
              </div>
            </div>
          </>
        )}

        <BudgetDialog
          budget={selectedBudget}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleDialogSuccess}
        />
      </div>
  );
}