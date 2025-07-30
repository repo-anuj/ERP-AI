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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign as IndianRupee, Calendar, User, Building } from 'lucide-react';

const salaryStructureSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  hra: z.number().optional(),
  conveyance: z.number().optional(),
  medicalAllowance: z.number().optional(),
  specialAllowance: z.number().optional(),
  pfEmployeeRate: z.number().min(0).max(1).default(0.12),
  pfEmployerRate: z.number().min(0).max(1).default(0.12),
  esiEmployeeRate: z.number().min(0).max(1).default(0.0075),
  esiEmployerRate: z.number().min(0).max(1).default(0.0325),
  professionalTax: z.number().optional(),
  tdsRate: z.number().optional(),
  pfApplicable: z.boolean().default(true),
  esiApplicable: z.boolean().default(true),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SalaryStructureFormValues = z.infer<typeof salaryStructureSchema>;

interface SalaryStructure {
  id: string;
  basicSalary: number;
  hra?: number;
  conveyance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  professionalTax?: number;
  tdsRate?: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

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

interface SalaryStructureDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salaryStructure?: SalaryStructure | null;
  employees: Employee[];
}

export function SalaryStructureDialog({
  open,
  onClose,
  onSuccess,
  salaryStructure,
  employees,
}: SalaryStructureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<SalaryStructureFormValues>({
    resolver: zodResolver(salaryStructureSchema),
    defaultValues: {
      employeeId: '',
      basicSalary: 0,
      hra: 0,
      conveyance: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      pfEmployeeRate: 0.12,
      pfEmployerRate: 0.12,
      esiEmployeeRate: 0.0075,
      esiEmployerRate: 0.0325,
      professionalTax: 0,
      tdsRate: 0,
      pfApplicable: true,
      esiApplicable: true,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or salary structure changes
  useEffect(() => {
    if (open) {
      if (salaryStructure) {
        // Editing existing structure
        form.reset({
          employeeId: salaryStructure.employee.id,
          basicSalary: salaryStructure.basicSalary,
          hra: salaryStructure.hra || 0,
          conveyance: salaryStructure.conveyance || 0,
          medicalAllowance: salaryStructure.medicalAllowance || 0,
          specialAllowance: salaryStructure.specialAllowance || 0,
          pfEmployeeRate: salaryStructure.pfEmployeeRate,
          pfEmployerRate: salaryStructure.pfEmployerRate,
          esiEmployeeRate: salaryStructure.esiEmployeeRate,
          esiEmployerRate: salaryStructure.esiEmployerRate,
          professionalTax: salaryStructure.professionalTax || 0,
          tdsRate: salaryStructure.tdsRate || 0,
          pfApplicable: salaryStructure.pfApplicable,
          esiApplicable: salaryStructure.esiApplicable,
          effectiveFrom: new Date(salaryStructure.effectiveFrom).toISOString().split('T')[0],
          effectiveTo: salaryStructure.effectiveTo ? new Date(salaryStructure.effectiveTo).toISOString().split('T')[0] : '',
          isActive: salaryStructure.isActive,
        });
      } else {
        // Creating new structure
        form.reset({
          employeeId: '',
          basicSalary: 0,
          hra: 0,
          conveyance: 0,
          medicalAllowance: 0,
          specialAllowance: 0,
          pfEmployeeRate: 0.12,
          pfEmployerRate: 0.12,
          esiEmployeeRate: 0.0075,
          esiEmployerRate: 0.0325,
          professionalTax: 0,
          tdsRate: 0,
          pfApplicable: true,
          esiApplicable: true,
          effectiveFrom: new Date().toISOString().split('T')[0],
          effectiveTo: '',
          isActive: true,
        });
      }
    }
  }, [open, salaryStructure, form]);

  // Watch form values for calculations
  const watchedValues = form.watch();
  
  // Calculate gross salary
  const grossSalary = (watchedValues.basicSalary || 0) + 
                     (watchedValues.hra || 0) + 
                     (watchedValues.conveyance || 0) + 
                     (watchedValues.medicalAllowance || 0) + 
                     (watchedValues.specialAllowance || 0);

  // Calculate PF deductions
  const pfEmployee = watchedValues.pfApplicable ? (watchedValues.basicSalary || 0) * (watchedValues.pfEmployeeRate || 0) : 0;
  const pfEmployer = watchedValues.pfApplicable ? (watchedValues.basicSalary || 0) * (watchedValues.pfEmployerRate || 0) : 0;

  // Calculate ESI deductions
  const esiEmployee = watchedValues.esiApplicable ? grossSalary * (watchedValues.esiEmployeeRate || 0) : 0;
  const esiEmployer = watchedValues.esiApplicable ? grossSalary * (watchedValues.esiEmployerRate || 0) : 0;

  // Calculate net salary
  const totalDeductions = pfEmployee + esiEmployee + (watchedValues.professionalTax || 0);
  const netSalary = grossSalary - totalDeductions;

  const onSubmit = async (data: SalaryStructureFormValues) => {
    try {
      setIsSubmitting(true);

      const url = salaryStructure 
        ? `/api/hr/salary-structures/${salaryStructure.id}`
        : '/api/hr/salary-structures';
      
      const method = salaryStructure ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save salary structure');
      }

      toast({
        title: 'Success',
        description: `Salary structure ${salaryStructure ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving salary structure:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save salary structure',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {salaryStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!!salaryStructure}
                          >
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
                                    <span className="text-sm text-muted-foreground">
                                      {employee.department.name}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="effectiveFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effective From</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="effectiveTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effective To (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this salary structure
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

                {/* Salary Components */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Salary Components
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Basic Salary *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter basic salary"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hra"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HRA</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="House Rent Allowance"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conveyance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conveyance</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Conveyance allowance"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medicalAllowance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Allowance</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Medical allowance"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialAllowance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Allowance</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Special allowance"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Statutory Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statutory Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pfApplicable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>PF Applicable</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Provident Fund deduction
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
                        name="esiApplicable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>ESI Applicable</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Employee State Insurance
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="professionalTax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Tax</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Monthly professional tax"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tdsRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TDS Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                max="1"
                                placeholder="TDS rate (0.1 for 10%)"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Salary Calculation Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Salary Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Salary:</span>
                        <span className="font-semibold">₹{grossSalary.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Basic Salary:</span>
                          <span>₹{(watchedValues.basicSalary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>HRA:</span>
                          <span>₹{(watchedValues.hra || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Conveyance:</span>
                          <span>₹{(watchedValues.conveyance || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Medical:</span>
                          <span>₹{(watchedValues.medicalAllowance || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Special:</span>
                          <span>₹{(watchedValues.specialAllowance || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-red-600">
                        <span>Total Deductions:</span>
                        <span className="font-semibold">₹{totalDeductions.toLocaleString()}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>PF (Employee):</span>
                          <span>₹{pfEmployee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>ESI (Employee):</span>
                          <span>₹{esiEmployee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Professional Tax:</span>
                          <span>₹{(watchedValues.professionalTax || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Net Salary:</span>
                      <span>₹{netSalary.toLocaleString()}</span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-4">
                      <div className="flex justify-between">
                        <span>Employer PF:</span>
                        <span>₹{pfEmployer.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer ESI:</span>
                        <span>₹{esiEmployer.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Cost to Company:</span>
                        <span>₹{(grossSalary + pfEmployer + esiEmployer).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : salaryStructure ? 'Update Structure' : 'Create Structure'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
