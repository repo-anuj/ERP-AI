'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Users, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  position: string;
  startDate: string;
  department: {
    id: string;
    name: string;
  } | null;
}

interface MissingSalaryStructuresData {
  employeesWithoutSalaryStructures: Employee[];
  employeesWithSalaryStructures: Employee[];
  summary: {
    totalEmployees: number;
    withSalaryStructures: number;
    withoutSalaryStructures: number;
  };
}

export default function MissingSalaryStructuresPage() {
  const [data, setData] = useState<MissingSalaryStructuresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMissingSalaryStructures();
  }, []);

  const fetchMissingSalaryStructures = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/employees/missing-salary-structures');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSalaryStructure = (employeeId: string) => {
    router.push(`/hr/salary-structures/create?employeeId=${employeeId}`);
  };

  const handleBulkCreate = () => {
    if (data?.employeesWithoutSalaryStructures.length) {
      const employeeIds = data.employeesWithoutSalaryStructures.map(emp => emp.id);
      router.push(`/hr/salary-structures/bulk-create?employeeIds=${employeeIds.join(',')}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Structure Management</h1>
          <p className="text-muted-foreground">
            Manage employees who need salary structures for payroll processing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Salary Structures</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {data.summary.withSalaryStructures}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.withSalaryStructures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Salary Structures</CardTitle>
            <Badge variant="destructive">
              {data.summary.withoutSalaryStructures}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.withoutSalaryStructures}</div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Salary Structures */}
      {data.employeesWithoutSalaryStructures.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Employees Missing Salary Structures
                </CardTitle>
                <CardDescription>
                  These employees need salary structures before payroll can be processed
                </CardDescription>
              </div>
              <Button onClick={handleBulkCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Bulk Create
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.employeesWithoutSalaryStructures.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {employee.employeeId} • {employee.position}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.department?.name || 'No Department'} • {employee.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreateSalaryStructure(employee.id)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Salary Structure
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {data.employeesWithoutSalaryStructures.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Great! All employees have salary structures assigned. You can now process payroll for all employees.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
