'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Filter,
  Search,
  MessageSquare,
  Send,
  FileText,
  Target
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks';
import { ConnectionStatus } from '@/components/realtime/connection-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'awaiting_approval' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completionPercentage: number;
  notes?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  project?: {
    id: string;
    name: string;
    projectManager: {
      employeeId: string;
      name: string;
      role?: string;
      department?: string;
    };
  };
}

interface TaskManagementProps {
  className?: string;
}

export function TaskManagement({ className }: TaskManagementProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const { toast } = useToast();

  // Use real-time tasks hook
  const {
    tasks,
    loading,
    error,
    lastUpdate,
    connectionState,
    connectionQuality,
    isConnected,
    refresh: fetchTasks
  } = useRealtimeTasks({
    autoRefresh: true,
    onTaskAssigned: (task) => {
      toast({
        title: 'New Task Assigned',
        description: `You have been assigned: "${task.name}"`,
        duration: 7000,
      });
    },
    onTaskUpdate: (task) => {
      // Task updates are handled automatically by the hook
    }
  });

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered as Task[]);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'awaiting_approval': return 'bg-yellow-500';
      case 'not_started': return 'bg-gray-500';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'awaiting_approval': return <AlertTriangle className="h-4 w-4" />;
      case 'not_started': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleTaskSubmission = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch('/api/projects/tasks/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          message: submissionNotes || 'Task completed and ready for review'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task submitted for approval successfully',
        });
        setIsSubmissionDialogOpen(false);
        setSubmissionNotes('');
        setSelectedTask(null);
        fetchTasks();
      } else {
        throw new Error('Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit task for approval',
        variant: 'destructive',
      });
    }
  };

  const openSubmissionDialog = (task: Task) => {
    setSelectedTask(task);
    setIsSubmissionDialogOpen(true);
  };

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && !['completed', 'awaiting_approval'].includes(status);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>My Tasks</span>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
          <ConnectionStatus />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({getTasksByStatus('in_progress').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({getTasksByStatus('awaiting_approval').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({getTasksByStatus('completed').length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({filteredTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {getTasksByStatus('in_progress').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onSubmit={() => openSubmissionDialog(task)}
                isOverdue={isOverdue(task.dueDate, task.status)}
              />
            ))}
            {getTasksByStatus('in_progress').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active tasks</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {getTasksByStatus('awaiting_approval').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {getTasksByStatus('awaiting_approval').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks awaiting approval</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {getTasksByStatus('completed').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {getTasksByStatus('completed').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No completed tasks</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onSubmit={task.status === 'in_progress' ? () => openSubmissionDialog(task) : undefined}
                isOverdue={isOverdue(task.dueDate, task.status)}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Task Submission Dialog */}
        <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Task for Approval</DialogTitle>
              <DialogDescription>
                Submit "{selectedTask?.name}" for manager approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Submission Notes</label>
                <Textarea
                  placeholder="Add any notes about your task completion..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTaskSubmission}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  task: Task;
  onSubmit?: () => void;
  isOverdue?: boolean;
}

function TaskCard({ task, onSubmit, isOverdue }: TaskCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(task.status)}
              <h3 className="font-medium">{task.name}</h3>
            </div>
            <Badge variant="outline" className={`${getStatusColor(task.status)} text-white text-xs`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
            {task.priority}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Project: {task.project?.name || 'Unknown'} • Due: {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && <span className="text-red-600 font-medium ml-2">OVERDUE</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{task.completionPercentage}%</span>
        </div>
        <Progress value={task.completionPercentage} className="h-2" />
        
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        
        <div className="flex gap-2">
          {onSubmit && (
            <Button size="sm" onClick={onSubmit} className="flex-1">
              <Send className="h-3 w-3 mr-1" />
              Submit for Approval
            </Button>
          )}
          <Button size="sm" variant="outline">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat with Manager
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
    case 'awaiting_approval': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'not_started': return <Target className="h-4 w-4 text-gray-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'in_progress': return 'bg-blue-500';
    case 'awaiting_approval': return 'bg-yellow-500';
    case 'not_started': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}
