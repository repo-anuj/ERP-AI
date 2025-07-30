'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileText, Calendar, Users, Building } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Department {
  id: string;
  name: string;
}

interface LeaveType {
  id: string;
  name: string;
}

interface LeaveDataExportProps {
  open: boolean;
  onClose: () => void;
}

export function LeaveDataExport({
  open,
  onClose,
}: LeaveDataExportProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Export configuration
  const [exportConfig, setExportConfig] = useState({
    reportType: 'applications', // applications, balances, summary
    dateRange: 'current_month', // current_month, last_month, current_year, last_year, custom
    startDate: '',
    endDate: '',
    departmentId: 'all',
    leaveTypeId: 'all',
    status: 'all', // all, pending, approved, rejected
    format: 'excel', // excel, csv, pdf
    includeFields: {
      employeeDetails: true,
      leaveDetails: true,
      approvalDetails: true,
      balanceDetails: false,
      attachments: false,
    },
  });

  // Fetch departments and leave types when dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchLeaveTypes();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const getDateRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (exportConfig.dateRange) {
      case 'current_month':
        return {
          startDate: format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd'),
          endDate: format(new Date(currentYear, currentMonth + 1, 0), 'yyyy-MM-dd'),
        };
      case 'last_month':
        return {
          startDate: format(new Date(currentYear, currentMonth - 1, 1), 'yyyy-MM-dd'),
          endDate: format(new Date(currentYear, currentMonth, 0), 'yyyy-MM-dd'),
        };
      case 'current_year':
        return {
          startDate: format(new Date(currentYear, 0, 1), 'yyyy-MM-dd'),
          endDate: format(new Date(currentYear, 11, 31), 'yyyy-MM-dd'),
        };
      case 'last_year':
        return {
          startDate: format(new Date(currentYear - 1, 0, 1), 'yyyy-MM-dd'),
          endDate: format(new Date(currentYear - 1, 11, 31), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          startDate: exportConfig.startDate,
          endDate: exportConfig.endDate,
        };
      default:
        return {
          startDate: format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd'),
          endDate: format(new Date(currentYear, currentMonth + 1, 0), 'yyyy-MM-dd'),
        };
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const dateRange = getDateRange();
      const params = new URLSearchParams();

      // Add parameters based on report type
      if (exportConfig.reportType === 'applications') {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
        
        if (exportConfig.departmentId !== 'all') {
          params.append('departmentId', exportConfig.departmentId);
        }
        
        if (exportConfig.leaveTypeId !== 'all') {
          params.append('leaveTypeId', exportConfig.leaveTypeId);
        }
        
        if (exportConfig.status !== 'all') {
          params.append('status', exportConfig.status);
        }
      }

      params.append('format', exportConfig.format);

      let endpoint = '';
      switch (exportConfig.reportType) {
        case 'applications':
          endpoint = '/api/hr/leave/export/applications';
          break;
        case 'balances':
          endpoint = '/api/hr/leave/export/balances';
          break;
        case 'summary':
          endpoint = '/api/hr/leave/export/summary';
          break;
        default:
          endpoint = '/api/hr/leave/export/applications';
      }

      const response = await fetch(`${endpoint}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Handle file download
      if (exportConfig.format === 'excel' || exportConfig.format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave-${exportConfig.reportType}-${format(new Date(), 'yyyy-MM-dd')}.${exportConfig.format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For JSON format, show the data
        const data = await response.json();
        console.log('Export data:', data);
      }

      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });

      onClose();

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const reportTypes = [
    { value: 'applications', label: 'Leave Applications', icon: Calendar },
    { value: 'balances', label: 'Leave Balances', icon: Users },
    { value: 'summary', label: 'Summary Report', icon: FileText },
  ];

  const dateRangeOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV (.csv)' },
    { value: 'json', label: 'JSON (.json)' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Leave Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label>Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.value}
                    className={`cursor-pointer transition-colors ${
                      exportConfig.reportType === type.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setExportConfig(prev => ({ ...prev, reportType: type.value }))}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-sm">{type.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select 
              value={exportConfig.dateRange} 
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {exportConfig.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={exportConfig.startDate}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={exportConfig.endDate}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select 
                value={exportConfig.departmentId} 
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, departmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select 
                value={exportConfig.leaveTypeId} 
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, leaveTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leave Types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Filter (for applications only) */}
          {exportConfig.reportType === 'applications' && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={exportConfig.status} 
                onValueChange={(value) => setExportConfig(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select 
              value={exportConfig.format} 
              onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include Fields */}
          <div className="space-y-3">
            <Label>Include Fields</Label>
            <div className="space-y-2">
              {Object.entries(exportConfig.includeFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={field}
                    checked={checked}
                    onChange={(e) =>
                      setExportConfig(prev => ({
                        ...prev,
                        includeFields: {
                          ...prev.includeFields,
                          [field]: e.target.checked,
                        }
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor={field} className="text-sm">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
