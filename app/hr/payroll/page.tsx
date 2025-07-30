'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle as Play,
  Search,
  Filter,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Calculator
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayrollProcessDialog } from '@/components/hr/payroll-process-dialog';
import { PayrollTable } from '@/components/hr/payroll-table';
import { PayrollAnalytics } from '@/components/hr/payroll-analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PayrollRecord {
  id: string;
  payrollMonth: number;
  payrollYear: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  tds: number;
  totalDeductions: number;
  bonus: number;
  incentives: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid' | 'cancelled';
  paymentDate?: string;
  paymentMode?: string;
  paymentReference?: string;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Month options
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

  // Fetch payroll records
  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/hr/payroll?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll records');
      }
      
      const data = await response.json();
      setPayrollRecords(data);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRecords();
  }, [selectedYear, selectedMonth, statusFilter]);

  // Filter payroll records based on search
  const filteredRecords = payrollRecords.filter((record) => {
    const matchesSearch = 
      record.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Calculate summary statistics
  const totalRecords = filteredRecords.length;
  const totalGrossSalary = filteredRecords.reduce((sum, record) => sum + record.grossSalary, 0);
  const totalNetSalary = filteredRecords.reduce((sum, record) => sum + record.netSalary, 0);
  const totalDeductions = filteredRecords.reduce((sum, record) => sum + record.totalDeductions, 0);
  const totalCTC = filteredRecords.reduce((sum, record) => 
    sum + record.grossSalary + record.pfEmployer + record.esiEmployer, 0);

  // Status counts
  const statusCounts = {
    draft: filteredRecords.filter(r => r.status === 'draft').length,
    processed: filteredRecords.filter(r => r.status === 'processed').length,
    paid: filteredRecords.filter(r => r.status === 'paid').length,
    cancelled: filteredRecords.filter(r => r.status === 'cancelled').length,
  };

  const handleProcessSuccess = () => {
    fetchPayrollRecords();
    setIsProcessDialogOpen(false);
  };

  const handleBulkAction = async (action: 'approve' | 'pay' | 'cancel') => {
    if (selectedRecords.length === 0) {
      toast({
        title: 'No Records Selected',
        description: 'Please select payroll records to process',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/hr/payroll/bulk-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          payrollIds: selectedRecords,
          paymentDate: new Date().toISOString(),
          paymentMode: 'bank_transfer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payroll records');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `${result.results.processed} records processed successfully`,
      });

      if (result.results.failed > 0) {
        toast({
          title: 'Partial Success',
          description: `${result.results.failed} records failed to process`,
          variant: 'destructive',
        });
      }

      setSelectedRecords([]);
      fetchPayrollRecords();
    } catch (error) {
      console.error('Error processing payroll records:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payroll records',
        variant: 'destructive',
      });
    }
  };

  const getSelectedMonthName = () => {
    const month = monthOptions.find(m => m.value === selectedMonth);
    return month ? month.label : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Process and manage employee payroll for {getSelectedMonthName()} {selectedYear}
          </p>
        </div>
        <Button onClick={() => setIsProcessDialogOpen(true)}>
          <Play className="h-4 w-4 mr-2" />
          Process Payroll
        </Button>
      </div>

      {/* Date Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {statusCounts.draft} Draft
              </Badge>
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {statusCounts.paid} Paid
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalGrossSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Before deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalNetSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              After deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CTC</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCTC.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Cost to Company
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* Search and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name, ID, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkAction('approve')}
                    disabled={selectedRecords.length === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                  <Button 
                    onClick={() => handleBulkAction('pay')}
                    disabled={selectedRecords.length === 0}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records ({filteredRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollTable
                data={filteredRecords}
                loading={loading}
                selectedRecords={selectedRecords}
                onSelectionChange={setSelectedRecords}
                onRefresh={fetchPayrollRecords}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PayrollAnalytics 
            year={selectedYear} 
            month={selectedMonth}
          />
        </TabsContent>
      </Tabs>

      {/* Process Payroll Dialog */}
      <PayrollProcessDialog
        open={isProcessDialogOpen}
        onClose={() => setIsProcessDialogOpen(false)}
        onSuccess={handleProcessSuccess}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth}
      />
    </div>
  );
}
