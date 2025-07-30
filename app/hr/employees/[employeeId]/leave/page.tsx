'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { EmployeeLeaveApplication } from '@/components/hr/employee-leave-application';
import { useToast } from '@/components/ui/use-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department?: {
    name: string;
  };
  avatar?: string;
}

export default function EmployeeLeavePage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/employees/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        } else {
          throw new Error('Failed to fetch employee');
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        toast({
          title: "Error",
          description: "Failed to load employee information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId, toast]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Loading employee leave information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Employee Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The employee you're looking for doesn't exist or you don't have permission to view their information.
            </p>
            <Link href="/hr">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to HR
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/hr/employees/${employeeId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Leave Management
            </h2>
            <p className="text-muted-foreground">
              {employee.firstName} {employee.lastName} • {employee.position}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Employee Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Name</span>
              <p className="font-medium">{employee.firstName} {employee.lastName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Position</span>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Department</span>
              <p className="font-medium">{employee.department?.name || 'No Department'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Management Component */}
      <EmployeeLeaveApplication employeeId={employeeId} />
    </div>
  );
}
