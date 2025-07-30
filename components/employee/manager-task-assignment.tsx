'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus,
  Users,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  User,
  FileText
} from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  assignments?: Array<{ id: string; name: string }>;
}

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  completionPercentage: number;
}

interface ManagerTaskAssignmentProps {
  projectId: string;
  projectName: string;
  teamMembers: Array<{
    employeeId: string;
    name: string;
    role: string;
  }>;
  onTaskAssigned?: () => void;
}

export function ManagerTaskAssignment({ 
  projectId, 
  projectName, 
  teamMembers, 
  onTaskAssigned 
}: ManagerTaskAssignmentProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch team members for this project with task statistics
      const teamResponse = await fetch(`/api/employee/manager/team?projectId=${projectId}`);
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        // Convert team data to employees format for compatibility
        const employeesData = teamData.teamMembers.map((member: any) => ({
          id: member.employeeId,
          firstName: member.name.split(' ')[0],
          lastName: member.name.split(' ').slice(1).join(' '),
          position: member.position,
          department: member.department,
          email: member.email,
          taskStats: member.taskStats
        }));
        setEmployees(employeesData);
      }

      // Fetch project tasks using manager API
      const tasksResponse = await fetch(`/api/employee/manager/tasks?projectId=${projectId}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get team member statistics (now from API data)
  const getTeamMemberStats = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && (employee as any).taskStats) {
      return (employee as any).taskStats;
    }

    // Fallback to calculating from tasks if stats not available
    const memberTasks = tasks.filter(task => task.assigneeId === employeeId);
    const completedTasks = memberTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = memberTasks.filter(task => task.status === 'in_progress' || task.status === 'not_started').length;
    const awaitingApproval = memberTasks.filter(task => task.status === 'awaiting_approval').length;

    return {
      total: memberTasks.length,
      completed: completedTasks,
      pending: pendingTasks,
      awaitingApproval,
      workload: memberTasks.length
    };
  };

  const getWorkloadColor = (workload: number): string => {
    if (workload === 0) return 'bg-gray-100 text-gray-600';
    if (workload <= 2) return 'bg-green-100 text-green-700';
    if (workload <= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getWorkloadLabel = (workload: number): string => {
    if (workload === 0) return 'Available';
    if (workload <= 2) return 'Light';
    if (workload <= 4) return 'Moderate';
    return 'Heavy';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Task Assignment & Team Management</h3>
          <p className="text-sm text-muted-foreground">
            Assign tasks to team members and monitor workload distribution
          </p>
        </div>
        <Button 
          onClick={() => setShowAssignmentForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign New Task
        </Button>
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter(task => task.status === 'awaiting_approval').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(task => task.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Distribution</CardTitle>
          <CardDescription>
            Monitor task assignments and workload balance across team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const employee = employees.find(emp => emp.id === member.employeeId);
              const stats = getTeamMemberStats(member.employeeId);
              
              return (
                <div key={member.employeeId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee?.position || member.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Task Statistics */}
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                      <div>
                        <p className="font-medium">{stats.total}</p>
                        <p className="text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="font-medium text-blue-600">{stats.pending}</p>
                        <p className="text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <p className="font-medium text-yellow-600">{stats.awaitingApproval}</p>
                        <p className="text-muted-foreground">Pending</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-600">{stats.completed}</p>
                        <p className="text-muted-foreground">Done</p>
                      </div>
                    </div>

                    {/* Workload Badge */}
                    <Badge className={`${getWorkloadColor(stats.workload)} border-0`}>
                      {getWorkloadLabel(stats.workload)}
                    </Badge>

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // TODO: Open task assignment modal for this specific employee
                          setShowAssignmentForm(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Task Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Task Activity</CardTitle>
          <CardDescription>
            Latest task updates and submissions from your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks
              .filter(task => task.status === 'awaiting_approval' || task.status === 'completed')
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{task.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.assigneeName} • Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {task.completionPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            
            {tasks.filter(task => task.status === 'awaiting_approval' || task.status === 'completed').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No recent task activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
