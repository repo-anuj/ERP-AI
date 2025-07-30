'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { SimpleProjectChat } from '@/components/chat/simple-project-chat';
import { ManagerTaskOverview } from '@/components/employee/manager-task-overview';
import { TaskSubmissionForm } from '@/components/employee/task-submission-form';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  XCircle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  progress: number;
  role: string;
  isManager?: boolean;
  projectManager: {
    employeeId: string;
    name: string;
    role?: string;
    department?: string;
  };
  teamMembers: Array<{
    employeeId: string;
    name: string;
    role: string;
    email?: string;
    position?: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    dueDate: string;
    completionPercentage: number;
    assigneeId: string;
    assigneeName: string;
    approvalStatus?: string;
  }>;
}

export default function EmployeeProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState<any>(null);

  const projectId = params.projectId as string;

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/projects/${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }

      const data = await response.json();
      setProject(data.project);

      // Set current employee ID and manager status from the response
      if (data.employee?.id) {
        setCurrentEmployeeId(data.employee.id);
      }
      if (data.employee?.isManager || data.project?.isManager) {
        setIsManager(true);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'awaiting_approval': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'not_started': return <Target className="h-4 w-4 text-gray-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleTaskProgressUpdate = async (taskId: string, progress: number) => {
    try {
      setUpdatingTask(taskId);
      const response = await fetch(`/api/employee/projects/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_task_progress',
          data: {
            taskId,
            progress,
            notes: `Progress updated to ${progress}%`
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task progress');
      }

      toast({
        title: 'Success',
        description: 'Task progress updated successfully',
      });

      // Refresh project details
      fetchProjectDetails();
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task progress',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleTaskSubmissionClick = (task: any) => {
    setSelectedTaskForSubmission({
      ...task,
      projectName: project?.name || 'Unknown Project'
    });
    setShowSubmissionForm(true);
  };

  const handleTaskSubmission = async (taskId: string, submissionData: any) => {
    try {
      setUpdatingTask(taskId);
      const response = await fetch('/api/projects/tasks/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          message: submissionData.message || 'Task completed and ready for review',
          workSummary: submissionData.workSummary,
          timeSpent: submissionData.timeSpent,
          blockers: submissionData.blockers,
          completionNotes: submissionData.completionNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit task for approval');
      }

      toast({
        title: 'Success',
        description: 'Task submitted for approval successfully',
      });

      setShowSubmissionForm(false);
      setSelectedTaskForSubmission(null);

      // Refresh project details
      fetchProjectDetails();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit task for approval',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleTaskApproval = async (taskId: string, approved: boolean) => {
    try {
      setUpdatingTask(taskId);
      const response = await fetch('/api/projects/tasks/approval', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          approved,
          comments: approved ? 'Task approved by project manager' : 'Task requires revision'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process task approval');
      }

      toast({
        title: 'Success',
        description: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh project details
      fetchProjectDetails();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to process task approval',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  // For managers, show all tasks; for team members, show only their tasks
  const myTasks = project?.tasks || [];
  const completedTasks = myTasks.filter(task => task.status === 'completed').length;
  const pendingTasks = myTasks.filter(task => task.status === 'in_progress' || task.status === 'not_started').length;
  const awaitingApproval = myTasks.filter(task => task.status === 'awaiting_approval').length;

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-muted-foreground">
              {project.description || 'Project details and collaboration'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor(project.status)} text-white`}>
            {project.status.replace('_', ' ')}
          </Badge>
          <Badge className={`${getPriorityColor(project.priority)} text-white`}>
            {project.priority} priority
          </Badge>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed, {pendingTasks} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingApproval}</div>
            <p className="text-xs text-muted-foreground">
              Tasks pending manager review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.teamMembers.length + 1}</div>
            <p className="text-xs text-muted-foreground">
              Including project manager
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Details and Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tasks">
                {isManager ? 'All Tasks' : 'My Tasks'}
              </TabsTrigger>
              <TabsTrigger value="overview">Project Info</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              {isManager ? (
                <ManagerTaskOverview
                  tasks={myTasks}
                  teamMembers={project?.teamMembers || []}
                  projectId={project?.id || ''}
                  projectName={project?.name || 'Unknown Project'}
                  onTaskApproval={handleTaskApproval}
                  onTaskAssigned={fetchProjectDetails}
                  updatingTask={updatingTask}
                />
              ) : myTasks.length > 0 ? (
                <div className="space-y-4">
                  {myTasks.map((task) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTaskStatusIcon(task.status)}
                            <CardTitle className="text-lg">{task.name}</CardTitle>
                          </div>
                          <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                            {task.priority}
                          </Badge>
                        </div>
                        <CardDescription>
                          <div className="flex items-center space-x-4 text-sm">
                            {isManager && (
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{task.assigneeName}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{task.completionPercentage}%</span>
                        </div>
                        <Progress value={task.completionPercentage} className="h-2" />

                        {/* Task Actions */}
                        <div className="flex gap-2">
                          {/* Manager Actions */}
                          {isManager && task.status === 'awaiting_approval' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleTaskApproval(task.id, true)}
                                disabled={updatingTask === task.id}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleTaskApproval(task.id, false)}
                                disabled={updatingTask === task.id}
                                className="flex-1"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Employee Actions (only for their own tasks) */}
                          {!isManager || task.assigneeId === currentEmployeeId ? (
                            <>
                              {task.status === 'in_progress' && task.completionPercentage < 100 && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTaskProgressUpdate(task.id, Math.min(task.completionPercentage + 25, 100))}
                                    disabled={updatingTask === task.id}
                                  >
                                    +25% Progress
                                  </Button>
                                  {task.completionPercentage >= 75 && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleTaskProgressUpdate(task.id, 100)}
                                      disabled={updatingTask === task.id}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                </>
                              )}

                              {task.status === 'in_progress' && task.completionPercentage === 100 && (
                                <Button
                                  size="sm"
                                  onClick={() => handleTaskSubmissionClick(task)}
                                  disabled={updatingTask === task.id}
                                  className="w-full"
                                >
                                  Submit for Approval
                                </Button>
                              )}
                            </>
                          ) : null}

                          {/* Status Display */}
                          {task.status === 'awaiting_approval' && !isManager && (
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              Awaiting Manager Approval
                            </Button>
                          )}

                          {task.status === 'completed' && (
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tasks Assigned</h3>
                  <p className="text-muted-foreground">
                    You don't have any tasks assigned in this project yet.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                      <p>{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">End Date</label>
                      <p>{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Your Role</label>
                      <p>{project.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p>{project.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {project.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1">{project.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Manager */}
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {project.projectManager?.name || 'Not assigned'}
                      </p>
                      <p className="text-sm text-muted-foreground">Project Manager</p>
                    </div>
                    <Badge variant="outline">Manager</Badge>
                  </div>

                  {/* Team Members */}
                  {project.teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant="outline">Team Member</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Simple Project Chat */}
        <div className="lg:col-span-1">
          <SimpleProjectChat
            projectId={project.id}
            projectName={project.name}
            height="h-[600px]"
          />
        </div>
      </div>

      {/* Task Submission Form */}
      {showSubmissionForm && selectedTaskForSubmission && (
        <TaskSubmissionForm
          task={selectedTaskForSubmission}
          onSubmit={handleTaskSubmission}
          onCancel={() => {
            setShowSubmissionForm(false);
            setSelectedTaskForSubmission(null);
          }}
          isSubmitting={updatingTask === selectedTaskForSubmission.id}
        />
      )}
    </div>
  );
}
