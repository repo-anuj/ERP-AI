'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define default categories if none exist
const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Personal Care',
  'Education',
  'Travel',
  'Gifts & Donations',
  'Business',
  'Taxes',
  'Other'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Rental Income',
  'Sale',
  'Refund',
  'Other'
];

const DEFAULT_ACCOUNTS = [
  'Cash',
  'Checking Account',
  'Savings Account',
  'Credit Card',
  'Digital Wallet',
  'Other'
];

// Form schema for validation
const formSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  account: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().default(false),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  transaction?: any; // The transaction to edit (optional)
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Initialize the form with default values or existing transaction data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction ? {
      date: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account || '',
      reference: transaction.reference || '',
      notes: transaction.notes || '',
      recurring: transaction.recurring || false,
      status: transaction.status || 'completed',
    } : {
      date: new Date(),
      description: '',
      amount: undefined,
      type: 'expense',
      category: '',
      account: '',
      reference: '',
      notes: '',
      recurring: false,
      status: 'completed',
    },
  });
  
  const watchType = form.watch('type');
  
  // Fetch categories on mount and when type changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/finance/categories?type=${watchType}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch categories');
          // Use default categories if API fails
          setCategories(
            watchType === 'income' 
              ? DEFAULT_INCOME_CATEGORIES.map(name => ({ id: name, name }))
              : DEFAULT_EXPENSE_CATEGORIES.map(name => ({ id: name, name }))
          );
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use default categories if API fails
        setCategories(
          watchType === 'income' 
            ? DEFAULT_INCOME_CATEGORIES.map(name => ({ id: name, name }))
            : DEFAULT_EXPENSE_CATEGORIES.map(name => ({ id: name, name }))
        );
      }
    };

    fetchCategories();
  }, [watchType]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      const url = transaction 
        ? `/api/finance/transactions?id=${transaction.id}`
        : '/api/finance/transactions';
      
      const method = transaction ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction ? { id: transaction.id, ...values } : values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save transaction');
      }
      
      toast({
        title: transaction ? 'Transaction updated' : 'Transaction added',
        description: transaction 
          ? 'Your transaction has been updated successfully.'
          : 'Your new transaction has been added successfully.',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save transaction',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    
    try {
      const response = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          type: watchType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }
      
      const newCategory = await response.json();
      
      setCategories(prev => [...prev, newCategory]);
      form.setValue('category', newCategory.name);
      setNewCategoryName('');
      
      toast({
        title: 'Category created',
        description: `The category "${newCategory.name}" has been created.`,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create category',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Grocery shopping" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-7" 
                      step="0.01"
                      min="0"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                        .filter(category => category && category.name && category.name.trim() !== '')
                        .map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.name || `category-${category.id}`}
                        >
                          {category.name || `Category ${category.id}`}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new">+ Add new category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {field.value === '__new' && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      disabled={isCreatingCategory}
                    />
                    <Button 
                      type="button" 
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : 'Add'}
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="account"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEFAULT_ACCOUNTS
                      .filter(account => account && account.trim() !== '')
                      .map((account) => (
                        <SelectItem key={account} value={account || `account-${account}`}>
                          {account}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Invoice #123" {...field} />
                </FormControl>
                <FormDescription>
                  Invoice number, receipt number, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Recurring Transaction</FormLabel>
                  <FormDescription>
                    Mark this as a recurring transaction
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional details or notes..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {transaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
