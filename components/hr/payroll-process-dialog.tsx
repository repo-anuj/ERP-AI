'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PlayCircle as Play,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const payrollProcessSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  employeeIds: z.array(z.string()).optional(),
  includeBonus: z.boolean().default(false),
  bonusAmount: z.number().min(0).optional(),
  includeIncentives: z.boolean().default(false),
  incentiveAmount: z.number().min(0).optional(),
});

type PayrollProcessFormValues = z.infer<typeof payrollProcessSchema>;

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: {
    id: string;
    name: string;
  };
}

interface PayrollProcessDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultYear?: number;
  defaultMonth?: number;
}

export function PayrollProcessDialog({
  open,
  onClose,
  onSuccess,
  defaultYear = new Date().getFullYear(),
  defaultMonth = new Date().getMonth() + 1,
}: PayrollProcessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { toast } = useToast();

  // Generate year and month options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const form = useForm<PayrollProcessFormValues>({
    resolver: zodResolver(payrollProcessSchema),
    defaultValues: {
      month: defaultMonth,
      year: defaultYear,
      employeeIds: [],
      includeBonus: false,
      bonusAmount: 0,
      includeIncentives: false,
      incentiveAmount: 0,
    },
  });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data.filter((emp: any) => emp.status === 'active'));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      form.reset({
        month: defaultMonth,
        year: defaultYear,
        employeeIds: [],
        includeBonus: false,
        bonusAmount: 0,
        includeIncentives: false,
        incentiveAmount: 0,
      });
    }
  }, [open, defaultMonth, defaultYear, form]);

  // Watch form values
  const watchedValues = form.watch();

  // Check if payroll already exists
  const checkExistingPayroll = async (month: number, year: number) => {
    try {
      const response = await fetch(`/api/hr/payroll?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        return data.length > 0;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const onSubmit = async (data: PayrollProcessFormValues) => {
    try {
      setIsSubmitting(true);

      // Check if payroll already exists
      const exists = await checkExistingPayroll(data.month, data.year);
      if (exists) {
        toast({
          title: 'Payroll Already Exists',
          description: `Payroll for ${monthOptions.find(m => m.value === data.month)?.label} ${data.year} has already been processed.`,
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle the case where some employees were skipped
        if (errorData.skippedEmployees && errorData.skippedEmployees.length > 0) {
          toast({
            title: 'Payroll Processing Issues',
            description: `${errorData.skippedEmployees.length} employees were skipped: ${errorData.skippedEmployees.map((emp: any) => emp.name).join(', ')}. Please ensure all employees have active salary structures.`,
            variant: 'destructive',
          });
        } else {
          throw new Error(errorData.error || 'Failed to process payroll');
        }
        return;
      }

      const result = await response.json();

      let toastMessage = `Processed payroll for ${result.processedCount} employees for ${monthOptions.find(m => m.value === data.month)?.label} ${data.year}`;

      if (result.skippedCount > 0) {
        toastMessage += `. ${result.skippedCount} employees were skipped due to missing salary structures.`;
      }

      toast({
        title: 'Success',
        description: toastMessage,
      });

      onSuccess();
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payroll',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployees = watchedValues.employeeIds || [];
  const selectedMonth = monthOptions.find(m => m.value === watchedValues.month);
  const totalEmployees = selectedEmployees.length > 0 ? selectedEmployees.length : employees.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Process Payroll
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payroll Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {yearOptions.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
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
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {monthOptions.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Processing payroll for <strong>{selectedMonth?.label} {watchedValues.year}</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Bonus and Incentives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Additional Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="includeBonus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Bonus</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Add bonus to all employees
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

                    {watchedValues.includeBonus && (
                      <FormField
                        control={form.control}
                        name="bonusAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bonus Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter bonus amount"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="includeIncentives"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Incentives</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Add incentives to all employees
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

                    {watchedValues.includeIncentives && (
                      <FormField
                        control={form.control}
                        name="incentiveAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incentive Amount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter incentive amount"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Processing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Employees to process:</span>
                    <Badge variant="outline">{totalEmployees}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span>{selectedMonth?.label} {watchedValues.year}</span>
                  </div>
                  {watchedValues.includeBonus && (
                    <div className="flex justify-between">
                      <span>Bonus per employee:</span>
                      <span>₹{(watchedValues.bonusAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  {watchedValues.includeIncentives && (
                    <div className="flex justify-between">
                      <span>Incentive per employee:</span>
                      <span>₹{(watchedValues.incentiveAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingEmployees}>
                {isSubmitting ? 'Processing...' : 'Process Payroll'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
