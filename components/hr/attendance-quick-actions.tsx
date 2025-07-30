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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Plus,
  Edit,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(['present', 'absent', 'half-day', 'leave', 'holiday']),
  notes: z.string().optional(),
  location: z.string().optional(),
});

type ManualAttendanceFormValues = z.infer<typeof manualAttendanceSchema>;

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

interface AttendanceQuickActionsProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AttendanceQuickActions({
  open,
  onClose,
  onSuccess,
}: AttendanceQuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualAttendanceFormValues>({
    resolver: zodResolver(manualAttendanceSchema),
    defaultValues: {
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      checkIn: '',
      checkOut: '',
      status: 'present',
      notes: '',
      location: 'Office',
    },
  });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // Handle manual attendance submission
  const onSubmitManualAttendance = async (data: ManualAttendanceFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date),
          checkIn: data.checkIn ? new Date(`${data.date}T${data.checkIn}:00`) : null,
          checkOut: data.checkOut ? new Date(`${data.date}T${data.checkOut}:00`) : null,
          isManual: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add attendance record');
      }

      toast({
        title: 'Success',
        description: 'Manual attendance record added successfully',
      });

      form.reset();
      setActiveAction(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding manual attendance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add attendance record',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk check-in
  const handleBulkCheckIn = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/hr/attendance/bulk-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(),
          checkInTime: new Date(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk check-in');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Bulk check-in completed for ${result.count} employees`,
      });

      setActiveAction(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error performing bulk check-in:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk check-in',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle data export
  const handleExportData = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/hr/attendance/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export attendance data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Attendance data exported successfully',
      });

      setActiveAction(null);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export attendance data',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    {
      id: 'manual-attendance',
      title: 'Add Manual Attendance',
      description: 'Add attendance record for an employee',
      icon: UserCheck,
      color: 'bg-blue-500',
    },
    {
      id: 'bulk-checkin',
      title: 'Bulk Check-in',
      description: 'Check-in all employees at once',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      id: 'mark-absent',
      title: 'Mark Absent',
      description: 'Mark employees as absent for today',
      icon: UserX,
      color: 'bg-red-500',
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export attendance data to Excel',
      icon: Download,
      color: 'bg-purple-500',
    },
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Import attendance data from file',
      icon: Upload,
      color: 'bg-orange-500',
    },
    {
      id: 'sync-devices',
      title: 'Sync Devices',
      description: 'Sync with biometric devices',
      icon: RefreshCw,
      color: 'bg-indigo-500',
    },
  ];

  const renderActionContent = () => {
    switch (activeAction) {
      case 'manual-attendance':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitManualAttendance)} className="space-y-4">
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
                            {employee.firstName} {employee.lastName} ({employee.employeeId})
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="half-day">Half Day</SelectItem>
                          <SelectItem value="leave">On Leave</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('status') === 'present' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check In Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check Out Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Office, Home, Client Site..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Attendance'}
                </Button>
              </div>
            </form>
          </Form>
        );

      case 'bulk-checkin':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-medium">Bulk Check-in</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This will check-in all active employees for today. Are you sure you want to continue?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button onClick={handleBulkCheckIn} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Bulk Check-in'}
              </Button>
            </div>
          </div>
        );

      case 'export-data':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Download className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">Export Attendance Data</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Export all attendance data to Excel format for analysis or backup.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveAction(null)}>
                Cancel
              </Button>
              <Button onClick={handleExportData} disabled={isSubmitting}>
                {isSubmitting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveAction(action.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {activeAction ? quickActions.find(a => a.id === activeAction)?.title : 'Quick Actions'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderActionContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
