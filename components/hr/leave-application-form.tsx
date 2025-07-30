'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, User, Clock, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, differenceInDays, addDays } from 'date-fns';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  department?: {
    id: string;
    name: string;
  };
}

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryOverDays: number;
  minNoticeRequired: number;
  maxConsecutiveDays?: number;
  requiresApproval: boolean;
  allowHalfDays: boolean;
  allowNegativeBalance: boolean;
}

interface LeaveBalance {
  id: string;
  totalEntitled: number;
  totalUsed: number;
  totalPending: number;
  availableBalance: number;
  carryOver: number;
}

interface LeaveApplicationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeId?: string; // Pre-select employee
}

export function LeaveApplicationForm({
  open,
  onClose,
  onSuccess,
  employeeId: preSelectedEmployeeId,
}: LeaveApplicationFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    employeeId: preSelectedEmployeeId || '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDayPeriod: 'morning' as 'morning' | 'afternoon',
    emergencyContact: '',
    workHandover: '',
    attachments: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch employees and leave types
  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchLeaveTypes();
    }
  }, [open]);

  // Fetch leave balance when employee and leave type are selected
  useEffect(() => {
    if (formData.employeeId && formData.leaveTypeId) {
      fetchLeaveBalance();
    } else {
      setLeaveBalance(null);
    }
  }, [formData.employeeId, formData.leaveTypeId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch('/api/hr/leave/types');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data || []);
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `/api/hr/leave/balances?employeeId=${formData.employeeId}&leaveTypeId=${formData.leaveTypeId}&year=${currentYear}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.balances && data.balances.length > 0) {
          const employeeBalance = data.balances[0];
          if (employeeBalance.balances && employeeBalance.balances.length > 0) {
            setLeaveBalance(employeeBalance.balances[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (!formData.leaveTypeId) {
      newErrors.leaveTypeId = 'Leave type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate && !formData.isHalfDay) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Check if start date is in the past
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Cannot apply for leave in the past';
      }
    }

    // Check minimum notice requirement
    const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);
    if (selectedLeaveType && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      const daysUntilStart = differenceInDays(startDate, today);
      
      if (daysUntilStart < selectedLeaveType.minNoticeRequired) {
        newErrors.startDate = `Minimum ${selectedLeaveType.minNoticeRequired} days notice required`;
      }
    }

    // Check maximum consecutive days
    if (selectedLeaveType && selectedLeaveType.maxConsecutiveDays && formData.startDate && formData.endDate) {
      const totalDays = formData.isHalfDay ? 0.5 : differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;
      
      if (totalDays > selectedLeaveType.maxConsecutiveDays) {
        newErrors.endDate = `Maximum ${selectedLeaveType.maxConsecutiveDays} consecutive days allowed`;
      }
    }

    // Check leave balance
    if (leaveBalance && formData.startDate && (formData.endDate || formData.isHalfDay)) {
      const totalDays = formData.isHalfDay ? 0.5 : differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;
      
      if (totalDays > leaveBalance.availableBalance && !selectedLeaveType?.allowNegativeBalance) {
        newErrors.general = `Insufficient leave balance. Available: ${leaveBalance.availableBalance} days`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        ...formData,
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
      };

      const response = await fetch('/api/hr/leave/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit leave application');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Leave application submitted successfully',
      });

      // Reset form
      setFormData({
        employeeId: preSelectedEmployeeId || '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        halfDayPeriod: 'morning',
        emergencyContact: '',
        workHandover: '',
        attachments: [],
      });

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error submitting leave application:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit leave application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalDays = () => {
    if (formData.isHalfDay) {
      return 0.5;
    }
    
    if (formData.startDate && formData.endDate) {
      return differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;
    }
    
    return 0;
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
  const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            New Leave Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee *</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              disabled={!!preSelectedEmployeeId}
            >
              <SelectTrigger className={errors.employeeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{employee.firstName} {employee.lastName} ({employee.employeeId})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <span className="text-sm text-red-500">{errors.employeeId}</span>}
          </div>

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leaveTypeId">Leave Type *</Label>
            <Select 
              value={formData.leaveTypeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, leaveTypeId: value }))}
            >
              <SelectTrigger className={errors.leaveTypeId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div>
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Max: {type.maxDaysPerYear} days/year
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && <span className="text-sm text-red-500">{errors.leaveTypeId}</span>}
          </div>

          {/* Leave Balance Display */}
          {leaveBalance && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Leave Balance</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Entitled</div>
                    <div className="font-medium">{leaveBalance.totalEntitled}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Used</div>
                    <div className="font-medium">{leaveBalance.totalUsed}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pending</div>
                    <div className="font-medium">{leaveBalance.totalPending}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Available</div>
                    <div className="font-medium text-green-600">{leaveBalance.availableBalance}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Half Day Toggle */}
          {selectedLeaveType?.allowHalfDays && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isHalfDay"
                checked={formData.isHalfDay}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isHalfDay: checked,
                  endDate: checked ? prev.startDate : prev.endDate
                }))}
              />
              <Label htmlFor="isHalfDay">Half Day Leave</Label>
            </div>
          )}

          {/* Half Day Period */}
          {formData.isHalfDay && (
            <div className="space-y-2">
              <Label>Half Day Period</Label>
              <Select 
                value={formData.halfDayPeriod} 
                onValueChange={(value: 'morning' | 'afternoon') => 
                  setFormData(prev => ({ ...prev, halfDayPeriod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startDate: e.target.value,
                  endDate: prev.isHalfDay ? e.target.value : prev.endDate
                }))}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <span className="text-sm text-red-500">{errors.startDate}</span>}
            </div>

            {!formData.isHalfDay && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && <span className="text-sm text-red-500">{errors.endDate}</span>}
              </div>
            )}
          </div>

          {/* Total Days Display */}
          {(formData.startDate && (formData.endDate || formData.isHalfDay)) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                Total Days: <span className="font-medium">{calculateTotalDays()}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide reason for leave..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className={errors.reason ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.reason && <span className="text-sm text-red-500">{errors.reason}</span>}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              placeholder="Emergency contact number"
              value={formData.emergencyContact}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
            />
          </div>

          {/* Work Handover */}
          <div className="space-y-2">
            <Label htmlFor="workHandover">Work Handover Notes</Label>
            <Textarea
              id="workHandover"
              placeholder="Work handover instructions..."
              value={formData.workHandover}
              onChange={(e) => setFormData(prev => ({ ...prev, workHandover: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
