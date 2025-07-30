'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';

interface TaxDeclaration {
  id: string;
  financialYear: string;
  section80C: number;
  section80D: number;
  taxRegime: 'old' | 'new';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
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

interface TaxDeclarationTableProps {
  data: TaxDeclaration[];
  loading: boolean;
  searchTerm: string;
  onRefresh: () => void;
}

export function TaxDeclarationTable({
  data,
  loading,
  searchTerm,
  onRefresh,
}: TaxDeclarationTableProps) {
  // Filter data based on search term
  const filteredData = data.filter((declaration) => {
    const matchesSearch = 
      declaration.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'submitted':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No tax declarations found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit tax declarations to see records here.
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
            <TableHead>Section 80C</TableHead>
            <TableHead>Section 80D</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((declaration) => (
            <TableRow key={declaration.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {declaration.employee.firstName} {declaration.employee.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {declaration.employee.employeeId}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={declaration.taxRegime === 'new' ? 'default' : 'secondary'}>
                  {declaration.taxRegime === 'new' ? 'New Regime' : 'Old Regime'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">₹{declaration.section80C.toLocaleString()}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">₹{declaration.section80D.toLocaleString()}</div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(declaration.status)}>
                  {declaration.status.charAt(0).toUpperCase() + declaration.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {declaration.submittedAt 
                    ? new Date(declaration.submittedAt).toLocaleDateString()
                    : 'Not submitted'
                  }
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
