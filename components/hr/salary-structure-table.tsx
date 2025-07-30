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
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign as IndianRupee,
  User,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';

interface SalaryStructure {
  id: string;
  basicSalary: number;
  hra?: number;
  conveyance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  professionalTax?: number;
  tdsRate?: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface SalaryStructureTableProps {
  data: SalaryStructure[];
  loading: boolean;
  onEdit: (structure: SalaryStructure) => void;
  onDelete: (id: string) => void;
}

export function SalaryStructureTable({
  data,
  loading,
  onEdit,
  onDelete,
}: SalaryStructureTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const calculateGrossSalary = (structure: SalaryStructure) => {
    return structure.basicSalary + 
           (structure.hra || 0) + 
           (structure.conveyance || 0) + 
           (structure.medicalAllowance || 0) + 
           (structure.specialAllowance || 0);
  };

  const calculateDeductions = (structure: SalaryStructure) => {
    const grossSalary = calculateGrossSalary(structure);
    const pfEmployee = structure.pfApplicable ? structure.basicSalary * structure.pfEmployeeRate : 0;
    const esiEmployee = structure.esiApplicable ? grossSalary * structure.esiEmployeeRate : 0;
    const professionalTax = structure.professionalTax || 0;
    
    return pfEmployee + esiEmployee + professionalTax;
  };

  const calculateNetSalary = (structure: SalaryStructure) => {
    return calculateGrossSalary(structure) - calculateDeductions(structure);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
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
        <IndianRupee className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No salary structures</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating a new salary structure.
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
            <TableHead>Department</TableHead>
            <TableHead>Basic Salary</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Effective Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((structure) => (
            <>
              <TableRow key={structure.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {structure.employee.firstName} {structure.employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {structure.employee.employeeId}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{structure.employee.department.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">₹{structure.basicSalary.toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">₹{calculateGrossSalary(structure).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-green-600">
                    ₹{calculateNetSalary(structure).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div>{formatDate(structure.effectiveFrom)}</div>
                      {structure.effectiveTo && (
                        <div className="text-muted-foreground">
                          to {formatDate(structure.effectiveTo)}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={structure.isActive ? 'default' : 'secondary'}>
                    {structure.isActive ? 'Active' : 'Inactive'}
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
                      <DropdownMenuItem onClick={() => toggleRowExpansion(structure.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {expandedRow === structure.id ? 'Hide Details' : 'View Details'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(structure)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(structure.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              
              {/* Expanded Row Details */}
              {expandedRow === structure.id && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-muted/30">
                    <div className="p-4 space-y-4">
                      <h4 className="font-semibold">Salary Breakdown</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Earnings */}
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Earnings</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Basic Salary:</span>
                              <span>₹{structure.basicSalary.toLocaleString()}</span>
                            </div>
                            {structure.hra && (
                              <div className="flex justify-between">
                                <span>HRA:</span>
                                <span>₹{structure.hra.toLocaleString()}</span>
                              </div>
                            )}
                            {structure.conveyance && (
                              <div className="flex justify-between">
                                <span>Conveyance:</span>
                                <span>₹{structure.conveyance.toLocaleString()}</span>
                              </div>
                            )}
                            {structure.medicalAllowance && (
                              <div className="flex justify-between">
                                <span>Medical:</span>
                                <span>₹{structure.medicalAllowance.toLocaleString()}</span>
                              </div>
                            )}
                            {structure.specialAllowance && (
                              <div className="flex justify-between">
                                <span>Special:</span>
                                <span>₹{structure.specialAllowance.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Gross Salary:</span>
                              <span>₹{calculateGrossSalary(structure).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">Deductions</h5>
                          <div className="space-y-1 text-sm">
                            {structure.pfApplicable && (
                              <div className="flex justify-between">
                                <span>PF (Employee):</span>
                                <span>₹{(structure.basicSalary * structure.pfEmployeeRate).toLocaleString()}</span>
                              </div>
                            )}
                            {structure.esiApplicable && (
                              <div className="flex justify-between">
                                <span>ESI (Employee):</span>
                                <span>₹{(calculateGrossSalary(structure) * structure.esiEmployeeRate).toLocaleString()}</span>
                              </div>
                            )}
                            {structure.professionalTax && (
                              <div className="flex justify-between">
                                <span>Professional Tax:</span>
                                <span>₹{structure.professionalTax.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Total Deductions:</span>
                              <span>₹{calculateDeductions(structure).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Net & Employer Costs */}
                        <div>
                          <h5 className="font-medium text-blue-600 mb-2">Summary</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between font-medium text-green-600">
                              <span>Net Salary:</span>
                              <span>₹{calculateNetSalary(structure).toLocaleString()}</span>
                            </div>
                            {structure.pfApplicable && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Employer PF:</span>
                                <span>₹{(structure.basicSalary * structure.pfEmployerRate).toLocaleString()}</span>
                              </div>
                            )}
                            {structure.esiApplicable && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Employer ESI:</span>
                                <span>₹{(calculateGrossSalary(structure) * structure.esiEmployerRate).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Cost to Company:</span>
                              <span>₹{(
                                calculateGrossSalary(structure) + 
                                (structure.pfApplicable ? structure.basicSalary * structure.pfEmployerRate : 0) +
                                (structure.esiApplicable ? calculateGrossSalary(structure) * structure.esiEmployerRate : 0)
                              ).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
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
