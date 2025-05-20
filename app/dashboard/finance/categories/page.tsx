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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PlusIcon, MoreHorizontal, Edit, Trash, Tag, RefreshCw } from 'lucide-react';
import { CategoryDialog } from '@/components/finance/category-dialog';
import { Input } from '@/components/ui/input';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  limit?: number;
  color?: string;
  icon?: string;
  transactionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories on page load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from the API
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/finance/categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();

      // Fetch transaction counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category: Category) => {
          const countResponse = await fetch(`/api/finance/transactions/count?categoryId=${category.id}`);
          if (countResponse.ok) {
            const { count } = await countResponse.json();
            return { ...category, transactionCount: count };
          }
          return { ...category, transactionCount: 0 };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new category
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  // Handle editing a category
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  // Handle deleting a category
  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete category'
      );
    }
  };

  // Filter categories based on active tab and search query
  const filteredCategories = categories.filter(category => {
    // Apply tab filter
    if (activeTab !== 'all' && category.type !== activeTab) {
      return false;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return category.name.toLowerCase().includes(query);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddCategory}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage your transaction categories for better financial organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Tag className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No categories found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Create your first category to organize your transactions'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddCategory}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Budget Limit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {category.icon ? (
                              <span className="text-lg">{category.icon}</span>
                            ) : (
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color || '#888888' }}
                              />
                            )}
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={category.type === 'income' ? 'success' : 'destructive'}
                          >
                            {category.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {category.color ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {category.color.toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Default</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {category.transactionCount !== undefined ? category.transactionCount : 0}
                        </TableCell>
                        <TableCell>
                          {category.limit
                            ? `$${category.limit.toFixed(2)}`
                            : <span className="text-muted-foreground">No limit</span>
                          }
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
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600"
                                disabled={(category.transactionCount !== undefined && category.transactionCount > 0)}
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

      <CategoryDialog
        category={selectedCategory}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
