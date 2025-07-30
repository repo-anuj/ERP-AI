"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Award,
  Target,
  Building2,
  UserCheck,
  UserX,
  Timer,
  CheckCircle,
  XCircle,
  Star,
  BarChart,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  FileText,
  Filter
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsData {
  employeeStats: {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    departments: number;
    growthRate: number;
    employeesByStatus: Array<{ status: string; _count: { id: number } }>;
    employeesByDepartment: Array<{ departmentId: string; _count: { id: number } }>;
  };
  departmentStats: Array<{
    id: string;
    name: string;
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
  }>;
  attendanceStats: {
    totalRecords: number;
    onTimeRecords: number;
    lateRecords: number;
    onTimePercentage: number;
    averageHours: number;
    dailyAttendance: Array<{ date: string; count: number }>;
  };
  leaveStats: {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    approvalRate: number;
    leaveByType: Array<{
      leaveTypeId: string;
      leaveTypeName: string;
      applications: number;
      totalDays: number;
    }>;
  };
  rewardStats: {
    totalRewards: number;
    totalPoints: number;
    activeEmployeesWithRewards: number;
    participationRate: number;
    topPerformers: Array<{
      id: string;
      name: string;
      totalPoints: number;
    }>;
    rewardsByType: Array<{
      rewardTypeId: string;
      _count: { id: number };
      _sum: { points: number };
    }>;
  };
  performanceStats: {
    totalTemplates: number;
    totalReviews: number;
    completedReviews: number;
    totalGoals: number;
    reviewCompletionRate: number;
    reviewsByStatus: Array<{ status: string; _count: { id: number } }>;
    goalsByStatus: Array<{ status: string; _count: { id: number } }>;
  };
  recentActivities: {
    recentHires: Array<{
      id: string;
      firstName: string;
      lastName: string;
      hireDate: string;
      position: string;
    }>;
    recentLeaveApplications: Array<{
      id: string;
      employee: { firstName: string; lastName: string };
      leaveType: { name: string };
      appliedAt: string;
      status: string;
    }>;
    recentRewards: Array<{
      id: string;
      employee: { firstName: string; lastName: string };
      points: number;
      createdAt: string;
    }>;
  };
  timeRange: number;
  generatedAt: string;
}

