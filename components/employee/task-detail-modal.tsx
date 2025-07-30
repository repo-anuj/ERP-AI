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
  Building,
  Target,
  X
} from 'lucide-react';

interface TaskDetailModalProps {
  task: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    dueDate: string;
    completionPercentage: number;
    assigneeId: string;
    assigneeName: string;
    projectName: string;
    submissionNotes?: string;
    timeSpent?: number;
    blockers?: string;
    workSummary?: string;
    submittedAt?: string;
    employeeRole?: string;
    employeeDepartment?: string;
    progressHistory?: Array<{
      date: string;
      progress: number;
      notes?: string;
    }>;
  };
  onApprove: (taskId: string, comments?: string) => Promise<void>;
  onReject: (taskId: string, comments?: string) => Promise<void>;
  onClose: () => void;
  isProcessing: boolean;
  showActions?: boolean;
}

export function TaskDetailModal({ 
  task, 
  onApprove, 
  onReject, 
  onClose, 
  isProcessing,
  showActions = true 
}: TaskDetailModalProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'awaiting_approval': return 'text-yellow-600';
      case 'not_started': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await onApprove(task.id, comments);
      } else {
        await onReject(task.id, comments);
      }
      onClose();
    } catch (error) {
      console.error('Error processing action:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{task.name}</span>
                  <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  Comprehensive task details and submission information
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Task Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Employee Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Employee Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {task.assigneeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-lg">{task.assigneeName}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {task.employeeRole && (
                            <span className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>{task.employeeRole}</span>
                            </span>
                          )}
                          {task.employeeDepartment && (
                            <span className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{task.employeeDepartment}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Description */}
                {task.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Task Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{task.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Work Summary */}
                {task.workSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Work Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm leading-relaxed">{task.workSummary}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Completion Notes */}
                {task.submissionNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Completion Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <p className="text-sm leading-relaxed">{task.submissionNotes}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Blockers/Issues */}
                {task.blockers && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Blockers & Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-sm leading-relaxed">{task.blockers}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress History */}
                {task.progressHistory && task.progressHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Progress History</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {task.progressHistory.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{entry.progress}% Complete</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString()}
                              </p>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground max-w-xs">{entry.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar Information */}
              <div className="space-y-6">
                {/* Task Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{task.completionPercentage}%</span>
                      </div>
                      <Progress value={task.completionPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      {task.timeSpent && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Time Spent:</span>
                          <span>{task.timeSpent}h</span>
                        </div>
                      )}
                      
                      {task.submittedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span>{new Date(task.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">{task.projectName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Manager Actions */}
                {showActions && task.status === 'awaiting_approval' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manager Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Comments (Optional)</label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Add feedback or comments..."
                          className="w-full p-3 border rounded-md"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => handleAction('approve')}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Task
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction('reject')}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Task
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
