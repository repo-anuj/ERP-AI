'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { SalaryStructureDialog } from '@/components/hr/salary-structure-dialog';
import { SalaryStructureTable } from '@/components/hr/salary-structure-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SalaryStructure {
  id: string;
  basicSalary: number;
  hra?: number;
  conveyance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  otherAllowances?: Record<string, number>;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  professionalTax?: number;
  tdsRate?: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: {
    id: string;
    name: string;
  };
}

export default function SalaryStructuresPage() {
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const { toast } = useToast();

  // Fetch salary structures
  const fetchSalaryStructures = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEmployee !== 'all') {
        params.append('employeeId', selectedEmployee);
      }
      
      const response = await fetch(`/api/hr/salary-structures?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salary structures');
      }
      
      const data = await response.json();
      setSalaryStructures(data);
    } catch (error) {
      console.error('Error fetching salary structures:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch salary structures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSalaryStructures();
    fetchEmployees();
  }, [selectedEmployee]);

  // Filter salary structures based on search and filters
  const filteredStructures = salaryStructures.filter((structure) => {
    const matchesSearch = 
      structure.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.employee.department.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && structure.isActive) ||
      (statusFilter === 'inactive' && !structure.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalStructures = salaryStructures.length;
  const activeStructures = salaryStructures.filter(s => s.isActive).length;
  const totalBasicSalary = salaryStructures
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.basicSalary, 0);
  const averageBasicSalary = activeStructures > 0 ? totalBasicSalary / activeStructures : 0;

  const handleEdit = (structure: SalaryStructure) => {
    setEditingStructure(structure);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary structure?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hr/salary-structures/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete salary structure');
      }

      toast({
        title: 'Success',
        description: 'Salary structure deleted successfully',
      });

      fetchSalaryStructures();
    } catch (error) {
      console.error('Error deleting salary structure:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete salary structure',
        variant: 'destructive',
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStructure(null);
  };

  const handleSuccess = () => {
    fetchSalaryStructures();
    handleDialogClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Salary Structures</h1>
          <p className="text-muted-foreground">
            Manage employee salary structures and compensation details
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Salary Structure
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStructures}</div>
            <p className="text-xs text-muted-foreground">
              {activeStructures} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Structures</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStructures}</div>
            <p className="text-xs text-muted-foreground">
              Currently effective
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Basic Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBasicSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Monthly total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Basic Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageBasicSalary).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per employee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salary Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Structures ({filteredStructures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryStructureTable
            data={filteredStructures}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <SalaryStructureDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
        salaryStructure={editingStructure}
        employees={employees}
      />
    </div>
  );
}
