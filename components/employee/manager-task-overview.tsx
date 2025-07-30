'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  MessageSquare,
  BarChart,
  Target,
  Users
} from 'lucide-react';
import { ManagerTaskAssignment } from './manager-task-assignment';
import { ManagerAddTaskDialog } from './manager-add-task-dialog';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  completionPercentage: number;
  assigneeId: string;
  assigneeName: string;
  submissionNotes?: string;
  submittedAt?: string;
  timeSpent?: number;
}

interface TeamMember {
  employeeId: string;
  name: string;
  role: string;
  email?: string;
  position?: string;
}

interface ManagerTaskOverviewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  projectId: string;
  projectName: string;
  onTaskApproval: (taskId: string, approved: boolean, comments?: string) => Promise<void>;
  onTaskAssigned?: () => void;
  updatingTask: string | null;
}

export function ManagerTaskOverview({
  tasks,
  teamMembers,
  projectId,
  projectName,
  onTaskApproval,
  onTaskAssigned,
  updatingTask
}: ManagerTaskOverviewProps) {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  const [showTaskAssignmentView, setShowTaskAssignmentView] = useState(false);

  // Calculate team statistics
  const teamStats = teamMembers.map(member => {
    const memberTasks = tasks.filter(task => task.assigneeId === member.employeeId);
    const completedTasks = memberTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = memberTasks.filter(task => task.status === 'in_progress' || task.status === 'not_started').length;
    const awaitingApproval = memberTasks.filter(task => task.status === 'awaiting_approval').length;
    
    return {
      ...member,
      totalTasks: memberTasks.length,
      completedTasks,
      pendingTasks,
      awaitingApproval,
      completionRate: memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0
    };
  });

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
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'awaiting_approval': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'not_started': return <Target className="h-4 w-4 text-gray-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleApprovalAction = async (task: Task, action: 'approve' | 'reject') => {
    setSelectedTask(task);
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedTask) return;
    
    try {
      await onTaskApproval(selectedTask.id, approvalAction === 'approve', approvalComments);
      setShowApprovalDialog(false);
      setSelectedTask(null);
      setApprovalComments('');
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const awaitingApprovalTasks = tasks.filter(task => task.status === 'awaiting_approval');
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Task Assignment Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Project Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor team progress and assign new tasks
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={showTaskAssignmentView ? "default" : "outline"}
            onClick={() => setShowTaskAssignmentView(!showTaskAssignmentView)}
          >
            <Users className="h-4 w-4 mr-2" />
            {showTaskAssignmentView ? "Hide" : "Show"} Team Management
          </Button>

        </div>
      </div>

      {/* Task Assignment Interface */}
      {showTaskAssignmentView && (
        <ManagerTaskAssignment
          projectId={projectId}
          projectName={projectName}
          teamMembers={teamMembers}
          onTaskAssigned={onTaskAssigned}
        />
      )}

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Tasks</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed ({overallProgress}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{awaitingApprovalTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Require your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active contributors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Individual team member task progress and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamStats.map((member) => (
              <div key={member.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{member.totalTasks}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-green-600">{member.completedTasks}</p>
                    <p className="text-muted-foreground">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-blue-600">{member.pendingTasks}</p>
                    <p className="text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-yellow-600">{member.awaitingApproval}</p>
                    <p className="text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{member.completionRate}%</p>
                    <p className="text-muted-foreground">Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Awaiting Approval */}
      {awaitingApprovalTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Tasks Awaiting Your Approval</span>
              <Badge variant="secondary">{awaitingApprovalTasks.length}</Badge>
            </CardTitle>
            <CardDescription>Review and approve completed tasks from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awaitingApprovalTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {task.assigneeName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                        {task.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {task.submissionNotes && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm"><strong>Submission Notes:</strong> {task.submissionNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Progress: {task.completionPercentage}%</span>
                      {task.submittedAt && (
                        <span>Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>
                      )}
                      {task.timeSpent && (
                        <span>Time: {task.timeSpent}h</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(task, 'approve')}
                        disabled={updatingTask === task.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprovalAction(task, 'reject')}
                        disabled={updatingTask === task.id}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {approvalAction === 'approve' ? 'Approve Task' : 'Reject Task'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Task: <strong>{selectedTask.name}</strong><br />
              Employee: <strong>{selectedTask.assigneeName}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comments (Optional)</label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder={approvalAction === 'approve' ? 'Great work! Task approved.' : 'Please address the following issues...'}
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={confirmApproval}
                  disabled={updatingTask === selectedTask.id}
                  className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  variant={approvalAction === 'reject' ? 'destructive' : 'default'}
                >
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Dialog */}
      <ManagerAddTaskDialog
        employees={teamMembers.map(member => ({
          id: member.employeeId,
          firstName: member.name.split(' ')[0] || member.name,
          lastName: member.name.split(' ').slice(1).join(' ') || '',
          email: member.email || ''
        }))}
        onTaskAdded={() => {
          if (onTaskAssigned) {
            onTaskAssigned();
          }
        }}
      />
    </div>
  );
}
