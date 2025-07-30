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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Download,
  DollarSign,
  User,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

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

interface PayrollTableProps {
  data: PayrollRecord[];
  loading: boolean;
  selectedRecords: string[];
  onSelectionChange: (selected: string[]) => void;
  onRefresh: () => void;
}

export function PayrollTable({
  data,
  loading,
  selectedRecords,
  onSelectionChange,
  onRefresh,
}: PayrollTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processed':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'processed':
        return 'secondary';
      case 'paid':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(record => record.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRecords, recordId]);
    } else {
      onSelectionChange(selectedRecords.filter(id => id !== recordId));
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || 'Unknown';
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
        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No payroll records</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Process payroll to see records here.
        </p>
      </div>
    );
  }

  const allSelected = data.length > 0 && selectedRecords.length === data.length;
  const someSelected = selectedRecords.length > 0 && selectedRecords.length < data.length;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    const input = el.querySelector('input');
                    if (input) input.indeterminate = someSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <>
              <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {record.employee.firstName} {record.employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.employee.employeeId}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{record.employee.department.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{getMonthName(record.payrollMonth)} {record.payrollYear}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">₹{record.grossSalary.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-red-600">₹{record.totalDeductions.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-green-600">₹{record.netSalary.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(record.status)} className="flex items-center gap-1">
                    {getStatusIcon(record.status)}
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleRowExpansion(record.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {expandedRow === record.id ? 'Hide Details' : 'View Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Payslip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              {/* Expanded Row Details */}
              {expandedRow === record.id && (
                <TableRow>
                  <TableCell colSpan={9} className="bg-muted/30">
                    <div className="p-4 space-y-4">
                      <h4 className="font-semibold">Detailed Payroll Breakdown</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Earnings */}
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Earnings</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Basic Salary:</span>
                              <span>₹{record.basicSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>HRA:</span>
                              <span>₹{record.hra.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Conveyance:</span>
                              <span>₹{record.conveyance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medical:</span>
                              <span>₹{record.medicalAllowance.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Special:</span>
                              <span>₹{record.specialAllowance.toLocaleString()}</span>
                            </div>
                            {record.bonus > 0 && (
                              <div className="flex justify-between">
                                <span>Bonus:</span>
                                <span>₹{record.bonus.toLocaleString()}</span>
                              </div>
                            )}
                            {record.incentives > 0 && (
                              <div className="flex justify-between">
                                <span>Incentives:</span>
                                <span>₹{record.incentives.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Gross Salary:</span>
                              <span>₹{record.grossSalary.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">Deductions</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>PF (Employee):</span>
                              <span>₹{record.pfEmployee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ESI (Employee):</span>
                              <span>₹{record.esiEmployee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Professional Tax:</span>
                              <span>₹{record.professionalTax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>TDS:</span>
                              <span>₹{record.tds.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Total Deductions:</span>
                              <span>₹{record.totalDeductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Attendance & Summary */}
                        <div>
                          <h5 className="font-medium text-blue-600 mb-2">Attendance & Summary</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Working Days:</span>
                              <span>{record.workingDays}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Present Days:</span>
                              <span>{record.presentDays}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Leave Days:</span>
                              <span>{record.leaveDays}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>LOP Days:</span>
                              <span>{record.lopDays}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1 text-green-600">
                              <span>Net Salary:</span>
                              <span>₹{record.netSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Employer PF:</span>
                              <span>₹{record.pfEmployer.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Employer ESI:</span>
                              <span>₹{record.esiEmployer.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Cost to Company:</span>
                              <span>₹{(record.grossSalary + record.pfEmployer + record.esiEmployer).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      {record.status === 'paid' && record.paymentDate && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <h6 className="font-medium text-green-800 mb-2">Payment Details</h6>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-600">Payment Date:</span>
                              <div>{formatDate(record.paymentDate)}</div>
                            </div>
                            <div>
                              <span className="text-green-600">Payment Mode:</span>
                              <div>{record.paymentMode || 'Bank Transfer'}</div>
                            </div>
                            <div>
                              <span className="text-green-600">Reference:</span>
                              <div>{record.paymentReference || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      )}
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
