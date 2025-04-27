'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface TaskApprovalCardProps {
  task: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    assigneeName: string;
    projectName: string;
    completionPercentage: number;
    dueDate: Date;
    requestedAt?: Date;
  };
  onApprove: (taskId: string) => void;
  onReject: (taskId: string) => void;
  onViewDetails: (taskId: string) => void;
}

export function TaskApprovalCard({ task, onApprove, onReject, onViewDetails }: TaskApprovalCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.name}</CardTitle>
            <CardDescription>
              Project: {task.projectName} • Assigned to: {task.assigneeName}
            </CardDescription>
          </div>
          <Badge 
            variant={
              task.priority === 'high' ? "destructive" : 
              task.priority === 'medium' ? "default" : 
              "outline"
            }
          >
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Due: {formatDate(task.dueDate)}</span>
          </div>
          <div>
            <span>Completion: {task.completionPercentage}%</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full ${
              task.completionPercentage === 100 
                ? 'bg-green-500' 
                : task.completionPercentage > 50 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
            }`}
            style={{ width: `${task.completionPercentage}%` }}
          />
        </div>
        
        {/* Request time */}
        {task.requestedAt && (
          <div className="mt-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Approval requested: {formatDate(task.requestedAt)}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(task.id)}>
          View Details
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onReject(task.id)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onApprove(task.id)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
