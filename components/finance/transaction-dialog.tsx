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
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Check, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Transaction schema
const transactionSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  accountId: z.string().optional(),
  account: z.string().min(1, "Account is required"),
  reference: z.string().optional(),
  status: z.enum(["pending", "completed", "failed"]).default("completed"),
  recurring: z.boolean().default(false),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Default categories
const defaultCategories = {
  expense: [
    { id: "utilities", name: "Utilities", color: "#06B6D4", icon: "🔌" },
    { id: "rent", name: "Rent", color: "#8B5CF6", icon: "🏠" },
    { id: "salary", name: "Salary", color: "#10B981", icon: "💼" },
    { id: "supplies", name: "Supplies", color: "#F59E0B", icon: "🛒" },
    { id: "software", name: "Software", color: "#3B82F6", icon: "💻" },
    { id: "food", name: "Food & Dining", color: "#EF4444", icon: "🍔" },
    { id: "transportation", name: "Transportation", color: "#F97316", icon: "🚗" },
    { id: "healthcare", name: "Healthcare", color: "#EC4899", icon: "🏥" },
  ],
  income: [
    { id: "sales", name: "Sales", color: "#10B981", icon: "💰" },
    { id: "consulting", name: "Consulting", color: "#3B82F6", icon: "💼" },
    { id: "investment", name: "Investment", color: "#8B5CF6", icon: "📈" },
    { id: "salary", name: "Salary", color: "#10B981", icon: "💸" },
    { id: "other", name: "Other", color: "#6B7280", icon: "" },
  ],
};

// Default accounts
const defaultAccounts = [
  { id: "bank", name: "Bank Account" },
  { id: "cash", name: "Cash" },
  { id: "credit", name: "Credit Card" },
];

interface TransactionDialogProps {
  transaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: TransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Initialize form with default values or existing transaction values
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          date: new Date(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type as "income" | "expense",
          category: transaction.category,
          account: transaction.account,
          reference: transaction.reference || "",
          status: transaction.status as "pending" | "completed" | "failed",
          recurring: false,
          notes: "",
        }
      : {
          date: new Date(),
          description: "",
          amount: 0,
          type: "expense",
          category: "",
          account: "",
          reference: "",
          status: "completed",
          recurring: false,
          notes: "",
        },
  });

  // Watch transaction type to load relevant categories
  const transactionType = form.watch("type");

  // Fetch categories and accounts when component mounts or type changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/finance/categories?type=${transactionType}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          // Fallback to default categories
          setCategories(defaultCategories[transactionType]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(defaultCategories[transactionType]);
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/finance/accounts');
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        } else {
          // Fallback to default accounts
          setAccounts(defaultAccounts);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
        setAccounts(defaultAccounts);
      }
    };

    fetchCategories();
    fetchAccounts();
  }, [transactionType]);

  // Handle form submission
  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);

    try {
      // Format the date
      const formattedValues = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
      };

      // Set the endpoint based on whether we're editing or creating
      const url = transaction?.id
        ? `/api/finance/transactions?id=${transaction.id}`
        : '/api/finance/transactions';

      const method = transaction?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transaction');
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast.error(error.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      // Generate a random color from our predefined palette
      const predefinedColors = [
        '#EF4444', // Red
        '#F97316', // Orange
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6B7280', // Gray
      ];

      const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];

      // Find a suitable icon based on the category name
      let icon = '';
      const categoryNameLower = newCategoryName.toLowerCase();

      // Simple keyword matching for common categories
      if (categoryNameLower.includes('food') || categoryNameLower.includes('dining') || categoryNameLower.includes('restaurant')) {
        icon = '🍔';
      } else if (categoryNameLower.includes('home') || categoryNameLower.includes('rent') || categoryNameLower.includes('mortgage')) {
        icon = '🏠';
      } else if (categoryNameLower.includes('car') || categoryNameLower.includes('transport') || categoryNameLower.includes('gas')) {
        icon = '🚗';
      } else if (categoryNameLower.includes('health') || categoryNameLower.includes('medical') || categoryNameLower.includes('doctor')) {
        icon = '🏥';
      } else if (categoryNameLower.includes('salary') || categoryNameLower.includes('income') || categoryNameLower.includes('wage')) {
        icon = '💸';
      } else if (categoryNameLower.includes('invest') || categoryNameLower.includes('stock') || categoryNameLower.includes('dividend')) {
        icon = '📈';
      } else if (categoryNameLower.includes('bill') || categoryNameLower.includes('utility') || categoryNameLower.includes('electric')) {
        icon = '🧾';
      } else if (categoryNameLower.includes('shop') || categoryNameLower.includes('store') || categoryNameLower.includes('purchase')) {
        icon = '🛒';
      }

      const response = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          type: transactionType,
          color: randomColor,
          icon: icon,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const newCategory = await response.json();

      // Add the new category to the list
      setCategories([...categories, newCategory]);

      // Set the form value
      form.setValue('category', newCategory.name);
      form.setValue('categoryId', newCategory.id);

      // Reset new category UI
      setNewCategoryName("");
      setShowNewCategory(false);

      toast.success('Category created successfully');
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error('Failed to create category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the details of your financial transaction."
              : "Enter the details of your financial transaction."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date field */}
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
                          variant={"outline"}
                          className="pl-3 text-left font-normal"
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

            {/* Transaction type */}
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

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Office supplies purchase"
                      {...field}
                    />
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
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {showNewCategory ? (
                    <div className="flex space-x-2">
                      <Input
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex space-x-2">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="max-h-[200px] overflow-y-auto">
                              {categories
                                .filter(category => category.name && category.name.trim() !== '')
                                .map((category) => (
                                <SelectItem
                                  key={category.id || category.name}
                                  value={category.name || `category-${category.id}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {category.icon ? (
                                      <span className="text-lg">{category.icon}</span>
                                    ) : category.color ? (
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                                    )}
                                    {category.name || `Category ${category.id}`}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewCategory(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts
                        .filter(account => account.name && account.name.trim() !== '')
                        .map((account) => (
                        <SelectItem
                          key={account.id || account.name}
                          value={account.name || `account-${account.id}`}
                        >
                          {account.name || `Account ${account.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Invoice #123"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Invoice number, receipt number, etc.
                  </FormDescription>
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring */}
            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Transaction
                    </FormLabel>
                    <FormDescription>
                      Mark if this is a recurring transaction
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {transaction ? "Update" : "Save"} Transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}