'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Category schema for validation
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  limit: z.coerce.number().min(0).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Predefined colors for easy selection
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
  '#000000', // Black
];

// Common icons for categories
const commonIcons = [
  { value: '🏠', label: 'Home' },
  { value: '🚗', label: 'Car' },
  { value: '🍔', label: 'Food' },
  { value: '💼', label: 'Work' },
  { value: '💰', label: 'Money' },
  { value: '🛒', label: 'Shopping' },
  { value: '🏥', label: 'Healthcare' },
  { value: '✈️', label: 'Travel' },
  { value: '📚', label: 'Education' },
  { value: '🎮', label: 'Entertainment' },
  { value: '💻', label: 'Technology' },
  { value: '🧾', label: 'Bills' },
  { value: '📱', label: 'Phone' },
  { value: '🔌', label: 'Utilities' },
  { value: '🎁', label: 'Gifts' },
  { value: '💸', label: 'Salary' },
  { value: '📈', label: 'Investments' },
  { value: '🏦', label: 'Banking' },
];

interface CategoryDialogProps {
  category: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customColor, setCustomColor] = useState('');

  // Initialize form with default values or existing category values
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          type: category.type,
          limit: category.limit || undefined,
          color: category.color || '',
          icon: category.icon || '',
        }
      : {
          name: '',
          type: 'expense',
          limit: undefined,
          color: '#6B7280', // Default gray
          icon: '',
        },
  });

  // Handle form submission
  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Determine if we're creating or updating
      const isUpdate = !!category;
      const url = isUpdate 
        ? `/api/finance/categories?id=${category.id}`
        : '/api/finance/categories';
      
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isUpdate ? { id: category.id, ...data } : data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
      
      toast.success(
        isUpdate
          ? 'Category updated successfully'
          : 'Category created successfully'
      );
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save category'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle custom color input
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    form.setValue('color', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Update the details of your transaction category'
              : 'Create a new category to organize your transactions'}
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
                      <Input placeholder="e.g. Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Budget Limit */}
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Limit (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      value={field.value === undefined ? '' : field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a budget limit for this category to track spending
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {predefinedColors.map((color) => (
                      <div
                        key={color}
                        className={cn(
                          "w-8 h-8 rounded-full cursor-pointer border-2",
                          field.value === color ? "border-primary" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => form.setValue('color', color)}
                      >
                        {field.value === color && (
                          <Check className="h-4 w-4 text-white m-auto mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: customColor || field.value }}
                    />
                    <FormControl>
                      <Input
                        placeholder="#RRGGBB"
                        value={customColor || field.value || ''}
                        onChange={handleCustomColorChange}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Choose a color for this category or enter a custom hex color
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Icon Selection */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            <span className="text-xl mr-2">{field.value}</span>
                          ) : (
                            "Select an icon"
                          )}
                          {field.value ? field.value : "No icon selected"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="grid grid-cols-6 gap-2 p-2 max-h-[200px] overflow-y-auto">
                        {commonIcons.map((icon) => (
                          <div
                            key={icon.value}
                            className={cn(
                              "flex items-center justify-center text-2xl p-2 rounded-md cursor-pointer hover:bg-muted",
                              field.value === icon.value && "bg-muted"
                            )}
                            onClick={() => {
                              form.setValue('icon', icon.value);
                              document.querySelector('[data-radix-popper-content-wrapper]')?.dispatchEvent(
                                new KeyboardEvent('keydown', { key: 'Escape' })
                              );
                            }}
                            title={icon.label}
                          >
                            {icon.value}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Choose an icon to represent this category
                  </FormDescription>
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
                {category ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
