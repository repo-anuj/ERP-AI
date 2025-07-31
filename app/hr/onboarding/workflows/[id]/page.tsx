'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, FileText, Clock, Users, CheckCircle, 
  XCircle, Settings, Plus, Trash2, Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  assigneeType: string;
  estimatedHours?: number;
  order: number;
  isRequired: boolean;
  dependencies?: string[];
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  estimatedDays?: number;
  isActive: boolean;
  department?: string;
  createdAt: string;
  updatedAt: string;
  tasks: WorkflowTask[];
  _count?: {
    instances: number;
  };
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflow();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/onboarding/workflows/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      
      const data = await response.json();
      setWorkflow(data.workflow);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssigneeTypeBadge = (assigneeType: string) => {
    const typeConfig = {
      hr: { color: 'bg-blue-100 text-blue-800', label: 'HR' },
      manager: { color: 'bg-green-100 text-green-800', label: 'Manager' },
      buddy: { color: 'bg-purple-100 text-purple-800', label: 'Buddy' },
      employee: { color: 'bg-orange-100 text-orange-800', label: 'Employee' },
      it: { color: 'bg-gray-100 text-gray-800', label: 'IT' },
    };

    const config = typeConfig[assigneeType as keyof typeof typeConfig] || typeConfig.hr;
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    );
  };

  const toggleWorkflowStatus = async () => {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/hr/onboarding/workflows/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !workflow.isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workflow status');
      }

      toast({
        title: 'Success',
        description: `Workflow ${!workflow.isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchWorkflow();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workflow details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workflow Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested workflow could not be found.</p>
          <Button onClick={() => router.push('/hr/onboarding/workflows')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/hr/onboarding/workflows')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflows
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
            <p className="text-muted-foreground">
              {workflow.description || 'No description provided'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/hr/onboarding/workflows/${workflow.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Workflow
            </Button>
            <Button 
              variant={workflow.isActive ? "destructive" : "default"}
              onClick={toggleWorkflowStatus}
            >
              {workflow.isActive ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Workflow Details
                </span>
                <Badge className={workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Estimated Duration</h4>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{workflow.estimatedDays || 'Not specified'} days</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Total Tasks</h4>
                  <div className="flex items-center mt-1">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{workflow.tasks.length} tasks</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Active Instances</h4>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{workflow._count?.instances || 0} instances</span>
                  </div>
                </div>
              </div>

              {workflow.department && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Department</h4>
                  <p className="mt-1">{workflow.department}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="instances">Instances</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Workflow Tasks
                    </span>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Tasks that will be created for each onboarding instance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workflow.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {workflow.tasks
                        .sort((a, b) => a.order - b.order)
                        .map((task, index) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-muted-foreground">
                                  #{index + 1}
                                </span>
                                <h4 className="font-medium">{task.title}</h4>
                                {task.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getAssigneeTypeBadge(task.assigneeType)}
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {task.estimatedHours && (
                            <div className="text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Estimated: {task.estimatedHours} hours
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks defined for this workflow</p>
                      <Button variant="outline" className="mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instances" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Active Instances
                  </CardTitle>
                  <CardDescription>
                    Employees currently using this workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No active instances found</p>
                    <p className="text-sm">Instances will appear here when employees start onboarding with this workflow</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Created</span>
                <p className="text-sm">{new Date(workflow.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <span className="text-xs font-medium text-muted-foreground">Last Updated</span>
                <p className="text-sm">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <p className="text-sm">{workflow.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Start Onboarding
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Instances
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Duplicate Workflow
              </Button>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Workflow
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
