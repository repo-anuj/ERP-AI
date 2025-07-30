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

interface Task {
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
  businessImpact?: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue?: number;
  blockedTasks?: number;
}

interface ApprovedTask extends Task {
  approvedAt: Date;
  approvedBy: string;
  approvedById: string;
  rejectionReason?: string;
  approvalStatus: 'approved' | 'rejected';
}

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentlyApproved, setRecentlyApproved] = useState<ApprovedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const { toast } = useToast();
  const router = useRouter();

  // Fetch tasks awaiting approval and recently approved tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[APPROVALS_PAGE] Fetching tasks awaiting approval...');

      // Fetch pending approval tasks
      const pendingResponse = await fetch('/api/projects/tasks/approval');
      if (!pendingResponse.ok) {
        console.error('[APPROVALS_PAGE] Failed to fetch pending tasks:', pendingResponse.statusText);
        const errorText = await pendingResponse.text();
        console.error('[APPROVALS_PAGE] Error details:', errorText);
        throw new Error(`Failed to fetch pending tasks: ${pendingResponse.statusText}`);
      }
      const pendingData = await pendingResponse.json();

      console.log('[APPROVALS_PAGE] Pending tasks received:', pendingData.tasks?.length || 0);

      // Fetch recently approved/rejected tasks
      const approvedResponse = await fetch('/api/projects/tasks/approval?status=recent');
      if (!approvedResponse.ok) {
        console.warn('[APPROVALS_PAGE] Failed to fetch approved tasks:', approvedResponse.statusText);
        // Continue with empty approved tasks instead of throwing error
      }
      const approvedData = approvedResponse.ok ? await approvedResponse.json() : { tasks: [] };

      console.log('[APPROVALS_PAGE] Recently approved tasks received:', approvedData.tasks?.length || 0);

      // Format tasks for the UI
      const formattedPendingTasks = (pendingData.tasks || []).map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeName: task.assigneeName,
        assigneeId: task.assigneeId || '',
        projectName: task.projectName,
        completionPercentage: task.completionPercentage || 100,
        dueDate: new Date(task.dueDate),
        requestedAt: task.requestedAt ? new Date(task.requestedAt) : new Date(),
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        notes: task.notes,
        businessImpact: task.businessImpact,
        estimatedValue: task.estimatedValue,
        blockedTasks: task.blockedTasks
      }));

      const formattedApprovedTasks = (approvedData.tasks || []).map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        requestedAt: task.requestedAt ? new Date(task.requestedAt) : new Date(),
        approvedAt: new Date(task.approvedAt),
        startDate: task.startDate ? new Date(task.startDate) : undefined,
      }));

      setTasks(formattedPendingTasks);
      setRecentlyApproved(formattedApprovedTasks);

      console.log('[APPROVALS_PAGE] Tasks updated successfully');
    } catch (error) {
      console.error('Error fetching approval tasks:', error);
      setError('Failed to load tasks awaiting approval. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load approval tasks. Please try again.',
        variant: 'destructive',
      });
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
  const handleApprove = async (taskId: string, data: any) => {
    try {
      console.log('[APPROVALS_PAGE] Approving task:', taskId, data);

      const response = await fetch(`/api/projects/tasks/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          approved: true,
          comments: data.comments,
          qualityRating: data.qualityRating,
          bonusRecommendation: data.bonusRecommendation,
          nextActions: data.nextActions,
          notifyStakeholders: data.notifyStakeholders
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve task');
      }

      const result = await response.json();
      console.log('[APPROVALS_PAGE] Task approved successfully:', result);

      // Refresh the tasks list
      await fetchTasks();

      toast({
        title: 'Task Approved',
        description: 'The task has been approved successfully.',
      });
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle task rejection
  const handleReject = async (taskId: string, data: any) => {
    try {
      console.log('[APPROVALS_PAGE] Rejecting task:', taskId, data);

      const response = await fetch(`/api/projects/tasks/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          approved: false,
          comments: data.comments,
          rejectionReason: data.rejectionReason,
          requiredChanges: data.requiredChanges,
          estimatedRevisionTime: data.estimatedRevisionTime,
          scheduleFollowUp: data.scheduleFollowUp,
          followUpDate: data.followUpDate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject task');
      }

      const result = await response.json();
      console.log('[APPROVALS_PAGE] Task rejected successfully:', result);

      // Refresh the tasks list
      await fetchTasks();

      toast({
        title: 'Task Rejected',
        description: 'The task has been rejected and sent back to the assignee.',
      });
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject task. Please try again.',
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
    window.location.href = `/projects?taskId=${taskId}`;
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
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
                <div className="col-span-3">Task Name</div>
                <div className="col-span-2">Project</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-2">Issue Date</div>
                <div className="col-span-2">Approved Date</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Task Rows */}
              {filteredRecentlyApproved.map(task => (
                <div key={task.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="font-medium text-sm">{task.name}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${
                            task.approvalStatus === 'approved'
                              ? 'bg-green-500/10 text-green-600 border-green-500/20'
                              : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}
                        >
                          {task.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium">{task.projectName}</p>
                    <Badge variant="outline" className={`text-xs mt-1 ${
                      task.priority === 'high' ? 'border-red-500/20 text-red-600' :
                      task.priority === 'medium' ? 'border-yellow-500/20 text-yellow-600' :
                      'border-green-500/20 text-green-600'
                    }`}>
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium">{task.assigneeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.completionPercentage}% completed
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium">
                      {task.requestedAt ? new Date(task.requestedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.requestedAt ? new Date(task.requestedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-medium">
                      {new Date(task.approvedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.approvedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>

                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewTaskDetails(task.id)}
                      className="h-8 px-2 text-xs"
                    >
                      View
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
