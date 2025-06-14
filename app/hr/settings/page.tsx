'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IdProofTypesManager } from '@/components/hr/id-proof-types-manager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Shield, Settings, Users, FileText, Plus, Edit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Department {
  name: string;
  employeeCount: number;
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    status: string;
  }>;
  description?: string;
}

export default function HRSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  // Fetch departments data
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data);
        } else {
          throw new Error('Failed to fetch departments');
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load departments data',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/hr')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to HR
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">HR Settings</h2>
            <p className="text-muted-foreground">
              Configure HR system settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Departments</span>
          </TabsTrigger>
          <TabsTrigger value="id-proofs" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>ID Proof Types</span>
          </TabsTrigger>
        </TabsList>

        {/* ID Proof Types Tab */}
        <TabsContent value="id-proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>ID Proof Types Management</span>
              </CardTitle>
              <CardDescription>
                Configure the types of identification documents your company requires from employees. 
                All ID proof values are encrypted for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdProofTypesManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Department Management</span>
              </CardTitle>
              <CardDescription>
                View and manage company departments and organizational structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium">Departments Overview</h4>
                    <p className="text-sm text-muted-foreground">
                      Current departments and employee distribution
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Total: {departments.reduce((sum, dept) => sum + dept.employeeCount, 0)} employees
                    </Badge>
                  </div>
                </div>

                {isLoadingDepartments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading departments...</span>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments
                      .sort((a, b) => b.employeeCount - a.employeeCount)
                      .map((department) => (
                      <Card key={department.name} className={department.employeeCount === 0 ? 'opacity-60' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{department.name}</CardTitle>
                            {department.employeeCount > 0 && (
                              <Badge variant="default">{department.employeeCount}</Badge>
                            )}
                          </div>
                          <CardDescription>
                            {department.description || 'Department operations'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {department.employeeCount === 0
                                  ? 'No employees'
                                  : `${department.employeeCount} employee${department.employeeCount > 1 ? 's' : ''}`
                                }
                              </span>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>

                            {department.employees.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Recent employees:</p>
                                <div className="space-y-1">
                                  {department.employees.slice(0, 3).map((employee) => (
                                    <div key={employee.id} className="flex items-center justify-between text-xs">
                                      <span>{employee.firstName} {employee.lastName}</span>
                                      <Badge
                                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {employee.status}
                                      </Badge>
                                    </div>
                                  ))}
                                  {department.employees.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{department.employees.length - 3} more
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}
