'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Download, 
  Eye, 
  Mail,
  FileText,
  User,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

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

interface PayslipTableProps {
  data: Payslip[];
  loading: boolean;
  onDownload: (payslipId: string) => void;
  onRefresh: () => void;
}

export function PayslipTable({
  data,
  loading,
  onDownload,
  onRefresh,
}: PayslipTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || 'Unknown';
  };

  const getNetSalary = (payslipData: any) => {
    return payslipData?.summary?.netSalary || 0;
  };

  const getGrossSalary = (payslipData: any) => {
    return payslipData?.summary?.grossSalary || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No payslips found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate payslips to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Payslip Number</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Email Status</TableHead>
            <TableHead>Downloads</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payslip) => (
            <>
              <TableRow key={payslip.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{payslip.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {payslip.employeeId_}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{payslip.payslipNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{getMonthName(payslip.payroll.payrollMonth)} {payslip.payroll.payrollYear}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">₹{getGrossSalary(payslip.payslipData).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-green-600">₹{getNetSalary(payslip.payslipData).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={payslip.emailSent ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                    {payslip.emailSent ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Sent
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Not Sent
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{payslip.downloadCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleRowExpansion(payslip.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {expandedRow === payslip.id ? 'Hide Details' : 'View Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(payslip.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!payslip.employee.email}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              {/* Expanded Row Details */}
              {expandedRow === payslip.id && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-muted/30">
                    <div className="p-4 space-y-4">
                      <h4 className="font-semibold">Payslip Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Employee Information */}
                        <div>
                          <h5 className="font-medium text-blue-600 mb-2">Employee Information</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Name:</span>
                              <span>{payslip.employeeName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Employee ID:</span>
                              <span>{payslip.employeeId_}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Designation:</span>
                              <span>{payslip.designation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Department:</span>
                              <span>{payslip.department || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span>{payslip.employee.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Salary Information */}
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Salary Information</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Gross Salary:</span>
                              <span>₹{getGrossSalary(payslip.payslipData).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Deductions:</span>
                              <span>₹{(payslip.payslipData?.summary?.totalDeductions || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Net Salary:</span>
                              <span>₹{getNetSalary(payslip.payslipData).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cost to Company:</span>
                              <span>₹{(payslip.payslipData?.summary?.costToCompany || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Generation & Status */}
                        <div>
                          <h5 className="font-medium text-purple-600 mb-2">Generation & Status</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Generated At:</span>
                              <span>{formatDate(payslip.generatedAt)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Email Sent:</span>
                              <span>
                                {payslip.emailSent ? (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    No
                                  </Badge>
                                )}
                              </span>
                            </div>
                            {payslip.emailSentAt && (
                              <div className="flex justify-between">
                                <span>Email Sent At:</span>
                                <span>{formatDate(payslip.emailSentAt)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Download Count:</span>
                              <span>{payslip.downloadCount}</span>
                            </div>
                            {payslip.lastDownloadAt && (
                              <div className="flex justify-between">
                                <span>Last Downloaded:</span>
                                <span>{formatDate(payslip.lastDownloadAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bank Information */}
                      {(payslip.bankAccount || payslip.bankName) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h6 className="font-medium text-blue-800 mb-2">Bank Information</h6>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600">Bank Name:</span>
                              <div>{payslip.bankName || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-blue-600">Account Number:</span>
                              <div>{payslip.bankAccount || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" onClick={() => onDownload(payslip.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button size="sm" variant="outline" disabled={!payslip.employee.email}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
