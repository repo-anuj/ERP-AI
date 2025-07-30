'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Target, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  RefreshCw,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface DashboardData {
  summary: {
    totalEmployees: number;
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    overdueReviews: number;
    reviewCompletionRate: number;
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    notStartedGoals: number;
    goalCompletionRate: number;
    totalFeedbacks: number;
    averageRating: number;
    totalTemplates: number;
  };
  departmentStats: Array<{
    id: string;
    name: string;
    totalEmployees: number;
    totalReviews: number;
    completedReviews: number;
    reviewCompletionRate: number;
    totalGoals: number;
    completedGoals: number;
    goalCompletionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    reviews: number;
    goals: number;
    completedReviews: number;
    completedGoals: number;
  }>;
  recentReviews: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    templateName: string;
    reviewType: string;
    status: string;
    overallRating?: number;
    dueDate: string;
    createdAt: string;
  }>;
  upcomingReviews: Array<{
    id: string;
    employeeName: string;
    employeeId: string;
    templateName: string;
    reviewType: string;
    status: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  goalStats: Record<string, number>;
  reviewStats: Record<string, number>;
  filters: {
    year: number;
    departmentId?: string;
  };
}

export function PerformanceDashboard() {
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

      const response = await fetch(`/api/hr/performance/dashboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, departmentFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'pending_approval':
        return <Badge variant="outline">Pending Approval</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 3) return 'text-orange-600';
    if (daysUntilDue <= 7) return 'text-yellow-600';
    return 'text-gray-600';
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
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No data available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Unable to load performance dashboard data.
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
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.completedReviews} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(dashboardData.summary.reviewCompletionRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.pendingReviews} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.summary.totalGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.summary.completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.summary.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.upcomingReviews.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                <p className="text-sm text-muted-foreground mt-2">No upcoming reviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcomingReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{review.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.templateName} • {review.reviewType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getUrgencyColor(review.daysUntilDue)}`}>
                        {review.daysUntilDue < 0 
                          ? `${Math.abs(review.daysUntilDue)} days overdue`
                          : review.daysUntilDue === 0 
                            ? 'Due today'
                            : `${review.daysUntilDue} days left`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(review.dueDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentReviews.length === 0 ? (
              <div className="text-center py-4">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">No recent reviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{review.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.templateName} • {review.reviewType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(review.status)}
                      {review.overallRating && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Rating: {review.overallRating}/5
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.departmentStats.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.totalEmployees} employees
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{Math.round(dept.reviewCompletionRate)}%</div>
                    <div className="text-xs text-muted-foreground">
                      Review completion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Goals</span>
                <span className="font-medium text-green-600">
                  {dashboardData.summary.completedGoals}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-medium text-blue-600">
                  {dashboardData.summary.inProgressGoals}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Not Started</span>
                <span className="font-medium text-gray-600">
                  {dashboardData.summary.notStartedGoals}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="font-bold text-green-600">
                    {Math.round(dashboardData.summary.goalCompletionRate)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
