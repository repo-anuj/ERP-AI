'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  FileText,
  MessageSquare
} from 'lucide-react';

interface PendingTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  completionPercentage: number;
  assigneeId: string;
  assigneeName: string;
  projectId: string;
  projectName: string;
  requestedAt?: string;
  notes?: string;
  submissionNotes?: string;
  timeSpent?: number;
  blockers?: string;
  workSummary?: string;
  submittedAt?: string;
  employeeRole?: string;
  employeeDepartment?: string;
}

export function ManagerTaskApprovals() {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentTasks, setRecentTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovalTasks();
  }, []);

  const fetchApprovalTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch pending approvals
      const pendingResponse = await fetch('/api/projects/tasks/approval');
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingTasks(pendingData.tasks || []);
      }

      // Fetch recent approvals
      const recentResponse = await fetch('/api/projects/tasks/approval?recent=true');
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentTasks(recentData.tasks || []);
      }

    } catch (error) {
      console.error('Error fetching approval tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approval tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (taskId: string, approved: boolean, comments?: string) => {
    try {
      setProcessingTask(taskId);
      
      const response = await fetch('/api/projects/tasks/approval', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          approved,
          comments: comments || (approved ? 'Task approved by manager' : 'Task requires revision')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process approval');
      }

      toast({
        title: 'Success',
        description: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh the tasks list
      fetchApprovalTasks();

    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to process task approval',
        variant: 'destructive',
      });
    } finally {
      setProcessingTask(null);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'awaiting_approval': return 'secondary';
      default: return 'outline';
    }
  };

  const TaskCard = ({ task, showActions = true }: { task: PendingTask; showActions?: boolean }) => (
    <Card key={task.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{task.name}</CardTitle>
            <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
              {task.priority}
            </Badge>
          </div>
          <Badge variant={getStatusBadgeVariant(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span><strong>{task.assigneeName}</strong></span>
                {task.employeeRole && <span className="text-muted-foreground">({task.employeeRole})</span>}
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>{task.projectName}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              {task.submittedAt && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && (
          <div>
            <p className="text-sm font-medium mb-1">Task Description:</p>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{task.completionPercentage}%</span>
        </div>
        <Progress value={task.completionPercentage} className="h-2" />

        {/* Enhanced submission details */}
        {task.workSummary && (
          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm font-medium mb-1">Work Summary:</p>
            <p className="text-sm">{task.workSummary}</p>
          </div>
        )}

        {task.submissionNotes && (
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
            <p className="text-sm font-medium mb-1">Completion Notes:</p>
            <p className="text-sm">{task.submissionNotes}</p>
          </div>
        )}

        {task.blockers && (
          <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm font-medium mb-1">Blockers/Issues:</p>
            <p className="text-sm">{task.blockers}</p>
          </div>
        )}

        {/* Time and effort details */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {task.timeSpent && (
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Time spent: {task.timeSpent}h</span>
            </span>
          )}
          {task.submittedAt && (
            <span>
              Submitted {Math.ceil((Date.now() - new Date(task.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </span>
          )}
        </div>

        {task.notes && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm"><strong>Additional Notes:</strong> {task.notes}</p>
          </div>
        )}

        {showActions && task.status === 'awaiting_approval' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => handleApproval(task.id, true)}
              disabled={processingTask === task.id}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleApproval(task.id, false)}
              disabled={processingTask === task.id}
              className="flex-1"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* TODO: Open detailed view */}}
              className="px-3"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Task Approvals</h3>
          <p className="text-sm text-muted-foreground">
            Review and approve tasks from your team members
          </p>
        </div>
        <Button onClick={fetchApprovalTasks} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent ({recentTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} showActions={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No tasks are currently awaiting your approval.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {recentTasks.length > 0 ? (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} showActions={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
              <p className="text-muted-foreground">
                Recent approval activities will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
