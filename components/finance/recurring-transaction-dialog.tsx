'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define default categories if none exist
const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent/Mortgage',
  'Utilities',
  'Subscriptions',
  'Insurance',
  'Loan Payment',
  'Salaries',
  'Maintenance',
  'Office Supplies',
  'Marketing',
  'Other'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Sales',
  'Services',
  'Investments',
  'Rental Income',
  'Royalties',
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

// Recurring transaction schema
const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.coerce.number().int().positive().default(1),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  accountId: z.string().optional(),
  account: z.string().min(1, 'Account is required'),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  monthOfYear: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(['active', 'paused', 'completed']).default('active'),
});

type RecurringTransactionFormValues = z.infer<typeof recurringTransactionSchema>;

interface RecurringTransactionDialogProps {
  recurringTransaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecurringTransactionDialog({
  recurringTransaction,
  open,
  onOpenChange,
  onSuccess,
}: RecurringTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Initialize form with default values or existing transaction values
  const form = useForm<RecurringTransactionFormValues>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: recurringTransaction
      ? {
          name: recurringTransaction.name,
          description: recurringTransaction.description || '',
          frequency: recurringTransaction.frequency,
          interval: recurringTransaction.interval,
          startDate: new Date(recurringTransaction.startDate),
          endDate: recurringTransaction.endDate ? new Date(recurringTransaction.endDate) : undefined,
          amount: recurringTransaction.amount,
          type: recurringTransaction.type as 'income' | 'expense',
          category: recurringTransaction.category || '',
          categoryId: recurringTransaction.categoryId || '',
          account: recurringTransaction.account || '',
          accountId: recurringTransaction.accountId || '',
          dayOfMonth: recurringTransaction.dayOfMonth || undefined,
          dayOfWeek: recurringTransaction.dayOfWeek || undefined,
          monthOfYear: recurringTransaction.monthOfYear || undefined,
          status: recurringTransaction.status || 'active',
        }
      : {
          name: '',
          description: '',
          frequency: 'monthly',
          interval: 1,
          startDate: new Date(),
          amount: 0,
          type: 'expense',
          category: '',
          account: '',
          status: 'active',
        },
  });

  const watchFrequency = form.watch('frequency');
  const watchType = form.watch('type');

  // Fetch categories and accounts when the dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchAccounts();
    }
  }, [open]);

  // Fetch categories from the API
  const fetchCategories = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch('/api/finance/categories');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        // If API fails, use default categories
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch accounts from the API
  const fetchAccounts = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch('/api/finance/accounts');
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        // If API fails, use default accounts
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: RecurringTransactionFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format dates for API
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      };
      
      // Determine if we're creating or updating
      const isUpdate = !!recurringTransaction;
      const url = isUpdate 
        ? `/api/finance/recurring?id=${recurringTransaction.id}`
        : '/api/finance/recurring';
      
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recurring transaction');
      }
      
      toast.success(
        isUpdate
          ? 'Recurring transaction updated successfully'
          : 'Recurring transaction created successfully'
      );
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save recurring transaction'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available categories based on transaction type
  const getAvailableCategories = () => {
    if (categories.length > 0) {
      return categories.filter(cat => cat.type === watchType);
    }
    
    // Use default categories if no categories from API
    return (watchType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES)
      .map(name => ({ id: name, name }));
  };

  // Get available accounts
  const getAvailableAccounts = () => {
    if (accounts.length > 0) {
      return accounts;
    }
    
    // Use default accounts if no accounts from API
    return DEFAULT_ACCOUNTS.map(name => ({ id: name, name }));
  };

  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {recurringTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
          </DialogTitle>
          <DialogDescription>
            {recurringTransaction
              ? 'Update the details of your recurring transaction'
              : 'Set up a new recurring transaction that will automatically create transactions on schedule'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Type and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
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
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this recurring transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Category and Account */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // If it's a category with an ID, set the categoryId
                        const selectedCategory = getAvailableCategories().find(
                          (cat) => cat.name === value || cat.id === value
                        );
                        if (selectedCategory && selectedCategory.id) {
                          form.setValue('categoryId', selectedCategory.id);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableCategories().map((category) => (
                          <SelectItem
                            key={category.id || category.name}
                            value={category.name}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Account */}
              <FormField
                control={form.control}
                name="account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // If it's an account with an ID, set the accountId
                        const selectedAccount = getAvailableAccounts().find(
                          (acc) => acc.name === value || acc.id === value
                        );
                        if (selectedAccount && selectedAccount.id) {
                          form.setValue('accountId', selectedAccount.id);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableAccounts().map((account) => (
                          <SelectItem
                            key={account.id || account.name}
                            value={account.name}
                          >
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Frequency Settings */}
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium">Recurrence Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Interval */}
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {watchFrequency === 'daily' && 'Every X days'}
                        {watchFrequency === 'weekly' && 'Every X weeks'}
                        {watchFrequency === 'monthly' && 'Every X months'}
                        {watchFrequency === 'yearly' && 'Every X years'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Frequency-specific settings */}
              {watchFrequency === 'weekly' && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {getDayOfWeekName(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {watchFrequency === 'monthly' && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {watchFrequency === 'yearly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthOfYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                              <SelectItem key={month} value={month.toString()}>
                                {getMonthName(month)}
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
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* End Date (Optional) */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date < form.getValues('startDate')}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave blank for indefinite recurrence
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {recurringTransaction ? 'Update' : 'Create'} Recurring Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
