'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/permissions';
import { usePermissionContext } from '@/contexts/permission-context';
import { AlertTriangle, Shield, Users } from 'lucide-react';

export default function RolesPage() {
  const { toast } = useToast();
  const { can } = usePermissionContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeePermissions, setEmployeePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check if user has permission to manage roles
  const hasPermission = can(PERMISSIONS.MANAGE_ROLES);

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch employees',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch employees',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (hasPermission) {
      fetchEmployees();
    }
  }, [hasPermission, toast]);

  // Fetch employee permissions when an employee is selected
  useEffect(() => {
    async function fetchEmployeePermissions() {
      if (!selectedEmployee) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/employees/${selectedEmployee}/permissions`);
        if (response.ok) {
          const data = await response.json();
          setEmployeePermissions(data.permissions || []);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch employee permissions',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching employee permissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch employee permissions',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (selectedEmployee) {
      fetchEmployeePermissions();
    }
  }, [selectedEmployee, toast]);

  // Handle permission toggle
  const togglePermission = (permission: string) => {
    setEmployeePermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  // Handle role selection
  const selectRole = (role: string) => {
    setEmployeePermissions(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || []);
  };

  // Save permissions
  const savePermissions = async () => {
    if (!selectedEmployee) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/employees/${selectedEmployee}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: employeePermissions,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Permissions updated successfully',
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const permissionCategories = {
    Dashboard: Object.entries(PERMISSIONS).filter(([key]) => key.includes('DASHBOARD')),
    HR: Object.entries(PERMISSIONS).filter(([key]) => key.includes('EMPLOYEE') || key.includes('ATTENDANCE')),
    Inventory: Object.entries(PERMISSIONS).filter(([key]) => key.includes('INVENTORY')),
    Sales: Object.entries(PERMISSIONS).filter(([key]) => key.includes('SALES')),
    Finance: Object.entries(PERMISSIONS).filter(([key]) => key.includes('FINANCE') || key.includes('TRANSACTION')),
    Projects: Object.entries(PERMISSIONS).filter(([key]) => key.includes('PROJECT') || key.includes('TASK')),
    Analytics: Object.entries(PERMISSIONS).filter(([key]) => key.includes('ANALYTICS')),
    Settings: Object.entries(PERMISSIONS).filter(([key]) => key.includes('SETTINGS') || key.includes('ROLE') || key.includes('COMPANY')),
  };

  // If user doesn't have permission, show access denied
  if (!hasPermission) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
        </div>

        <Card className="border-red-200">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to manage roles and permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <CardTitle>Employees</CardTitle>
            </div>
            <CardDescription>
              Select an employee to manage their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-accent ${
                      selectedEmployee === employee.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedEmployee(employee.id)}
                  >
                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.position} • {employee.department}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Role: {employee.role || 'employee'}
                    </div>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No employees found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEmployee && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle>Permissions</CardTitle>
              </div>
              <CardDescription>
                Manage permissions for {employees.find(e => e.id === selectedEmployee)?.firstName} {employees.find(e => e.id === selectedEmployee)?.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="text-sm font-medium mb-2">Quick Role Assignment</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(ROLE_PERMISSIONS).map(role => (
                        <Button
                          key={role}
                          variant={employeePermissions.length === ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].length && 
                                  employeePermissions.every(p => ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].includes(p)) ? 
                                  'default' : 'outline'}
                          size="sm"
                          onClick={() => selectRole(role)}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Tabs defaultValue="Dashboard">
                    <TabsList className="mb-4 flex flex-wrap h-auto">
                      {Object.keys(permissionCategories).map(category => (
                        <TabsTrigger key={category} value={category}>
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(permissionCategories).map(([category, permissions]) => (
                      <TabsContent key={category} value={category} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {permissions.map(([key, value]) => (
                            <div key={key} className="flex items-start space-x-2">
                              <Checkbox
                                id={value}
                                checked={employeePermissions.includes(value)}
                                onCheckedChange={() => togglePermission(value)}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <Label
                                  htmlFor={value}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={savePermissions}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
