'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings, User, Calendar, Plus, Minus, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
}

interface LeaveType {
  id: string;
  name: string;
  maxDaysPerYear: number;
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

interface LeaveBalanceAdjustmentProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeaveBalanceAdjustment({
  open,
  onClose,
  onSuccess,
}: LeaveBalanceAdjustmentProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    year: new Date().getFullYear(),
    adjustmentType: 'add' as 'add' | 'deduct',
    adjustmentDays: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data when dialog opens
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
  }, [formData.employeeId, formData.leaveTypeId, formData.year]);

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
      const response = await fetch(
        `/api/hr/leave/balances?employeeId=${formData.employeeId}&leaveTypeId=${formData.leaveTypeId}&year=${formData.year}`
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

    if (!formData.adjustmentDays || parseFloat(formData.adjustmentDays) <= 0) {
      newErrors.adjustmentDays = 'Adjustment days must be greater than 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    // Check if adjustment would result in negative balance
    if (leaveBalance && formData.adjustmentType === 'deduct') {
      const adjustmentDays = parseFloat(formData.adjustmentDays || '0');
      const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);
      
      if (!selectedLeaveType?.allowNegativeBalance) {
        const newAvailableBalance = leaveBalance.availableBalance - adjustmentDays;
        if (newAvailableBalance < 0) {
          newErrors.adjustmentDays = 'Adjustment would result in negative balance';
        }
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

      const response = await fetch('/api/hr/leave/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          adjustmentDays: parseFloat(formData.adjustmentDays),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust leave balance');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || 'Leave balance adjusted successfully',
      });

      // Reset form
      setFormData({
        employeeId: '',
        leaveTypeId: '',
        year: new Date().getFullYear(),
        adjustmentType: 'add',
        adjustmentDays: '',
        reason: '',
      });

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error adjusting leave balance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust leave balance',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateNewBalance = () => {
    if (!leaveBalance || !formData.adjustmentDays) return null;

    const adjustmentDays = parseFloat(formData.adjustmentDays);
    const currentBalance = leaveBalance.availableBalance;
    
    if (formData.adjustmentType === 'add') {
      return currentBalance + adjustmentDays;
    } else {
      return currentBalance - adjustmentDays;
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
  const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);
  const newBalance = calculateNewBalance();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adjust Leave Balance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee *</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
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

          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select 
              value={formData.year.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current Balance Display */}
          {leaveBalance && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Leave Balance</CardTitle>
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

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="add"
                  checked={formData.adjustmentType === 'add'}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value as 'add' | 'deduct' }))}
                />
                <Plus className="h-4 w-4 text-green-500" />
                <span>Add Days</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="adjustmentType"
                  value="deduct"
                  checked={formData.adjustmentType === 'deduct'}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustmentType: e.target.value as 'add' | 'deduct' }))}
                />
                <Minus className="h-4 w-4 text-red-500" />
                <span>Deduct Days</span>
              </label>
            </div>
          </div>

          {/* Adjustment Days */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentDays">Adjustment Days *</Label>
            <Input
              id="adjustmentDays"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Enter number of days"
              value={formData.adjustmentDays}
              onChange={(e) => setFormData(prev => ({ ...prev, adjustmentDays: e.target.value }))}
              className={errors.adjustmentDays ? 'border-red-500' : ''}
            />
            {errors.adjustmentDays && <span className="text-sm text-red-500">{errors.adjustmentDays}</span>}
          </div>

          {/* New Balance Preview */}
          {newBalance !== null && leaveBalance && (
            <div className={`p-3 border rounded-lg ${newBalance < 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2">
                {newBalance < 0 && <AlertCircle className="h-4 w-4 text-red-500" />}
                <span className="text-sm font-medium">
                  New Available Balance: {newBalance} days
                </span>
              </div>
              {newBalance < 0 && (
                <div className="text-xs text-red-600 mt-1">
                  Warning: This will result in a negative balance
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide reason for adjustment..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className={errors.reason ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.reason && <span className="text-sm text-red-500">{errors.reason}</span>}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adjusting...' : 'Adjust Balance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
