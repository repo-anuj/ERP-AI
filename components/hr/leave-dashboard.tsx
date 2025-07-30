'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Building,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface DashboardData {
  summary: {
    totalApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
    totalLeaveDays: number;
    averageLeaveDays: number;
    utilizationPercentage: number;
    totalEntitledDays: number;
    totalUsedDays: number;
    totalAvailableDays: number;
  };
  leaveTypeStats: Array<{
    id: string;
    name: string;
    totalApplications: number;
    approvedApplications: number;
    totalDays: number;
    averageDays: number;
  }>;
  departmentStats: Array<{
    id: string;
    name: string;
    totalEmployees: number;
    totalApplications: number;
    approvedApplications: number;
    totalDays: number;
    averageDaysPerEmployee: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    totalDays: number;
  }>;
  pendingApprovals: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    appliedAt: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
  recentApplications: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    appliedAt: string;
  }>;
  upcomingLeaves: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    daysUntilStart: number;
  }>;
}

export function LeaveDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const { toast } = useToast();

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear,
        ...(departmentFilter !== 'all' && { departmentId: departmentFilter }),
      });

      const response = await fetch(`/api/hr/leave/dashboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, departmentFilter]);

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No data available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Unable to load leave dashboard data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {/* TODO: Add department options */}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.approvedApplications} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.summary.pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(dashboardData.summary.utilizationPercentage)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.totalUsedDays} of {dashboardData.summary.totalEntitledDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Days</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.summary.totalAvailableDays}
            </div>
            <p className="text-xs text-muted-foreground">
              Days remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.pendingApprovals.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="text-sm text-muted-foreground mt-2">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.pendingApprovals.slice(0, 5).map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{approval.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {approval.leaveType} • {approval.totalDays} days
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getUrgencyBadge(approval.urgency)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(approval.startDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentApplications.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">No recent applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentApplications.slice(0, 5).map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{application.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {application.leaveType} • {application.totalDays} days
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(application.status)}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(application.appliedAt), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Type Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Leave Type Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.leaveTypeStats.map((stat) => (
                <div key={stat.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{stat.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.totalApplications} applications
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stat.totalDays} days</div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {Math.round(stat.averageDays * 10) / 10} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Leaves */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.upcomingLeaves.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">No upcoming leaves</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcomingLeaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{leave.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {leave.leaveType} • {leave.totalDays} days
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {leave.daysUntilStart === 0 ? 'Today' : `${leave.daysUntilStart} days`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(leave.startDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
