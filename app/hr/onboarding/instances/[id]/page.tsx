'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, User, Calendar, Clock, CheckCircle, 
  XCircle, AlertTriangle, Users, FileText, MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

interface OnboardingInstance {
  id: string;
  status: string;
  startDate: string;
  expectedEndDate?: string;
  completedAt?: string;
  completionPercentage: number;
  hrAssignee?: string;
  managerAssignee?: string;
  buddyAssignee?: string;
  notes?: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: { name: string };
    position?: string;
    joiningDate?: string;
  };
  workflow: {
    id: string;
    name: string;
    description?: string;
    estimatedDays?: number;
  };
  taskInstances: Array<{
    id: string;
    taskTitle: string;
    taskDescription?: string;
    status: string;
    assigneeType: string;
    assigneeName?: string;
    dueDate?: string;
    completedAt?: string;
    notes?: string;
    order: number;
  }>;
}

export default function OnboardingInstanceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);

  useEffect(() => {
    fetchInstance();
  }, [params.id]);

  const fetchInstance = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr/onboarding/instances/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch onboarding instance');
      
      const data = await response.json();
      setInstance(data.instance);
    } catch (error) {
      console.error('Error fetching instance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load onboarding instance details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      skipped: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color} variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getDaysRemaining = (expectedEndDate?: string) => {
    if (!expectedEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(expectedEndDate);
    const days = differenceInDays(endDate, now);
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading onboarding details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Onboarding Instance Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested onboarding instance could not be found.</p>
          <Button onClick={() => router.push('/hr/onboarding/instances')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Onboarding Instances
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
          onClick={() => router.push('/hr/onboarding/instances')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Onboarding Instances
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {instance.employee.firstName} {instance.employee.lastName} - Onboarding
            </h1>
            <p className="text-muted-foreground">
              {instance.workflow.name} • Started {format(new Date(instance.startDate), 'MMM dd, yyyy')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Instance
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progress Overview</span>
                {getStatusBadge(instance.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{instance.completionPercentage}%</span>
                  </div>
                  <Progress value={instance.completionPercentage} className="h-2" />
                </div>
                
                {instance.expectedEndDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span>Expected completion:</span>
                    <span className="font-medium">
                      {format(new Date(instance.expectedEndDate), 'MMM dd, yyyy')}
                      {instance.status !== 'completed' && (
                        <span className="ml-2 text-muted-foreground">
                          ({getDaysRemaining(instance.expectedEndDate)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Onboarding Tasks
                  </CardTitle>
                  <CardDescription>
                    Track progress of individual onboarding tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {instance.taskInstances.length > 0 ? (
                    <div className="space-y-4">
                      {instance.taskInstances
                        .sort((a, b) => a.order - b.order)
                        .map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.taskTitle}</h4>
                              {task.taskDescription && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.taskDescription}
                                </p>
                              )}
                            </div>
                            {getTaskStatusBadge(task.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <span className="font-medium">Assignee:</span>
                              <p className="text-muted-foreground">
                                {task.assigneeName || `${task.assigneeType} (Not assigned)`}
                              </p>
                            </div>
                            
                            {task.dueDate && (
                              <div>
                                <span className="font-medium">Due Date:</span>
                                <p className="text-muted-foreground">
                                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            )}
                            
                            {task.completedAt && (
                              <div>
                                <span className="font-medium">Completed:</span>
                                <p className="text-muted-foreground">
                                  {format(new Date(task.completedAt), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {task.notes && (
                            <div className="mt-3 p-2 bg-muted rounded text-sm">
                              <strong>Notes:</strong> {task.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks found for this onboarding instance</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Onboarding Started</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(instance.startDate), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    {instance.completedAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Onboarding Completed</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(instance.completedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {instance.employee.firstName[0]}{instance.employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">
                    {instance.employee.firstName} {instance.employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{instance.employee.email}</p>
                  {instance.employee.phone && (
                    <p className="text-sm text-muted-foreground">{instance.employee.phone}</p>
                  )}
                </div>
                
                {instance.employee.department && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Department</span>
                    <p className="text-sm">{instance.employee.department.name}</p>
                  </div>
                )}
                
                {instance.employee.position && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Position</span>
                    <p className="text-sm">{instance.employee.position}</p>
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="w-full">
                  View Employee Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{instance.workflow.name}</p>
                  {instance.workflow.description && (
                    <p className="text-sm text-muted-foreground">{instance.workflow.description}</p>
                  )}
                </div>
                
                {instance.workflow.estimatedDays && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Estimated Duration</span>
                    <p className="text-sm">{instance.workflow.estimatedDays} days</p>
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="w-full">
                  View Workflow Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assignees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Assignees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {instance.hrAssignee && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">HR Assignee</span>
                  <p className="text-sm">{instance.hrAssignee}</p>
                </div>
              )}
              
              {instance.managerAssignee && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Manager</span>
                  <p className="text-sm">{instance.managerAssignee}</p>
                </div>
              )}
              
              {instance.buddyAssignee && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Buddy</span>
                  <p className="text-sm">{instance.buddyAssignee}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {instance.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{instance.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
