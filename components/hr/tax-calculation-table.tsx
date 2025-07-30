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
  Calculator, 
  Eye, 
  FileText,
  User,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaxCalculation {
  id: string;
  financialYear: string;
  taxRegime: 'old' | 'new';
  grossAnnualSalary: number;
  taxableIncome: number;
  totalTaxAfterRebate: number;
  monthlyTds: number;
  calculatedAt: string;
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
}

interface TaxCalculationTableProps {
  data: TaxCalculation[];
  loading: boolean;
  searchTerm: string;
  onRefresh: () => void;
  onGenerateForm16: (employeeId: string) => void;
}

export function TaxCalculationTable({
  data,
  loading,
  searchTerm,
  onRefresh,
  onGenerateForm16,
}: TaxCalculationTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Filter data based on search term
  const filteredData = data.filter((calculation) => {
    const matchesSearch = 
      calculation.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calculation.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calculation.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calculation.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-8">
        <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No tax calculations found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Calculate taxes to see records here.
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
            <TableHead>Tax Regime</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Taxable Income</TableHead>
            <TableHead>Annual Tax</TableHead>
            <TableHead>Monthly TDS</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((calculation) => (
            <TableRow key={calculation.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {calculation.employee.firstName} {calculation.employee.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {calculation.employee.employeeId}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={calculation.taxRegime === 'new' ? 'default' : 'secondary'}>
                  {calculation.taxRegime === 'new' ? 'New Regime' : 'Old Regime'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">₹{calculation.grossAnnualSalary?.toLocaleString() || '0'}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">₹{calculation.taxableIncome?.toLocaleString() || '0'}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-red-600">₹{calculation.totalTaxAfterRebate?.toLocaleString() || '0'}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-orange-600">₹{calculation.monthlyTds?.toLocaleString() || '0'}</div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleRowExpansion(calculation.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {expandedRow === calculation.id ? 'Hide Details' : 'View Details'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateForm16(calculation.employee.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Form 16
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
