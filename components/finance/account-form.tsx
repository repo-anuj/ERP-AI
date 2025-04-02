'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Account schema for validation
const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  type: z.enum(['cash', 'bank', 'credit', 'investment', 'other'], {
    required_error: "Please select an account type",
  }),
  currency: z.string().length(3, "Currency code must be 3 characters (e.g. USD)").default("USD"),
  initialBalance: z.number().default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").default("#6366F1"),
  isActive: z.boolean().default(true),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// Define types
type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  account?: any; // Optional account for editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default form values
  const defaultValues: Partial<AccountFormValues> = {
    name: '',
    type: 'bank',
    currency: 'USD',
    initialBalance: 0,
    color: '#6366F1',
    isActive: true,
    description: '',
  };

  // Initialize form with account data if editing
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account 
      ? {
          name: account.name,
          type: account.type,
          currency: account.currency || 'USD',
          initialBalance: account.balance || 0,
          color: account.color || '#6366F1',
          isActive: account.isActive !== undefined ? account.isActive : true,
          description: account.description || '',
        }
      : defaultValues,
  });

  // Handle form submission
  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine if creating or updating
      const url = account 
        ? `/api/finance/accounts?id=${account.id}` 
        : '/api/finance/accounts';
      
      const method = account ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save account');
      }
      
      toast.success(account ? 'Account updated successfully' : 'Account created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Account Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Main Checking Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Account Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Currency & Initial Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input placeholder="USD" maxLength={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {account ? 'Current Balance' : 'Initial Balance'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                    disabled={!!account} // Disable editing balance for existing accounts
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Color & Is Active */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Color</FormLabel>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: field.value }}
                  />
                  <FormControl>
                    <Input 
                      placeholder="#6366F1" 
                      maxLength={7}
                      {...field} 
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Account</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Show this account in lists and reports
                  </div>
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
        
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional details about this account" 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 