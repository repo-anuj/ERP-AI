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
import { 
  Calculator, 
  Calendar, 
  Users, 
  DollarSign,
  Info,
  TrendingUp
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const taxCalculationSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  financialYear: z.string().min(1, "Financial year is required"),
  grossAnnualSalary: z.number().min(0, "Gross annual salary must be positive"),
  hra: z.number().min(0).default(0),
  standardDeduction: z.number().min(0).default(50000),
  section80C: z.number().min(0).max(150000).default(0),
  section80D: z.number().min(0).max(75000).default(0),
  section80E: z.number().min(0).default(0),
  section80G: z.number().min(0).default(0),
  section80TTA: z.number().min(0).max(10000).default(0),
  section80TTB: z.number().min(0).max(50000).default(0),
  otherDeductions: z.number().min(0).default(0),
  previousEmployerTds: z.number().min(0).default(0),
  taxRegime: z.enum(['old', 'new']).default('new'),
  isHandicapped: z.boolean().default(false),
  isSeniorCitizen: z.boolean().default(false),
  isSuperSeniorCitizen: z.boolean().default(false),
});

type TaxCalculationFormValues = z.infer<typeof taxCalculationSchema>;

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

interface TaxCalculationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFinancialYear?: string;
}

export function TaxCalculationDialog({
  open,
  onClose,
  onSuccess,
  defaultFinancialYear = '2024-25',
}: TaxCalculationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [calculationPreview, setCalculationPreview] = useState<any>(null);
  const { toast } = useToast();

  // Generate financial year options
  const currentYear = new Date().getFullYear();
  const financialYearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return {
      value: `${year}-${(year + 1).toString().slice(-2)}`,
      label: `FY ${year}-${year + 1}`
    };
  });

  const form = useForm<TaxCalculationFormValues>({
    resolver: zodResolver(taxCalculationSchema),
    defaultValues: {
      employeeId: '',
      financialYear: defaultFinancialYear,
      grossAnnualSalary: 0,
      hra: 0,
      standardDeduction: 50000,
      section80C: 0,
      section80D: 0,
      section80E: 0,
      section80G: 0,
      section80TTA: 0,
      section80TTB: 0,
      otherDeductions: 0,
      previousEmployerTds: 0,
      taxRegime: 'new',
      isHandicapped: false,
      isSeniorCitizen: false,
      isSuperSeniorCitizen: false,
    },
  });

  // Watch form values for real-time calculation
  const watchedValues = form.watch();

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
        employeeId: '',
        financialYear: defaultFinancialYear,
        grossAnnualSalary: 0,
        hra: 0,
        standardDeduction: 50000,
        section80C: 0,
        section80D: 0,
        section80E: 0,
        section80G: 0,
        section80TTA: 0,
        section80TTB: 0,
        otherDeductions: 0,
        previousEmployerTds: 0,
        taxRegime: 'new',
        isHandicapped: false,
        isSeniorCitizen: false,
        isSuperSeniorCitizen: false,
      });
      setCalculationPreview(null);
    }
  }, [open, defaultFinancialYear, form]);

  // Calculate preview when form values change
  useEffect(() => {
    if (watchedValues.grossAnnualSalary > 0) {
      calculatePreview();
    }
  }, [watchedValues]);

  const calculatePreview = () => {
    try {
      // Simple preview calculation (same logic as backend)
      const {
        grossAnnualSalary,
        hra,
        standardDeduction,
        section80C,
        section80D,
        section80E,
        section80G,
        section80TTA,
        section80TTB,
        otherDeductions,
        taxRegime,
        isSeniorCitizen,
        isSuperSeniorCitizen
      } = watchedValues;

      // Calculate HRA exemption
      const hraExemption = Math.min(
        hra,
        grossAnnualSalary * 0.5,
        hra - (grossAnnualSalary * 0.1)
      );

      // Calculate taxable income
      let taxableIncome = grossAnnualSalary - hraExemption;

      if (taxRegime === 'old') {
        taxableIncome -= standardDeduction;
        taxableIncome -= Math.min(section80C, 150000);
        taxableIncome -= Math.min(section80D, isSeniorCitizen ? 50000 : 25000);
        taxableIncome -= section80E;
        taxableIncome -= section80G;
        taxableIncome -= Math.min(section80TTA, 10000);
        taxableIncome -= Math.min(section80TTB, 50000);
        taxableIncome -= otherDeductions;
      } else {
        taxableIncome -= standardDeduction;
      }

      taxableIncome = Math.max(0, taxableIncome);

      // Calculate tax
      let incomeTax = 0;
      if (taxRegime === 'new') {
        // New regime slabs
        if (taxableIncome > 300000) incomeTax += Math.min(taxableIncome - 300000, 400000) * 0.05;
        if (taxableIncome > 700000) incomeTax += Math.min(taxableIncome - 700000, 300000) * 0.10;
        if (taxableIncome > 1000000) incomeTax += Math.min(taxableIncome - 1000000, 200000) * 0.15;
        if (taxableIncome > 1200000) incomeTax += Math.min(taxableIncome - 1200000, 300000) * 0.20;
        if (taxableIncome > 1500000) incomeTax += (taxableIncome - 1500000) * 0.30;
      } else {
        // Old regime slabs
        const basicExemption = isSuperSeniorCitizen ? 500000 : isSeniorCitizen ? 300000 : 250000;
        if (taxableIncome > basicExemption) incomeTax += Math.min(taxableIncome - basicExemption, 500000 - basicExemption) * 0.05;
        if (taxableIncome > 500000) incomeTax += Math.min(taxableIncome - 500000, 500000) * 0.20;
        if (taxableIncome > 1000000) incomeTax += (taxableIncome - 1000000) * 0.30;
      }

      const healthEducationCess = incomeTax * 0.04;
      const totalTax = incomeTax + healthEducationCess;

      // Rebate calculation
      let rebate = 0;
      if (taxRegime === 'new' && taxableIncome <= 700000) {
        rebate = Math.min(totalTax, 25000);
      } else if (taxRegime === 'old' && taxableIncome <= 500000) {
        rebate = Math.min(totalTax, 12500);
      }

      const finalTax = totalTax - rebate;
      const monthlyTds = finalTax / 12;

      setCalculationPreview({
        taxableIncome,
        incomeTax,
        healthEducationCess,
        totalTax,
        rebate,
        finalTax,
        monthlyTds,
        hraExemption
      });
    } catch (error) {
      console.error('Error calculating preview:', error);
    }
  };

  const onSubmit = async (data: TaxCalculationFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/hr/tax-calculations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate tax');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Tax calculation completed successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error calculating tax:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to calculate tax',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === watchedValues.employeeId);
  const selectedFinancialYear = financialYearOptions.find(fy => fy.value === watchedValues.financialYear);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Calculation
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                <div className="flex items-center gap-2">
                                  <span>{employee.firstName} {employee.lastName}</span>
                                  <Badge variant="outline">{employee.employeeId}</Badge>
                                </div>
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
                    name="financialYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Year *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select financial year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {financialYearOptions.map((fy) => (
                              <SelectItem key={fy.value} value={fy.value}>
                                {fy.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedEmployee && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Calculating tax for <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong> 
                      ({selectedEmployee.employeeId}) for <strong>{selectedFinancialYear?.label}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingEmployees}>
                {isSubmitting ? 'Calculating...' : 'Calculate Tax'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
