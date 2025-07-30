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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Calendar, 
  Users, 
  Mail,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const payslipGenerateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  employeeIds: z.array(z.string()).optional(),
  sendEmail: z.boolean().default(false),
  regenerate: z.boolean().default(false),
});

type PayslipGenerateFormValues = z.infer<typeof payslipGenerateSchema>;

interface PayrollRecord {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: {
      name: string;
    };
  };
  netSalary: number;
  status: string;
  hasPayslip?: boolean;
}

interface PayslipGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultYear?: number;
  defaultMonth?: number;
}

export function PayslipGenerateDialog({
  open,
  onClose,
  onSuccess,
  defaultYear = new Date().getFullYear(),
  defaultMonth = new Date().getMonth() + 1,
}: PayslipGenerateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
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

  const form = useForm<PayslipGenerateFormValues>({
    resolver: zodResolver(payslipGenerateSchema),
    defaultValues: {
      month: defaultMonth,
      year: defaultYear,
      employeeIds: [],
      sendEmail: false,
      regenerate: false,
    },
  });

  // Watch form values
  const watchedValues = form.watch();

  // Fetch payroll records for the selected month/year
  const fetchPayrollRecords = async (month: number, year: number) => {
    try {
      setLoadingPayrolls(true);
      const response = await fetch(`/api/hr/payroll?month=${month}&year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll records');
      }
      
      const payrolls = await response.json();
      
      // Filter only processed/paid payrolls
      const eligiblePayrolls = payrolls.filter((p: any) => 
        p.status === 'processed' || p.status === 'paid'
      );
      
      // Check which payrolls already have payslips
      const payslipsResponse = await fetch(`/api/hr/payslips?month=${month}&year=${year}`);
      const existingPayslips = payslipsResponse.ok ? await payslipsResponse.json() : [];
      
      const payslipMap = new Map(existingPayslips.map((p: any) => [p.payrollId, true]));
      
      const recordsWithPayslipStatus = eligiblePayrolls.map((payroll: any) => ({
        ...payroll,
        hasPayslip: payslipMap.has(payroll.id)
      }));
      
      setPayrollRecords(recordsWithPayslipStatus);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll records',
        variant: 'destructive',
      });
    } finally {
      setLoadingPayrolls(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.reset({
        month: defaultMonth,
        year: defaultYear,
        employeeIds: [],
        sendEmail: false,
        regenerate: false,
      });
      setSelectedEmployees([]);
      fetchPayrollRecords(defaultMonth, defaultYear);
    }
  }, [open, defaultMonth, defaultYear, form]);

  // Fetch payroll records when month/year changes
  useEffect(() => {
    if (open && watchedValues.month && watchedValues.year) {
      fetchPayrollRecords(watchedValues.month, watchedValues.year);
      setSelectedEmployees([]);
    }
  }, [watchedValues.month, watchedValues.year, open]);

  const onSubmit = async (data: PayslipGenerateFormValues) => {
    try {
      setIsSubmitting(true);

      // Use selected employees or all if none selected
      const employeeIds = selectedEmployees.length > 0 ? selectedEmployees : undefined;

      const response = await fetch('/api/hr/payslips/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          employeeIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate payslips');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Generated ${result.results.generated} payslips successfully`,
      });

      if (result.results.failed > 0) {
        toast({
          title: 'Partial Success',
          description: `${result.results.failed} payslips failed to generate`,
          variant: 'destructive',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate payslips',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleIds = payrollRecords
        .filter(record => !record.hasPayslip || watchedValues.regenerate)
        .map(record => record.id);
      setSelectedEmployees(eligibleIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (payrollId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, payrollId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== payrollId));
    }
  };

  const selectedMonth = monthOptions.find(m => m.value === watchedValues.month);
  const eligibleRecords = payrollRecords.filter(record => 
    !record.hasPayslip || watchedValues.regenerate
  );
  const recordsWithPayslips = payrollRecords.filter(record => record.hasPayslip);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Payslips
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payslip Period
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
                    Generating payslips for <strong>{selectedMonth?.label} {watchedValues.year}</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Send Email</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Email payslips to employees automatically
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

                <FormField
                  control={form.control}
                  name="regenerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Regenerate Existing</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Regenerate payslips that already exist
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
              </CardContent>
            </Card>

            {/* Employee Selection */}
            {!loadingPayrolls && payrollRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employee Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedEmployees.length === eligibleRecords.length && eligibleRecords.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm font-medium">Select All Eligible</span>
                      </div>
                      <Badge variant="outline">
                        {selectedEmployees.length} of {eligibleRecords.length} selected
                      </Badge>
                    </div>

                    {recordsWithPayslips.length > 0 && !watchedValues.regenerate && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {recordsWithPayslips.length} employees already have payslips. Enable "Regenerate Existing" to include them.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {payrollRecords.map((record) => {
                        const isEligible = !record.hasPayslip || watchedValues.regenerate;
                        const isSelected = selectedEmployees.includes(record.id);
                        
                        return (
                          <div
                            key={record.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              !isEligible ? 'opacity-50 bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectEmployee(record.id, checked as boolean)}
                                disabled={!isEligible}
                              />
                              <div>
                                <div className="font-medium">
                                  {record.employee.firstName} {record.employee.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {record.employee.employeeId} • {record.employee.department.name}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                ₹{record.netSalary.toLocaleString()}
                              </span>
                              {record.hasPayslip && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Has Payslip
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span>{selectedMonth?.label} {watchedValues.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payroll Records:</span>
                    <span>{payrollRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eligible for Generation:</span>
                    <span>{eligibleRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected for Generation:</span>
                    <span>{selectedEmployees.length > 0 ? selectedEmployees.length : eligibleRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Send Emails:</span>
                    <span>{watchedValues.sendEmail ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || loadingPayrolls || (eligibleRecords.length === 0)}
              >
                {isSubmitting ? 'Generating...' : 'Generate Payslips'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
