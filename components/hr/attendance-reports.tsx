'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Download, 
  Calendar, 
  FileText,
  TrendingUp,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface ReportData {
  reportType: string;
  period: {
    startDate: string;
    endDate: string;
    month?: string;
  };
  summary: any;
  employees?: any[];
  dailyReports?: any[];
  records?: any[];
}

export function AttendanceReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const { toast } = useToast();

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        month: selectedMonth,
        ...(departmentFilter !== 'all' && { departmentId: departmentFilter }),
      });

      const response = await fetch(`/api/hr/attendance/reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedMonth, departmentFilter]);

  // Export report
  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        month: selectedMonth,
        format: 'excel',
        ...(departmentFilter !== 'all' && { departmentId: departmentFilter }),
      });

      const response = await fetch(`/api/hr/attendance/reports/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${reportType}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const renderMonthlyReport = () => {
    if (!reportData || reportData.reportType !== 'monthly') return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(reportData.summary.averageAttendance)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(reportData.summary.totalHours)}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(reportData.summary.totalOvertimeHours)}h
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.employees?.map((employee) => (
                <div key={employee.employee.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{employee.employee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee.employeeId} • {employee.employee.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(employee.statistics.attendancePercentage)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{employee.statistics.presentDays}</div>
                      <div className="text-muted-foreground">Present Days</div>
                    </div>
                    <div>
                      <div className="font-medium">{employee.statistics.absentDays}</div>
                      <div className="text-muted-foreground">Absent Days</div>
                    </div>
                    <div>
                      <div className="font-medium">{employee.statistics.lateDays}</div>
                      <div className="text-muted-foreground">Late Days</div>
                    </div>
                    <div>
                      <div className="font-medium">{Math.round(employee.statistics.totalHours)}h</div>
                      <div className="text-muted-foreground">Total Hours</div>
                    </div>
                    <div>
                      <div className="font-medium">{Math.round(employee.statistics.totalOvertimeHours)}h</div>
                      <div className="text-muted-foreground">Overtime</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSummaryReport = () => {
    if (!reportData || reportData.reportType !== 'summary') return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{reportData.summary.totalEmployees}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{reportData.summary.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(reportData.summary.attendancePercentage)}%
                </div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(reportData.summary.overtimeStats.totalOvertimeHours)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Overtime</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-4">Status Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(reportData.summary.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold">{count as number}</div>
                    <div className="text-sm text-muted-foreground capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderOvertimeReport = () => {
    if (!reportData || reportData.reportType !== 'overtime') return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overtime Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{reportData.summary.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Overtime Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(reportData.summary.totalOvertimeHours)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Overtime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(reportData.summary.averageOvertimeHours * 10) / 10}h
                </div>
                <div className="text-sm text-muted-foreground">Average Overtime</div>
              </div>
            </div>

            <div className="space-y-2">
              {reportData.records?.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{record.employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.employee.employeeId} • {record.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">{record.overtimeHours}h</div>
                    <div className="text-sm text-muted-foreground">
                      {record.checkIn} - {record.checkOut}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="overtime">Overtime Report</SelectItem>
                <SelectItem value="late-arrivals">Late Arrivals</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={fetchReportData} disabled={loading}>
              <BarChart className="h-4 w-4 mr-2" />
              Generate Report
            </Button>

            <Button variant="outline" onClick={handleExportReport} disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reportData ? (
        <div>
          {reportType === 'monthly' && renderMonthlyReport()}
          {reportType === 'summary' && renderSummaryReport()}
          {reportType === 'overtime' && renderOvertimeReport()}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No report data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a report to see attendance analytics.
          </p>
        </div>
      )}
    </div>
  );
}
