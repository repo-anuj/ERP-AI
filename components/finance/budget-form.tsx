'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Plus, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/currency-context';

// Form schema for validation
const budgetFormSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  description: z.string().optional(),
  type: z.enum(['annual', 'monthly', 'quarterly', 'project']),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
  items: z.array(
    z.object({
      id: z.string().optional(), // Add ID field for existing items
      categoryId: z.union([
        z.string(),
        z.literal('none'),
        z.literal(null),
        z.undefined()
      ]),
      name: z.string().min(1, 'Item name is required'),
      amount: z.number().positive('Amount must be positive'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one budget item is required'),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  budget?: any; // The budget to edit (optional)
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { defaultCurrency } = useCurrency();

  // Fetch budget categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/finance/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load budget categories');
      }
    };

    fetchCategories();
  }, []);

  // Initialize the form with default values or existing budget data
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: budget
      ? {
          name: budget.name,
          description: budget.description || '',
          type: budget.type,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          status: budget.status,
          items: budget.items.map((item: any) => ({
            id: item.id, // Include the item ID
            categoryId: item.categoryId || undefined,
            name: item.name,
            amount: item.amount,
            notes: item.notes || '',
          })),
        }
      : {
          name: '',
          description: '',
          type: 'monthly',
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          status: 'active',
          items: [
            {
              categoryId: undefined,
              name: '',
              amount: 0,
              notes: '',
            },
          ],
        },
  });

  // Calculate total budget amount
  const calculateTotal = () => {
    const items = form.watch('items');
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Add a new budget item
  const addBudgetItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [
      ...items,
      {
        categoryId: undefined,
        name: '',
        amount: 0,
        notes: '',
      },
    ]);
  };

  // Remove a budget item
  const removeBudgetItem = (index: number) => {
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue(
        'items',
        items.filter((_, i) => i !== index)
      );
    } else {
      toast.error('Budget must have at least one item');
    }
  };

  // Handle form submission
  const onSubmit = async (values: BudgetFormValues) => {
    setIsSubmitting(true);

    try {
      // Format dates as ISO strings and handle special values
      const formattedValues = {
        ...values,
        // Make sure to include the ID if we're updating
        ...(budget?.id && { id: budget.id }),
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        totalBudget: calculateTotal(),
        // Process items to handle empty/none categoryId values
        items: values.items.map(item => ({
          ...item,
          // Include the item ID if it exists
          ...(item.id && { id: item.id }),
          categoryId: item.categoryId === 'none' || item.categoryId === 'empty' ? null : item.categoryId,
        })),
      };

      // Determine if we're creating or updating
      let url = '/api/finance/budgets';
      let method = 'POST';

      if (budget?.id) {
        url = `/api/finance/budgets?id=${budget.id}`;
        method = 'PUT';
        // Make sure the ID is included in the URL and the body
        console.log('Updating budget with ID:', budget.id);
      }

      // Log the data being sent
      console.log('Sending budget data:', JSON.stringify(formattedValues, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Budget validation error:', errorData);
        throw new Error(errorData.error || 'Failed to save budget');
      }

      toast.success(
        budget?.id ? 'Budget updated successfully' : 'Budget created successfully'
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter budget name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter budget description"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Budget Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Budget Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBudgetItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {form.watch('items').map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 p-4 border rounded-md"
            >
              <div className="col-span-12 md:col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.categoryId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories
                            .filter((cat) => cat.type === 'expense')
                            .map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id}
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
              </div>

              <div className="col-span-12 md:col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ({defaultCurrency}) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBudgetItem(index)}
                  disabled={form.watch('items').length <= 1}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end p-4 border-t">
            <div className="text-lg font-medium">
              Total Budget: {defaultCurrency}{' '}
              {calculateTotal().toFixed(2)}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {budget?.id ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{budget?.id ? 'Update Budget' : 'Create Budget'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
