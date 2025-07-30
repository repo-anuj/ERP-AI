'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Download, 
  Mail, 
  Calendar, 
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayslipGenerateDialog } from '@/components/hr/payslip-generate-dialog';
import { PayslipTable } from '@/components/hr/payslip-table';

interface Payslip {
  id: string;
  payslipNumber: string;
  employeeName: string;
  employeeId_: string;
  designation: string;
  department?: string;
  bankAccount?: string;
  bankName?: string;
  payslipData: any;
  generatedAt: string;
  generatedBy?: string;
  emailSent: boolean;
  emailSentAt?: string;
  downloadCount: number;
  lastDownloadAt?: string;
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
  payroll: {
    id: string;
    payrollMonth: number;
    payrollYear: number;
    status: string;
    netSalary: number;
    grossSalary: number;
    totalDeductions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
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

  // Fetch payslips
  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      
      const response = await fetch(`/api/hr/payslips?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payslips');
      }
      
      const data = await response.json();
      setPayslips(data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payslips',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [selectedYear, selectedMonth]);

  // Filter payslips based on search
  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch = 
      payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.employeeId_.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.payslipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payslip.department && payslip.department.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Calculate summary statistics
  const totalPayslips = filteredPayslips.length;
  const emailsSent = filteredPayslips.filter(p => p.emailSent).length;
  const totalDownloads = filteredPayslips.reduce((sum, p) => sum + p.downloadCount, 0);
  const totalNetSalary = filteredPayslips.reduce((sum, p) => {
    const payslipData = p.payslipData as any;
    return sum + (payslipData?.summary?.netSalary || 0);
  }, 0);

  const handleGenerateSuccess = () => {
    fetchPayslips();
    setIsGenerateDialogOpen(false);
  };

  const handleDownload = async (payslipId: string) => {
    try {
      const response = await fetch(`/api/hr/payslips/${payslipId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download payslip');
      }

      const htmlContent = await response.text();
      
      // Create a new window and write the HTML content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: 'Success',
        description: 'Payslip opened for download/print',
      });

      // Refresh the list to update download count
      fetchPayslips();
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast({
        title: 'Error',
        description: 'Failed to download payslip',
        variant: 'destructive',
      });
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const response = await fetch('/api/hr/payslips/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          sendEmail: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate payslips');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `Generated ${result.results.generated} payslips successfully`,
      });

      fetchPayslips();
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate payslips',
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
          <h1 className="text-3xl font-bold">Payslip Management</h1>
          <p className="text-muted-foreground">
            Generate and manage employee payslips for {getSelectedMonthName()} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkGenerate}>
            <Plus className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Payslips
          </Button>
        </div>
      </div>

      {/* Date Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payslip Period
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

            <div className="flex-1 flex items-end">
              <Button variant="outline" onClick={fetchPayslips} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayslips}</div>
            <p className="text-xs text-muted-foreground">
              Generated this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailsSent}</div>
            <p className="text-xs text-muted-foreground">
              Out of {totalPayslips} payslips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Download count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalNetSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, payslip number, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips ({filteredPayslips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PayslipTable
            data={filteredPayslips}
            loading={loading}
            onDownload={handleDownload}
            onRefresh={fetchPayslips}
          />
        </CardContent>
      </Card>

      {/* Generate Payslips Dialog */}
      <PayslipGenerateDialog
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        onSuccess={handleGenerateSuccess}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth}
      />
    </div>
  );
}