export function HRAnalyticsDashboard() {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async (range: string = timeRange) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/hr-dashboard?timeRange=${range}`);
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

  const formatPercentage = (num: number) => {
    return `${Math.round(num * 100) / 100}%`;
  };

  const generateReport = async (reportType: string) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          format: 'json'
        })
      });

      if (response.ok) {
        const report = await response.json();

        // Create and download the report
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Report Generated",
          description: `${reportType.replace('_', ' ')} report has been downloaded successfully.`,
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateCustomReport = async () => {
    // This would open a more detailed custom report builder
    toast({
      title: "Custom Report Builder",
      description: "Custom report builder will be available in the next update.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p>Failed to load analytics data</p>
          <Button onClick={() => fetchAnalytics()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HR Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive workforce insights and metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
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
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.employeeStats.totalEmployees)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.employeeStats.newHires}</span> new hires this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.attendanceStats.onTimePercentage)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.attendanceStats.onTimeRecords)} on-time records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Approval Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analyticsData.leaveStats.approvalRate)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.leaveStats.pendingApplications} pending applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.rewardStats.totalPoints)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.rewardStats.totalRewards)} rewards awarded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Department Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.departmentStats.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dept.activeEmployees} active • {dept.newHires} new
                        </p>
                      </div>
                      <Badge variant="outline">{dept.totalEmployees}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recentActivities.recentHires.slice(0, 3).map((hire) => (
                    <div key={hire.id} className="flex items-center space-x-3">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {hire.firstName} {hire.lastName} joined
                        </p>
                        <p className="text-xs text-muted-foreground">{hire.position}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(hire.hireDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {analyticsData.recentActivities.recentLeaveApplications.slice(0, 2).map((leave) => (
                    <div key={leave.id} className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {leave.employee.firstName} {leave.employee.lastName} applied for {leave.leaveType.name}
                        </p>
                        <p className="text-xs text-muted-foreground">Status: {leave.status}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(leave.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Employee Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.employeeStats.employeesByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <span className="capitalize">{status.status}</span>
                      <Badge variant={status.status === 'active' ? 'default' : 'secondary'}>
                        {status._count.id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Growth Rate</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(analyticsData.employeeStats.growthRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>New Hires ({timeRange} days)</span>
                    <span className="font-bold">{analyticsData.employeeStats.newHires}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Employees</span>
                    <span className="font-bold">{analyticsData.employeeStats.activeEmployees}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <span>On Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.attendanceStats.onTimeRecords}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPercentage(analyticsData.attendanceStats.onTimePercentage)} of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserX className="h-5 w-5 text-red-500" />
                  <span>Late Arrivals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analyticsData.attendanceStats.lateRecords}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPercentage(100 - analyticsData.attendanceStats.onTimePercentage)} of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <span>Average Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.attendanceStats.averageHours}
                </div>
                <p className="text-sm text-muted-foreground">
                  Hours per day
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Applications Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Approved</span>
                    </span>
                    <Badge variant="default">{analyticsData.leaveStats.approvedApplications}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Pending</span>
                    </span>
                    <Badge variant="secondary">{analyticsData.leaveStats.pendingApplications}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Rejected</span>
                    </span>
                    <Badge variant="destructive">{analyticsData.leaveStats.rejectedApplications}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.leaveStats.leaveByType.map((leave) => (
                    <div key={leave.leaveTypeId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{leave.leaveTypeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {leave.totalDays} total days
                        </p>
                      </div>
                      <Badge variant="outline">{leave.applications}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Top Performers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.rewardStats.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{performer.name}</span>
                      </div>
                      <span className="font-bold text-yellow-600">
                        {formatNumber(performer.totalPoints)} pts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rewards by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.rewardStats.rewardsByType.map((reward) => (
                    <div key={reward.rewardTypeId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{reward.rewardTypeId.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(reward._sum.points || 0)} points
                        </p>
                      </div>
                      <Badge variant="outline">{reward._count.id}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Review Templates</span>
                    <span className="font-bold">{analyticsData.performanceStats.totalTemplates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Reviews</span>
                    <span className="font-bold">{analyticsData.performanceStats.totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completion Rate</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(analyticsData.performanceStats.reviewCompletionRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Goals</span>
                    <span className="font-bold">{analyticsData.performanceStats.totalGoals}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.performanceStats.reviewsByStatus.map((review) => (
                    <div key={review.status} className="flex items-center justify-between">
                      <span className="capitalize">{review.status.replace('_', ' ')}</span>
                      <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                        {review._count.id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('employee_summary')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Employee Summary</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive employee overview with attendance, leave, and performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('attendance_report')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Attendance Report</span>
                </CardTitle>
                <CardDescription>
                  Detailed attendance records with clock-in/out times and hours worked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('leave_report')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Leave Report</span>
                </CardTitle>
                <CardDescription>
                  Leave applications, approvals, and leave balance utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('performance_report')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Performance Report</span>
                </CardTitle>
                <CardDescription>
                  Performance reviews, goals, and achievement tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('reward_report')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Reward Report</span>
                </CardTitle>
                <CardDescription>
                  Employee rewards, points earned, and recognition analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateReport('department_analysis')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Department Analysis</span>
                </CardTitle>
                <CardDescription>
                  Department-wise performance, attendance, and productivity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Custom Report Builder</span>
              </CardTitle>
              <CardDescription>
                Create custom reports with specific date ranges and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select defaultValue="employee_summary">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee_summary">Employee Summary</SelectItem>
                      <SelectItem value="attendance_report">Attendance Report</SelectItem>
                      <SelectItem value="leave_report">Leave Report</SelectItem>
                      <SelectItem value="performance_report">Performance Report</SelectItem>
                      <SelectItem value="reward_report">Reward Report</SelectItem>
                      <SelectItem value="department_analysis">Department Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action</label>
                  <Button className="w-full" onClick={() => generateCustomReport()}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Custom Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(analyticsData.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
