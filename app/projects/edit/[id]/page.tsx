'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { AddTaskDialog } from '@/components/projects/add-task-dialog';
import { EditTaskDialog } from '@/components/projects/edit-task-dialog';
import { AddMilestoneDialog } from '@/components/projects/add-milestone-dialog';
import { EditMilestoneDialog } from '@/components/projects/edit-milestone-dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  PauseCircle,
  Plus,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Project, Task as BaseTask, Milestone as BaseMilestone } from '@/components/projects/columns';
import { formatCurrency, formatDate } from '@/lib/utils';

// Extended Task type with projectId
interface Task extends BaseTask {
  projectId: string;
}

// Extended Milestone type with projectId
interface Milestone extends BaseMilestone {
  projectId: string;
}

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [isDeleteMilestoneOpen, setIsDeleteMilestoneOpen] = useState(false);

  const fetchProject = async () => {
    if (!params.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects?id=${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch project details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/projects/tasks?id=${selectedTask.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });

      // Refresh project data
      fetchProject();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteTaskOpen(false);
      setSelectedTask(null);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      const response = await fetch(`/api/projects/milestones?id=${selectedMilestone.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      toast({
        title: 'Success',
        description: 'Milestone deleted successfully',
      });

      // Refresh project data
      fetchProject();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milestone. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteMilestoneOpen(false);
      setSelectedMilestone(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'in_progress':
        return <PlayCircle className="h-3 w-3 mr-1" />;
      case 'on_hold':
        return <PauseCircle className="h-3 w-3 mr-1" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getMilestoneStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'missed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-96 w-full bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Project Not Found</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">The requested project could not be found.</p>
          <Button
            onClick={() => router.push('/projects')}
            className="mt-4"
          >
            Return to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-muted-foreground">{project.type.charAt(0).toUpperCase() + project.type.slice(1)} Project</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditProjectOpen(true)}
          >
            Edit Project
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Badge
                variant={getStatusBadgeVariant(project.status) as any}
                className="w-fit flex items-center"
              >
                {getStatusIcon(project.status)}
                {project.status.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={project.completionPercentage} className="h-2" />
                <span className="text-sm font-medium">{project.completionPercentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span>{formatDate(project.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span>{formatDate(project.endDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget:</span>
                <span>{formatCurrency(project.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses:</span>
                <span>{formatCurrency(project.expenses)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Balance:</span>
                <span className={project.budget - project.expenses < 0 ? 'text-red-500' : 'text-green-500'}>
                  {formatCurrency(project.budget - project.expenses)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({project.milestones.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({project.teamMembers.length + 1})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{project.description || 'No description available'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{project.notes || 'No notes available'}</p>
              </CardContent>
            </Card>
          </div>

          {project.client && (
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-3 border rounded-md">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{project.client.name}</p>
                    <p className="text-muted-foreground">
                      {project.client.company && `${project.client.company} • `}
                      {project.client.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {project.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Tasks</h3>
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No tasks have been added to this project yet.</p>
              <Button
                variant="outline"
                onClick={() => setIsAddTaskOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {project.tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden border">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">{task.name}</CardTitle>
                      <Badge variant={getPriorityBadgeVariant(task.priority) as any}>
                        {task.priority}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 flex items-center">
                      <Badge
                        variant={getStatusBadgeVariant(task.status) as any}
                        className="mr-2"
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.assigneeName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Due:</span>
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Hours:</span>
                        <span>{task.actualHours} / {task.estimatedHours}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={task.completionPercentage} className="h-2" />
                      <span className="text-xs">{task.completionPercentage}%</span>
                    </div>
                    <div className="flex pt-2 justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          // Add projectId from the current project
                          setSelectedTask({...task, projectId: project.id});
                          setIsDeleteTaskOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          // Add projectId from the current project
                          setSelectedTask({...task, projectId: project.id});
                          setTimeout(() => document.getElementById('edit-task-dialog')?.click(), 0);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Milestones</h3>
            <Button onClick={() => setIsAddMilestoneOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          {project.milestones.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No milestones have been added to this project yet.</p>
              <Button
                variant="outline"
                onClick={() => setIsAddMilestoneOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Milestone
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {project.milestones.map((milestone) => (
                <Card key={milestone.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">{milestone.name}</CardTitle>
                      <Badge variant={getMilestoneStatusBadgeVariant(milestone.status) as any}>
                        {milestone.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Target Date:</span>
                        <span>{formatDate(milestone.targetDate)}</span>
                      </div>
                      {milestone.completionDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{formatDate(milestone.completionDate)}</span>
                        </div>
                      )}
                    </div>
                    {milestone.deliverables && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Deliverables:</p>
                        <p className="text-sm">{milestone.deliverables}</p>
                      </div>
                    )}
                    <div className="flex pt-2 justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          // Add projectId from the current project
                          setSelectedMilestone({...milestone, projectId: project.id});
                          setIsDeleteMilestoneOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          // Add projectId from the current project
                          setSelectedMilestone({...milestone, projectId: project.id});
                          setTimeout(() => document.getElementById('edit-milestone-dialog')?.click(), 0);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{project.projectManager.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{project.projectManager.name}</p>
                  <p className="text-muted-foreground">
                    {project.projectManager.role && `${project.projectManager.role} • `}
                    {project.projectManager.department}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {project.teamMembers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No team members assigned to this project.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.role && `${member.role} • `}
                          {member.department}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        projectId={project.id}
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        onProjectUpdated={fetchProject}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        projectId={project.id}
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onTaskAdded={fetchProject}
      />

      {/* Edit Task Dialog */}
      {selectedTask && (
        <EditTaskDialog
          task={selectedTask as any}
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
          onTaskUpdated={fetchProject}
        />
      )}

      {/* Add Milestone Dialog */}
      <AddMilestoneDialog
        projectId={project.id}
        open={isAddMilestoneOpen}
        onOpenChange={setIsAddMilestoneOpen}
        onMilestoneAdded={fetchProject}
      />

      {/* Edit Milestone Dialog */}
      {selectedMilestone && (
        <EditMilestoneDialog
          milestone={selectedMilestone as any}
          open={!!selectedMilestone}
          onOpenChange={() => setSelectedMilestone(null)}
          onMilestoneUpdated={fetchProject}
        />
      )}

      {/* Delete Task Confirmation */}
      <AlertDialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{selectedTask?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Milestone Confirmation */}
      <AlertDialog open={isDeleteMilestoneOpen} onOpenChange={setIsDeleteMilestoneOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the milestone "{selectedMilestone?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMilestone}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}