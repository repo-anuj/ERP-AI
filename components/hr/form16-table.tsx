'use client';

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
  FileText,
  User,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Form16Record {
  id: string;
  financialYear: string;
  assessmentYear: string;
  form16Data: any;
  generatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    panNumber?: string;
    department: {
      id: string;
      name: string;
    };
  };
}

interface Form16TableProps {
  data: Form16Record[];
  loading: boolean;
  searchTerm: string;
  onRefresh: () => void;
}

export function Form16Table({
  data,
  loading,
  searchTerm,
  onRefresh,
}: Form16TableProps) {
  // Filter data based on search term
  const filteredData = data.filter((form16) => {
    const matchesSearch = 
      form16.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form16.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form16.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form16.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleDownload = (form16Id: string) => {
    // TODO: Implement Form 16 download
    console.log('Download Form 16:', form16Id);
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
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No Form 16 records found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate Form 16 to see records here.
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
            <TableHead>Financial Year</TableHead>
            <TableHead>Assessment Year</TableHead>
            <TableHead>PAN Number</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((form16) => (
            <TableRow key={form16.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {form16.employee.firstName} {form16.employee.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {form16.employee.employeeId}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>FY {form16.financialYear}</span>
                </div>
              </TableCell>
              <TableCell>
                <span>AY {form16.assessmentYear}</span>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {form16.employee.panNumber || 'Not provided'}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(form16.generatedAt).toLocaleDateString()}
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
                    <DropdownMenuItem onClick={() => handleDownload(form16.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
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
