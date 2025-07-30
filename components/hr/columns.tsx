'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: {
    id: string;
    name: string;
  };
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
    header: 'Employee',
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      const employee = row.original;
      const avatar = row.original.avatar;

      const handleNameClick = () => {
        if (onView) {
          onView(employee);
        } else {
          window.location.href = `/hr/employees/${employee.id}`;
        }
      };

      const getInitials = () => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
      };

      return (
        <div
          className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
          onClick={handleNameClick}
        >
          <Avatar className="h-10 w-10">
            {avatar ? (
              <AvatarImage src={avatar} alt={`${firstName} ${lastName}`} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials() || <User className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground hover:text-primary transition-colors">
              {firstName} {lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {employee.position}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return (
        <span className="text-sm text-muted-foreground">
          {email}
        </span>
      );
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => {
      const employee = row.original;
      const departmentName = employee.department?.name;

      if (!departmentName) {
        return <span className="text-xs text-muted-foreground">Not assigned</span>;
      }

      return (
        <span className="text-sm">
          {departmentName}
        </span>
      );
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
      const status = row.getValue('status') as string || 'active';
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
        window.location.href = `/hr/employees/${emp.id}/leave`;
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
