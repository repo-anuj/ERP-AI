'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRequestApproval } from "@/components/projects/task-request-approval";
import { TaskApprovalStatus } from "@/components/projects/task-approval-status";
import { TaskApprovalModal } from "@/components/projects/task-approval-modal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Define Task interface
interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  assigneeName: string;
  projectName: string;
  completionPercentage: number;
  dueDate: Date;
  approvalStatus?: string;
  requestedAt?: Date;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

// Mock task data
const mockTasks = [
  {
    id: '1',
    name: 'Implement User Authentication',
    description: 'Add user authentication functionality to the application',
    status: 'in_progress',
    priority: 'high',
    assigneeName: 'John Doe',
    projectName: 'ERP System',
    completionPercentage: 100,
    dueDate: new Date('2023-12-15'),
  },
  {
    id: '2',
    name: 'Design Dashboard UI',
    description: 'Create UI design for the main dashboard',
    status: 'awaiting_approval',
    approvalStatus: 'pending',
    priority: 'medium',
    assigneeName: 'Jane Smith',
    projectName: 'ERP System',
    completionPercentage: 100,
    dueDate: new Date('2023-12-20'),
    requestedAt: new Date('2023-12-12'),
  },
  {
    id: '3',
    name: 'Optimize Database Queries',
    description: 'Improve performance of database queries',
    status: 'completed',
    approvalStatus: 'approved',
    priority: 'low',
    assigneeName: 'Bob Johnson',
    projectName: 'Inventory Management',
    completionPercentage: 100,
    dueDate: new Date('2023-12-25'),
    approvedByName: 'Manager',
    approvedAt: new Date('2023-12-14'),
  },
  {
    id: '4',
    name: 'Fix Login Bug',
    description: 'Fix the bug in the login form',
    status: 'in_progress',
    approvalStatus: 'rejected',
    priority: 'high',
    assigneeName: 'Alice Williams',
    projectName: 'ERP System',
    completionPercentage: 90,
    dueDate: new Date('2023-12-10'),
    approvedByName: 'Manager',
    approvedAt: new Date('2023-12-08'),
    rejectionReason: 'The login form still has issues with validation. Please fix and resubmit.',
  },
];

export default function TestApprovalPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  // Request approval for a task
  const handleRequestApproval = async (taskId: string, message: string) => {
    // In a real app, this would be an API call
    // For demo purposes, we'll just update the local state
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: 'awaiting_approval',
            approvalStatus: 'pending',
            requestedAt: new Date(),
          }
        : task
    ));

    toast({
      title: "Approval Requested",
      description: "Your task has been submitted for approval.",
    });
  };

  // Approve a task
  const handleApprove = async (taskId: string, comments?: string) => {
    // In a real app, this would be an API call
    // For demo purposes, we'll just update the local state
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: 'completed',
            approvalStatus: 'approved',
            approvedByName: 'Manager',
            approvedAt: new Date(),
          }
        : task
    ));

    toast({
      title: "Task Approved",
      description: "The task has been approved successfully.",
    });
  };

  // Reject a task
  const handleReject = async (taskId: string, comments?: string) => {
    // In a real app, this would be an API call
    // For demo purposes, we'll just update the local state
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: 'in_progress',
            approvalStatus: 'rejected',
            approvedByName: 'Manager',
            approvedAt: new Date(),
            rejectionReason: comments,
          }
        : task
    ));

    toast({
      title: "Task Rejected",
      description: "The task has been rejected and sent back to the assignee.",
    });
  };

  // Open approval modal
  const openApprovalModal = (taskId: string, action: 'approve' | 'reject') => {
    setSelectedTask(taskId);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Approval Workflow</h1>

      <Tabs defaultValue="employee" className="mb-8">
        <TabsList>
          <TabsTrigger value="employee">Employee View</TabsTrigger>
          <TabsTrigger value="manager">Manager View</TabsTrigger>
        </TabsList>

        <TabsContent value="employee" className="space-y-6 mt-4">
          <h2 className="text-xl font-semibold">My Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{task.name}</CardTitle>
                    <TaskApprovalStatus
                      status={task.status}
                      approvalStatus={task.approvalStatus}
                      approvedByName={task.approvedByName}
                      approvedAt={task.approvedAt}
                      rejectionReason={task.rejectionReason}
                    />
                  </div>
                  <CardDescription>
                    Project: {task.projectName} • Priority: {task.priority}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  <div className="text-sm">
                    <p>Completion: {task.completionPercentage}%</p>
                    <p>Due: {task.dueDate.toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <TaskRequestApproval
                    taskId={task.id}
                    taskName={task.name}
                    onRequestApproval={handleRequestApproval}
                    disabled={task.status === 'awaiting_approval' || task.status === 'completed'}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manager" className="space-y-6 mt-4">
          <h2 className="text-xl font-semibold">Tasks Awaiting Approval</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks
              .filter(task => task.status === 'awaiting_approval')
              .map(task => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{task.name}</CardTitle>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Awaiting Approval
                      </Badge>
                    </div>
                    <CardDescription>
                      Project: {task.projectName} • Assigned to: {task.assigneeName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="text-sm">
                      <p>Completion: {task.completionPercentage}%</p>
                      <p>Due: {task.dueDate.toLocaleDateString()}</p>
                      {task.requestedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested: {task.requestedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => openApprovalModal(task.id, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openApprovalModal(task.id, 'approve')}
                    >
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}

            {tasks.filter(task => task.status === 'awaiting_approval').length === 0 && (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No tasks awaiting approval</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold mt-8">Recently Approved/Rejected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks
              .filter(task => task.approvalStatus === 'approved' || task.approvalStatus === 'rejected')
              .map(task => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{task.name}</CardTitle>
                      <TaskApprovalStatus
                        status={task.status}
                        approvalStatus={task.approvalStatus}
                        approvedByName={task.approvedByName}
                        approvedAt={task.approvedAt}
                        rejectionReason={task.rejectionReason}
                      />
                    </div>
                    <CardDescription>
                      Project: {task.projectName} • Assigned to: {task.assigneeName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    {task.rejectionReason && (
                      <div className="bg-red-50 p-2 rounded-md text-sm text-red-600 mb-2">
                        <p className="font-medium">Rejection Reason:</p>
                        <p>{task.rejectionReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

            {tasks.filter(task => task.approvalStatus === 'approved' || task.approvalStatus === 'rejected').length === 0 && (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No recently approved or rejected tasks</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      {selectedTask && (
        <TaskApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          taskId={selectedTask}
          action={approvalAction}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
