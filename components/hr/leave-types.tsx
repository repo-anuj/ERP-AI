'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Settings, Calendar, Users, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryOverDays: number;
  minNoticeRequired: number;
  maxConsecutiveDays?: number;
  requiresApproval: boolean;
  approvalLevels: number;
  accrualRate: number;
  accrualStartDate: string;
  allowHalfDays: boolean;
  allowNegativeBalance: boolean;
  isActive: boolean;
  totalApplications: number;
  totalEmployeesWithBalance: number;
  createdAt: string;
  updatedAt: string;
}

export function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDaysPerYear: 20,
    carryOverDays: 5,
    minNoticeRequired: 1,
    maxConsecutiveDays: '',
    requiresApproval: true,
    approvalLevels: 1,
    accrualRate: 1.67,
    accrualStartDate: 'hire_date',
    allowHalfDays: true,
    allowNegativeBalance: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch leave types
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/leave/types?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setLeaveTypes(data || []);
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Leave type name is required';
    }

    if (formData.maxDaysPerYear < 1) {
      newErrors.maxDaysPerYear = 'Maximum days must be at least 1';
    }

    if (formData.carryOverDays < 0) {
      newErrors.carryOverDays = 'Carry over days cannot be negative';
    }

    if (formData.minNoticeRequired < 0) {
      newErrors.minNoticeRequired = 'Notice required cannot be negative';
    }

    if (formData.approvalLevels < 1) {
      newErrors.approvalLevels = 'At least 1 approval level required';
    }

    if (formData.accrualRate < 0) {
      newErrors.accrualRate = 'Accrual rate cannot be negative';
    }

    // Business logic validation
    if (formData.maxConsecutiveDays && parseInt(formData.maxConsecutiveDays) > formData.maxDaysPerYear) {
      newErrors.maxConsecutiveDays = 'Maximum consecutive days cannot exceed maximum days per year';
    }

    if (formData.carryOverDays > formData.maxDaysPerYear) {
      newErrors.carryOverDays = 'Carry over days cannot exceed maximum days per year';
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
        maxConsecutiveDays: formData.maxConsecutiveDays ? parseInt(formData.maxConsecutiveDays) : undefined,
      };

      const url = editingType ? `/api/hr/leave/types/${editingType.id}` : '/api/hr/leave/types';
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save leave type');
      }

      toast({
        title: 'Success',
        description: `Leave type ${editingType ? 'updated' : 'created'} successfully`,
      });

      // Reset form and close dialog
      resetForm();
      setIsFormOpen(false);
      setEditingType(null);

      // Refresh list
      await fetchLeaveTypes();

    } catch (error) {
      console.error('Error saving leave type:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save leave type',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDaysPerYear: 20,
      carryOverDays: 5,
      minNoticeRequired: 1,
      maxConsecutiveDays: '',
      requiresApproval: true,
      approvalLevels: 1,
      accrualRate: 1.67,
      accrualStartDate: 'hire_date',
      allowHalfDays: true,
      allowNegativeBalance: false,
    });
    setErrors({});
  };

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      name: leaveType.name,
      description: leaveType.description || '',
      maxDaysPerYear: leaveType.maxDaysPerYear,
      carryOverDays: leaveType.carryOverDays,
      minNoticeRequired: leaveType.minNoticeRequired,
      maxConsecutiveDays: leaveType.maxConsecutiveDays?.toString() || '',
      requiresApproval: leaveType.requiresApproval,
      approvalLevels: leaveType.approvalLevels,
      accrualRate: leaveType.accrualRate,
      accrualStartDate: leaveType.accrualStartDate,
      allowHalfDays: leaveType.allowHalfDays,
      allowNegativeBalance: leaveType.allowNegativeBalance,
    });
    setEditingType(leaveType);
    setIsFormOpen(true);
  };

  const handleDelete = async (leaveType: LeaveType) => {
    if (!confirm(`Are you sure you want to delete "${leaveType.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/leave/types/${leaveType.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete leave type');
      }

      toast({
        title: 'Success',
        description: 'Leave type deleted successfully',
      });

      await fetchLeaveTypes();

    } catch (error) {
      console.error('Error deleting leave type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete leave type',
        variant: 'destructive',
      });
    }
  };

  const activeTypes = leaveTypes.filter(type => type.isActive);
  const totalApplications = leaveTypes.reduce((sum, type) => sum + type.totalApplications, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Types</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All time applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Types Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Types Management</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchLeaveTypes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => {
                resetForm();
                setEditingType(null);
                setIsFormOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Leave Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No leave types configured</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first leave type to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Max Days/Year</TableHead>
                  <TableHead>Carry Over</TableHead>
                  <TableHead>Notice Required</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{leaveType.name}</div>
                        {leaveType.description && (
                          <div className="text-sm text-muted-foreground">
                            {leaveType.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{leaveType.maxDaysPerYear}</TableCell>
                    <TableCell>{leaveType.carryOverDays}</TableCell>
                    <TableCell>{leaveType.minNoticeRequired} days</TableCell>
                    <TableCell>
                      {leaveType.requiresApproval ? (
                        <Badge variant="secondary">{leaveType.approvalLevels} level(s)</Badge>
                      ) : (
                        <Badge variant="outline">Auto-approve</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={leaveType.isActive ? 'default' : 'secondary'}>
                        {leaveType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{leaveType.totalApplications}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(leaveType)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(leaveType)}
                          disabled={leaveType.totalApplications > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Type Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setIsFormOpen(false);
          setEditingType(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Leave Type' : 'Create Leave Type'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Leave Type Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="e.g., Annual Leave, Sick Leave"
                />
                {errors.name && <span className="text-sm text-red-500">{errors.name}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the leave type"
                  rows={3}
                />
              </div>
            </div>

            {/* Leave Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium">Leave Configuration</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDaysPerYear">Maximum Days Per Year *</Label>
                  <Input
                    id="maxDaysPerYear"
                    type="number"
                    min="1"
                    value={formData.maxDaysPerYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDaysPerYear: parseInt(e.target.value) || 0 }))}
                    className={errors.maxDaysPerYear ? 'border-red-500' : ''}
                  />
                  {errors.maxDaysPerYear && <span className="text-sm text-red-500">{errors.maxDaysPerYear}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carryOverDays">Carry Over Days</Label>
                  <Input
                    id="carryOverDays"
                    type="number"
                    min="0"
                    value={formData.carryOverDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, carryOverDays: parseInt(e.target.value) || 0 }))}
                    className={errors.carryOverDays ? 'border-red-500' : ''}
                  />
                  {errors.carryOverDays && <span className="text-sm text-red-500">{errors.carryOverDays}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minNoticeRequired">Minimum Notice Required (days)</Label>
                  <Input
                    id="minNoticeRequired"
                    type="number"
                    min="0"
                    value={formData.minNoticeRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, minNoticeRequired: parseInt(e.target.value) || 0 }))}
                    className={errors.minNoticeRequired ? 'border-red-500' : ''}
                  />
                  {errors.minNoticeRequired && <span className="text-sm text-red-500">{errors.minNoticeRequired}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConsecutiveDays">Maximum Consecutive Days</Label>
                  <Input
                    id="maxConsecutiveDays"
                    type="number"
                    min="1"
                    value={formData.maxConsecutiveDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxConsecutiveDays: e.target.value }))}
                    className={errors.maxConsecutiveDays ? 'border-red-500' : ''}
                    placeholder="Optional"
                  />
                  {errors.maxConsecutiveDays && <span className="text-sm text-red-500">{errors.maxConsecutiveDays}</span>}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingType ? 'Update Leave Type' : 'Create Leave Type'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
