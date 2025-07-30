'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Eye,
  Timer,
  Target
} from "lucide-react";

interface TaskApprovalCardProps {
  task: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    assigneeName: string;
    assigneeId: string;
    projectName: string;
    completionPercentage: number;
    dueDate: Date;
    requestedAt?: Date;
    estimatedHours?: number;
    actualHours?: number;
    startDate?: Date;
    notes?: string;
    dependencies?: string[];
    businessImpact?: 'low' | 'medium' | 'high' | 'critical';
    estimatedValue?: number;
    blockedTasks?: number;
  };
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onViewDetails: (taskId: string) => void;
  onMessage?: (taskId: string, assigneeId: string) => void;
}

export function TaskApprovalCard({ task, onApprove, onReject, onViewDetails, onMessage }: TaskApprovalCardProps) {
  const isOverdue = new Date(task.dueDate) < new Date();
  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const timeEfficiency = task.estimatedHours && task.actualHours ?
    ((task.estimatedHours - task.actualHours) / task.estimatedHours * 100) : null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getBusinessImpactColor = (impact?: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`w-full transition-all hover:shadow-lg ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold">{task.name}</CardTitle>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  OVERDUE
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center">
                <Target className="h-3 w-3 mr-1" />
                {task.projectName}
              </span>
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {task.assigneeName}
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={`${getPriorityColor(task.priority)} text-xs font-medium`}>
              {task.priority.toUpperCase()}
            </Badge>
            {task.businessImpact && (
              <Badge variant="outline" className={`text-xs ${getBusinessImpactColor(task.businessImpact)}`}>
                {task.businessImpact.toUpperCase()} IMPACT
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-4">
        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        )}

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatDate(task.dueDate)}
                {daysUntilDue > 0 && !isOverdue && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({daysUntilDue}d left)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="font-medium">{task.completionPercentage}%</p>
            </div>
          </div>

          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">
                  {task.actualHours || 0}h / {task.estimatedHours}h
                </p>
              </div>
            </div>
          )}

          {task.estimatedValue && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Value</p>
                <p className="font-medium">{formatCurrency(task.estimatedValue)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar with better styling */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Task Completion</span>
            <span className="font-medium">{task.completionPercentage}%</span>
          </div>
          <Progress
            value={task.completionPercentage}
            className="h-2"
          />
        </div>

        {/* Time Efficiency Indicator */}
        {timeEfficiency !== null && (
          <div className="flex items-center gap-2 text-xs">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Time Efficiency:</span>
            <span className={`font-medium ${timeEfficiency > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {timeEfficiency > 0 ? '+' : ''}{timeEfficiency.toFixed(1)}%
              {timeEfficiency > 0 ? ' under budget' : ' over budget'}
            </span>
          </div>
        )}

        {/* Dependencies and Blocking Info */}
        {(task.dependencies?.length || task.blockedTasks) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.dependencies?.length && (
              <span>Dependencies: {task.dependencies.length}</span>
            )}
            {task.blockedTasks && (
              <span className="text-orange-600 font-medium">
                Blocking {task.blockedTasks} task{task.blockedTasks > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <Separator />

        {/* Request Information */}
        {task.requestedAt && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-muted-foreground">
              <AlertCircle className="h-3 w-3 mr-1" />
              Approval requested: {formatDate(task.requestedAt)}
            </div>
            <div className="text-muted-foreground">
              {Math.ceil((new Date().getTime() - new Date(task.requestedAt).getTime()) / (1000 * 60 * 60))}h ago
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-3">
        {/* Action Buttons */}
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(task.id)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Details
            </Button>
            {onMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMessage(task.id, task.assigneeId)}
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => onReject(task.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onApprove(task.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>

        {/* Quick Decision Helper */}
        <div className="w-full text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          <div className="flex justify-between items-center">
            <span>Quick Assessment:</span>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded ${task.completionPercentage >= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {task.completionPercentage >= 90 ? 'Ready' : 'In Progress'}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 rounded bg-red-100 text-red-700">
                  Overdue
                </span>
              )}
              {task.blockedTasks && task.blockedTasks > 0 && (
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">
                  Blocking Others
                </span>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
