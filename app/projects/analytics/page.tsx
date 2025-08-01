'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  TrendingUp,
  Clock,
  Target,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  RefreshCw,
  Building2,
  UserCheck,
  Award,
  Briefcase,
  Activity
} from 'lucide-react';
import { BarChartCard, PieChartCard, LineChartCard } from '@/components/analytics/chart-components';

interface AnalyticsData {
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    newProjects: number;
    averageCompletion: number;
    projectsByStatus: Array<{ status: string; count: number }>;
    projectsByType: Array<{ type: string; count: number }>;
    projectsByPriority: Array<{ priority: string; count: number }>;
  };
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    newTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    tasksByStatus: Array<{ status: string; count: number }>;
    tasksByPriority: Array<{ priority: string; count: number }>;
  };
  teamStats: {
    totalTeamMembers: number;
    activeTeamMembers: number;
    utilizationRate: number;
    topPerformers: Array<{
      employeeId: string;
      name: string;
      position: string;
      tasksCompleted: number;
      averageCompletion: number;
    }>;
    taskDistribution: Array<{
      employeeId: string;
      taskCount: number;
      averageCompletion: number;
    }>;
  };
  budgetStats: {
    totalBudget: number;
    totalExpenses: number;
    remainingBudget: number;
    budgetUtilization: number;
    overBudgetProjects: number;
    budgetByType: Array<{
      type: string;
      budget: number;
      expenses: number;
      utilization: number;
      projectCount: number;
    }>;
    averageProjectBudget: number;
  };
  timelineStats: {
    onTimeProjects: number;
    overdueProjects: number;
    onTimePercentage: number;
    averageDuration: number;
    monthlyTrend: Array<{ month: string; count: number }>;
    projectsStartingThisMonth: number;
  };
  hrmsSpecificStats: {
    totalHRMSProjects: number;
    onboardingProjects: {
      total: number;
      completed: number;
      averageCompletion: number;
    };
    trainingProjects: {
      total: number;
      completed: number;
      averageCompletion: number;
    };
    performanceProjects: {
      total: number;
      completed: number;
      averageCompletion: number;
    };
    employeeEngagement: {
      employeesInvolved: number;
      projectsPerEmployee: number;
    };
  };
  recentActivities: {
    recentProjects: Array<{
      id: string;
      name: string;
      status: string;
      type: string;
      manager: string;
      createdAt: string;
    }>;
    recentTaskCompletions: Array<{
      id: string;
      name: string;
      assignee: string;
      project: string;
      completedAt: string;
    }>;
    recentMilestones: Array<{
      id: string;
      name: string;
      project: string;
      completedAt: string;
    }>;
  };
  timeRange: number;
  generatedAt: string;
}

