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
import { MoreHorizontal, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  assignments?: { id: string; name: string }[];

  // Extended fields
  employeeId?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  personalEmail?: string;
  alternatePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  jobTitle?: string;
  workLocation?: string;
  manager?: string;
  hireDate?: string;
  probationEndDate?: string;
  contractType?: string;
  workType?: string;
  skills?: string[];
  bio?: string;
  notes?: string;
};

// Make columns a function that accepts callbacks
export const columns = (
  onEdit: (employee: Employee) => void,
  onView?: (employee: Employee) => void
): ColumnDef<Employee>[] => [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      const employee = row.original;

      const handleNameClick = () => {
        if (onView) {
          onView(employee);
        } else {
          window.location.href = `/hr/employees/${employee.id}`;
        }
      };

      return (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={handleNameClick}
        >
          {firstName} {lastName}
        </div>
      );
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
            <Badge key={assignment.id} variant="outline">
              {assignment.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const employee = row.original; // Get the full employee object

      // Handle view profile
      const handleViewProfile = (emp: Employee) => {
        if (onView) {
          onView(emp);
        } else {
          // Fallback to direct navigation
          window.location.href = `/hr/employees/${emp.id}`;
        }
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
