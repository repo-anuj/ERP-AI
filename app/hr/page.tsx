'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { AddEmployeeDialog } from '@/components/hr/add-employee-dialog';
import { DataTable } from '@/components/hr/data-table';
import { columns, Employee } from '@/components/hr/columns';
import { EditEmployeeModal } from '@/components/hr/edit-employee-modal';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesResponse = await fetch('/api/employees');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          
          // Format the employee data for the table
          const formattedEmployees = employeesData.map((employee: any) => ({
            ...employee,
            startDate: employee.startDate, // The date will be formatted in the column cell
          }));
          
          setEmployees(formattedEmployees);
        }
        
        // Fetch departments
        const departmentsResponse = await fetch('/api/departments');
        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error('Error fetching HR data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load HR data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleEditSuccess = () => {
    handleCloseEditModal();
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesResponse = await fetch('/api/employees');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          
          // Format the employee data for the table
          const formattedEmployees = employeesData.map((employee: any) => ({
            ...employee,
            startDate: employee.startDate, // The date will be formatted in the column cell
          }));
          
          setEmployees(formattedEmployees);
        }
        
        // Fetch departments
        const departmentsResponse = await fetch('/api/departments');
        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error('Error fetching HR data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load HR data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Human Resources</h2>
        <AddEmployeeDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : employees.length > 0 ? (
              <div className="text-center">
                <div className="text-3xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total employees</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No employees yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Add First Employee
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : departments.length > 0 ? (
              <div className="text-center">
                <div className="text-3xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active departments</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No departments yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Create Department
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : employees.length > 0 ? (
              <div className="text-center">
                <div className="text-3xl font-bold">N/A</div>
                <p className="text-xs text-muted-foreground mt-1">Attendance tracking not set up</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Set Up Tracking
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No attendance data yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Track Attendance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : employees.length > 0 ? (
              <div className="text-center">
                <div className="text-3xl font-bold">+{employees.length}</div>
                <p className="text-xs text-muted-foreground mt-1">New employees this year</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No growth data yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  View Analytics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading employee data...</p>
            </div>
          ) : employees.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={employees} 
              onEdit={handleOpenEditModal} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-center space-y-3">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No Employee Data Available</h3>
                <p className="text-sm text-muted-foreground">
                  Start adding employees to see your workforce metrics and analytics.
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Employee
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