export default function ProjectAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  const fetchAnalytics = async (range: string = timeRange) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/analytics?timeRange=${range}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    fetchAnalytics(newRange);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics for your projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchAnalytics()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.projectStats.totalProjects)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.projectStats.newProjects}</span> new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.projectStats.activeProjects)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.projectStats.totalProjects > 0
                ? Math.round((analyticsData.projectStats.activeProjects / analyticsData.projectStats.totalProjects) * 100)
                : 0}% of total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.projectStats.completedProjects)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.projectStats.averageCompletion)} avg completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.timelineStats.averageDuration}d</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.timelineStats.onTimePercentage)} on-time rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HRMS Specific Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Projects</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.hrmsSpecificStats.onboardingProjects.total}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.hrmsSpecificStats.onboardingProjects.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.hrmsSpecificStats.trainingProjects.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.hrmsSpecificStats.trainingProjects.averageCompletion)} avg completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.teamStats.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.teamStats.utilizationRate)} utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.budgetStats.budgetUtilization)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analyticsData.budgetStats.remainingBudget)} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="hrms">HRMS Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Status Distribution */}
            <PieChartCard
              title="Project Status Distribution"
              description="Current status of all projects"
              data={analyticsData.projectStats.projectsByStatus.map(item => ({
                name: item.status.replace('_', ' ').toUpperCase(),
                value: item.count
              }))}
              dataKey="value"
              nameKey="name"
              height={300}
            />

            {/* Monthly Project Trend */}
            <LineChartCard
              title="Project Creation Trend"
              description="New projects created over time"
              data={analyticsData.timelineStats.monthlyTrend}
              xAxisKey="month"
              lines={[{
                dataKey: "count",
                name: "New Projects",
                color: "#0088FE"
              }]}
              height={300}
            />

            {/* Task Completion Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Task Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Completion Rate</span>
                    <Badge variant="outline">{formatPercentage(analyticsData.taskStats.completionRate)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Completion Time</span>
                    <Badge variant="outline">{analyticsData.taskStats.averageCompletionTime} days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overdue Tasks</span>
                    <Badge variant={analyticsData.taskStats.overdueTasks > 0 ? "destructive" : "outline"}>
                      {analyticsData.taskStats.overdueTasks}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Budget Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Budget</span>
                    <Badge variant="outline">{formatCurrency(analyticsData.budgetStats.totalBudget)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Expenses</span>
                    <Badge variant="outline">{formatCurrency(analyticsData.budgetStats.totalExpenses)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Over Budget Projects</span>
                    <Badge variant={analyticsData.budgetStats.overBudgetProjects > 0 ? "destructive" : "outline"}>
                      {analyticsData.budgetStats.overBudgetProjects}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Types */}
            <BarChartCard
              title="Projects by Type"
              description="Distribution of project types"
              data={analyticsData.projectStats.projectsByType.map(item => ({
                name: item.type.replace('_', ' ').toUpperCase(),
                value: item.count
              }))}
              xAxisKey="name"
              bars={[{
                dataKey: "value",
                name: "Projects",
                color: "#00C49F"
              }]}
              height={300}
            />

            {/* Project Priority */}
            <PieChartCard
              title="Project Priority Distribution"
              description="Priority levels of current projects"
              data={analyticsData.projectStats.projectsByPriority.map(item => ({
                name: item.priority.toUpperCase(),
                value: item.count
              }))}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>
        </TabsContent>
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Task Status */}
            <BarChartCard
              title="Tasks by Status"
              description="Current status of all tasks"
              data={analyticsData.taskStats.tasksByStatus.map(item => ({
                name: item.status.replace('_', ' ').toUpperCase(),
                value: item.count
              }))}
              xAxisKey="name"
              bars={[{
                dataKey: "value",
                name: "Tasks",
                color: "#FFBB28"
              }]}
              height={300}
            />

            {/* Task Priority */}
            <PieChartCard
              title="Task Priority Distribution"
              description="Priority levels of current tasks"
              data={analyticsData.taskStats.tasksByPriority.map(item => ({
                name: item.priority.toUpperCase(),
                value: item.count
              }))}
              dataKey="value"
              nameKey="name"
              height={300}
            />
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Top Performers</span>
                </CardTitle>
                <CardDescription>Employees with highest task completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.teamStats.topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.employeeId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.position}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{performer.averageCompletion}%</Badge>
                        <p className="text-xs text-muted-foreground">{performer.tasksCompleted} tasks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Team Utilization</span>
                </CardTitle>
                <CardDescription>Team member involvement in projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Team Members</span>
                    <Badge variant="outline">{analyticsData.teamStats.totalTeamMembers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Members</span>
                    <Badge variant="outline">{analyticsData.teamStats.activeTeamMembers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilization Rate</span>
                    <Badge variant="outline">{formatPercentage(analyticsData.teamStats.utilizationRate)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Budget by Type */}
            <BarChartCard
              title="Budget by Project Type"
              description="Budget allocation across project types"
              data={analyticsData.budgetStats.budgetByType.map(item => ({
                name: item.type.replace('_', ' ').toUpperCase(),
                budget: item.budget,
                expenses: item.expenses
              }))}
              xAxisKey="name"
              bars={[
                { dataKey: "budget", name: "Budget", color: "#0088FE" },
                { dataKey: "expenses", name: "Expenses", color: "#FF8042" }
              ]}
              height={300}
              valueFormatter={(value) => formatCurrency(value)}
            />

            {/* Budget Utilization by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Budget Utilization by Type</span>
                </CardTitle>
                <CardDescription>How each project type is utilizing its budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.budgetStats.budgetByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{item.projectCount} projects</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.utilization > 100 ? "destructive" : "outline"}>
                          {formatPercentage(item.utilization)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.expenses)} / {formatCurrency(item.budget)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HRMS Insights Tab */}
        <TabsContent value="hrms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Onboarding Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  <span>Onboarding Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Projects</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.onboardingProjects.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.onboardingProjects.completed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg. Completion</span>
                    <Badge variant="outline">{formatPercentage(analyticsData.hrmsSpecificStats.onboardingProjects.averageCompletion)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-500" />
                  <span>Training Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Projects</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.trainingProjects.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.trainingProjects.completed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg. Completion</span>
                    <Badge variant="outline">{formatPercentage(analyticsData.hrmsSpecificStats.trainingProjects.averageCompletion)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span>Performance Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Total Projects</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.performanceProjects.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed</span>
                    <Badge variant="outline">{analyticsData.hrmsSpecificStats.performanceProjects.completed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg. Completion</span>
                    <Badge variant="outline">{formatPercentage(analyticsData.hrmsSpecificStats.performanceProjects.averageCompletion)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Employee Engagement in HR Projects</span>
              </CardTitle>
              <CardDescription>How employees are involved in HR initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <span>Employees Involved</span>
                  <Badge variant="outline">{analyticsData.hrmsSpecificStats.employeeEngagement.employeesInvolved}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Projects per Employee</span>
                  <Badge variant="outline">{analyticsData.hrmsSpecificStats.employeeEngagement.projectsPerEmployee}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activities</span>
              </CardTitle>
              <CardDescription>Latest project and task updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recent Projects */}
                <div>
                  <h4 className="font-medium mb-2">New Projects</h4>
                  <div className="space-y-2">
                    {analyticsData.recentActivities.recentProjects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between text-sm">
                        <span>{project.name}</span>
                        <Badge variant="outline">{project.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Task Completions */}
                <div>
                  <h4 className="font-medium mb-2">Recent Completions</h4>
                  <div className="space-y-2">
                    {analyticsData.recentActivities.recentTaskCompletions.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-sm">
                        <span>{task.name}</span>
                        <span className="text-muted-foreground">{task.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Analytics generated at: {new Date(analyticsData.generatedAt).toLocaleString()}</p>
        <p>Data range: Last {analyticsData.timeRange} days</p>
      </div>
    </div>
  );
}
