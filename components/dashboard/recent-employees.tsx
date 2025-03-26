'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface RecentEmployeesProps {
  data?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
    createdAt: string | Date;
  }>;
}

export function RecentEmployees({ data }: RecentEmployeesProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Employees</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <Users className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">No employees yet</h3>
            <p className="text-sm text-muted-foreground">
              Start adding employees to build your team
            </p>
          </div>
          <Link href="/hr">
            <Button variant="outline" className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Employee
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((employee) => {
        const hireDate = new Date(employee.createdAt);
        const formattedDate = formatDate(hireDate);
        const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
        
        return (
          <div key={employee.id} className="flex items-center">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none truncate">
                  {employee.firstName} {employee.lastName}
                </p>
                <Badge variant="outline" className="ml-2 text-xs">
                  {formattedDate}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {employee.position} • {employee.department}
              </p>
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 text-center border-t">
        <Link href="/hr">
          <Button variant="ghost" size="sm" className="gap-1">
            <Users className="h-4 w-4" />
            View all employees
          </Button>
        </Link>
      </div>
    </div>
  );
}
