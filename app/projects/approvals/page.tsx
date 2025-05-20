'use client';

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskApprovalCard } from "@/components/projects/task-approval-card";
import { TaskApprovalModal } from "@/components/projects/task-approval-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

// Mock data for testing - will be replaced with API calls
const mockTasks = [
  {
    id: '1',
    name: 'Implement User Authentication',
    description: 'Add user authentication functionality to the application',
    status: 'awaiting_approval',
    priority: 'high',
    assigneeName: 'John Doe',
    projectName: 'ERP System',
    completionPercentage: 100,
    dueDate: new Date('2023-12-15'),
    requestedAt: new Date('2023-12-10'),
  },
  {
    id: '2',
    name: 'Design Dashboard UI',
    description: 'Create UI design for the main dashboard',
    status: 'awaiting_approval',
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
    status: 'awaiting_approval',
    priority: 'low',
    assigneeName: 'Bob Johnson',
    projectName: 'Inventory Management',
    completionPercentage: 90,
    dueDate: new Date('2023-12-25'),
    requestedAt: new Date('2023-12-14'),
  },
];

const mockRecentlyApproved = [
  {
    id: '4',
    name: 'Setup CI/CD Pipeline',
    description: 'Configure continuous integration and deployment',
    status: 'completed',
    priority: 'high',
    assigneeName: 'Alice Williams',
    projectName: 'ERP System',
    completionPercentage: 100,
    dueDate: new Date('2023-12-05'),
    requestedAt: new Date('2023-12-01'),
    approvedAt: new Date('2023-12-03'),
    approvedBy: 'Manager',
  },
  {
    id: '5',
    name: 'Create API Documentation',
    description: 'Document all API endpoints',
    status: 'completed',
    priority: 'medium',
    assigneeName: 'Charlie Brown',
    projectName: 'Inventory Management',
    completionPercentage: 100,
    dueDate: new Date('2023-12-10'),
    requestedAt: new Date('2023-12-05'),
    approvedAt: new Date('2023-12-07'),
    approvedBy: 'Manager',
  },
];

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [recentlyApproved, setRecentlyApproved] = useState(mockRecentlyApproved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const { toast } = useToast();
  const router = useRouter();

  // Fetch tasks awaiting approval - in a real app, this would be an API call
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, this would be an API call
      // const response = await fetch('/api/projects/tasks/approval');
      // const data = await response.json();
      // setTasks(data.tasks);

      // Using mock data for now
      setTasks(mockTasks);
      setRecentlyApproved(mockRecentlyApproved);
    } catch (error) {
      console.error('Error fetching approval tasks:', error);
      setError('Failed to load tasks awaiting approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search query and project filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject = projectFilter === 'all' || task.projectName === projectFilter;

    return matchesSearch && matchesProject;
  });

  const filteredRecentlyApproved = recentlyApproved.filter(task => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject = projectFilter === 'all' || task.projectName === projectFilter;

    return matchesSearch && matchesProject;
  });

  // Get unique project names for the filter dropdown
  const allProjectNames = [...tasks, ...recentlyApproved].map(task => task.projectName);
  const projectNames = Array.from(new Set(allProjectNames));

  // Handle task approval
  const handleApprove = async (taskId: string, comments?: string) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/projects/tasks/approval', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     taskId,
      //     approved: true,
      //     comments,
      //   }),
      // });

      // For demo purposes, we'll just update the local state
      const approvedTask = tasks.find(task => task.id === taskId);
      if (approvedTask) {
        // Remove from pending tasks
        setTasks(tasks.filter(task => task.id !== taskId));

        // Add to recently approved
        setRecentlyApproved([
          {
            ...approvedTask,
            status: 'completed',
            approvedAt: new Date(),
            approvedBy: 'Manager',
          },
          ...recentlyApproved,
        ]);
      }

      toast({
        title: 'Task Approved',
        description: 'The task has been approved successfully.',
      });
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle task rejection
  const handleReject = async (taskId: string, comments?: string) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/projects/tasks/approval', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     taskId,
      //     approved: false,
      //     comments,
      //   }),
      // });

      // For demo purposes, we'll just update the local state
      setTasks(tasks.filter(task => task.id !== taskId));

      toast({
        title: 'Task Rejected',
        description: 'The task has been rejected and sent back to the assignee.',
      });
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Open approval modal
  const openApprovalModal = (taskId: string, action: 'approve' | 'reject') => {
    setSelectedTask(taskId);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  };

  // View task details
  const viewTaskDetails = (taskId: string) => {
    router.push(`/projects?taskId=${taskId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Task Approvals</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval
            {tasks.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {tasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recently Approved
            {recentlyApproved.length > 0 && (
              <span className="ml-2 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {recentlyApproved.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || projectFilter !== 'all'
                  ? 'No matching tasks found'
                  : 'No tasks awaiting approval'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map(task => (
                <TaskApprovalCard
                  key={task.id}
                  task={task}
                  onApprove={() => openApprovalModal(task.id, 'approve')}
                  onReject={() => openApprovalModal(task.id, 'reject')}
                  onViewDetails={viewTaskDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRecentlyApproved.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || projectFilter !== 'all'
                  ? 'No matching tasks found'
                  : 'No recently approved tasks'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecentlyApproved.map(task => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{task.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Project: {task.projectName} • Assigned to: {task.assigneeName}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Approved
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Approved by {task.approvedBy} on {new Date(task.approvedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewTaskDetails(task.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
