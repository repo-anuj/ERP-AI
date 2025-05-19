'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  startDate: string;
  salary?: number;
  status: string;
  role?: string;
  password?: string;
  permissions?: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Add the assignments field based on the API response
  assignments?: { project: { id: string; name: string } }[];
};

// Make columns a function that accepts callbacks
export const columns = (
  onEdit: (employee: Employee) => void
  // Add onView, onManageLeave later
): ColumnDef<Employee>[] => [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      return `${firstName} ${lastName}`;
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'position',
    header: 'Position',
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => {
      const department = row.getValue('department') as string;
      return department.charAt(0).toUpperCase() + department.slice(1);
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.getValue('startDate') as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  // Add column for assigned projects
  {
    id: 'projects',
    header: 'Assigned Projects',
    cell: ({ row }) => {
      const assignments = row.original.assignments;
      if (!assignments || assignments.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {assignments.map((assignment) => (
            assignment.project ? (
              <Badge key={assignment.project.id} variant="outline">
                {assignment.project.name}
              </Badge>
            ) : (
              <Badge key={`unknown-${Math.random()}`} variant="outline" className="text-muted-foreground">
                Unknown Project
              </Badge>
            )
          ))}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const employee = row.original; // Get the full employee object

      // Placeholder functions - These would eventually open modals/pages
      const handleViewProfile = (emp: Employee) => {
        alert(`Viewing profile for: ${emp.firstName} ${emp.lastName} (ID: ${emp.id})`);
        // TODO: Implement actual navigation or modal opening
      };

      const handleEditDetails = (emp: Employee) => {
        onEdit(emp); // Call the passed-in function
      };

      const handleManageLeave = (emp: Employee) => {
        alert(`Managing leave for: ${emp.firstName} ${emp.lastName} (ID: ${emp.id})`);
        // TODO: Implement actual leave management interface
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewProfile(employee)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditDetails(employee)}>
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleManageLeave(employee)}>
              Manage Leave
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
