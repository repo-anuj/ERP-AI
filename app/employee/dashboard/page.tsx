'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AttendanceGrid } from '@/components/employee/attendance-grid';
import { TaskManagement } from '@/components/employee/task-management';
import { ManagerTaskApprovals } from '@/components/employee/manager-task-approvals';
import { TaskAnalyticsDashboard } from '@/components/employee/task-analytics-dashboard';
import { useManagerStatus } from '@/hooks/use-manager-status';
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  FileText,
  MessageSquare,
  Timer,
  Award,
  BarChart
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  role: string;
  priority: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
  teamMembers?: Array<{
    employeeId: string;
    name: string;
    role?: string;
  }>;
  tasks?: Task[];
}

interface Task {
  id: string;
  name: string;
  projectName: string;
  status: string;
  priority: string;
  dueDate: string;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  approvalStatus?: string;
  completionPercentage: number;
  project?: {
    id: string;
    name: string;
  };
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  overdueItems: number;
  averageRating: number;
  totalHours: number;
  efficiency: number;
}

export default function EmployeeDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueItems: 0,
    averageRating: 0,
    totalHours: 0,
    efficiency: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Manager status hook
  const { isManager, totalPendingApprovals, loading: managerLoading } = useManagerStatus();

  useEffect(() => {
    console.log('Employee Dashboard: Component mounted, fetching data...');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Employee Dashboard: Fetching projects and tasks...');

      // Fetch employee projects and tasks
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/employee/projects'),
        fetch('/api/employee/tasks')
      ]);

      console.log('Employee Dashboard: Projects response status:', projectsRes.status);
      console.log('Employee Dashboard: Tasks response status:', tasksRes.status);

      if (!projectsRes.ok || !tasksRes.ok) {
        const projectsError = !projectsRes.ok ? await projectsRes.text() : null;
        const tasksError = !tasksRes.ok ? await tasksRes.text() : null;
        console.error('Employee Dashboard: Projects error:', projectsError);
        console.error('Employee Dashboard: Tasks error:', tasksError);
        throw new Error('Failed to fetch dashboard data');
      }

      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();

      console.log('Employee Dashboard: Projects data:', projectsData);
      console.log('Employee Dashboard: Tasks data:', tasksData);

      setProjects(projectsData.projects || []);
      setTasks(tasksData.tasks || []);
      setStats(calculateStats(projectsData.projects || [], tasksData.tasks || []));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projects: Project[], tasks: Task[]): DashboardStats => {
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'not_started').length;
    const overdueItems = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    const totalHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
    const estimatedHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const efficiency = estimatedHours > 0 ? ((estimatedHours - totalHours) / estimatedHours * 100) : 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      completedTasks,
      pendingTasks,
      overdueItems,
      averageRating: 4.2, // This would come from performance data
      totalHours,
      efficiency
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'on_hold': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTaskStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'awaiting_approval': return 'secondary';
      case 'in_progress': return 'outline';
      case 'not_started': return 'destructive';
      default: return 'outline';
    }
  };

  const handleTaskSubmission = async (taskId: string) => {
    try {
      const response = await fetch('/api/projects/tasks/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          message: 'Task completed and ready for review'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit task');
      }

      toast({
        title: 'Success',
        description: 'Task submitted for approval successfully',
      });

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit task for approval',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-muted-foreground">
            Track your projects, tasks, and performance metrics
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards and Attendance Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Stats Cards */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalProjects} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingTasks} pending tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.efficiency > 0 ? '+' : ''}{stats.efficiency.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalHours}h total logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueItems > 0 ? `${stats.overdueItems} overdue items` : 'All on track'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Grid */}
        <div className="lg:col-span-1">
          <AttendanceGrid />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className={`grid w-full ${isManager ? 'grid-cols-7' : 'grid-cols-5'}`}>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="tasks">Quick Tasks</TabsTrigger>
          {isManager && (
            <>
              <TabsTrigger value="approvals">
                Approvals {totalPendingApprovals > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {totalPendingApprovals}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="team-management">
                Team Management
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="task-management">Task Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                      {project.priority}
                    </Badge>
                  </div>
                  <CardDescription>
                    Role: {project.role} • Due: {new Date(project.dueDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{project.tasksCompleted}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{project.tasksPending}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  <Link href={`/employee/projects/${project.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      View Project Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-4">
            {tasks.length > 0 ? (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{task.name}</CardTitle>
                          <Badge variant={getTaskStatusVariant(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <CardDescription>
                        Project: {task.project?.name} • Due: {new Date(task.dueDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{task.completionPercentage}%</span>
                      </div>
                      <Progress value={task.completionPercentage} className="h-2" />

                      <div className="flex gap-2">
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleTaskSubmission(task.id)}
                            className="flex-1"
                          >
                            Submit for Approval
                          </Button>
                        )}
                        {task.status === 'awaiting_approval' && (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            Awaiting Approval
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tasks Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have any tasks assigned yet
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="task-management" className="space-y-4">
          <TaskManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <TaskAnalyticsDashboard />
        </TabsContent>

        {isManager && (
          <>
            <TabsContent value="approvals" className="space-y-4">
              <ManagerTaskApprovals />
            </TabsContent>

            <TabsContent value="team-management" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Team Management Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Assign tasks and manage your team across all projects
                  </p>
                </div>

                {/* Manager Projects Overview */}
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <CardDescription>
                              {project.teamMembers?.length || 0} team members • {project.tasks?.length || 0} tasks
                            </CardDescription>
                          </div>
                          <Link href={`/employee/projects/${project.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Manage Project
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {project.tasks?.filter(task => task.status === 'in_progress').length || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Active</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">
                              {project.tasks?.filter(task => task.status === 'awaiting_approval').length || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Pending</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {project.tasks?.filter(task => task.status === 'completed').length || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              {project.progress || 0}%
                            </p>
                            <p className="text-sm text-muted-foreground">Progress</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </>
        )}

        <TabsContent value="performance" className="space-y-4">
          {/* Performance content will be added in the next part */}
          <div className="text-center py-8">
            <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
            <p className="text-muted-foreground">
              Performance tracking will be implemented next
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
