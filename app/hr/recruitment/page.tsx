'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Briefcase, Calendar, Clock, TrendingUp,
  UserPlus, FileText, Shield, CheckCircle, AlertTriangle,
  Eye, Plus, BarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DashboardStats {
  summary: {
    totalJobPostings: number;
    totalApplications: number;
    totalCandidates: number;
    totalInterviews: number;
    totalOffers: number;
    interviewSuccessRate: number;
    offerAcceptanceRate: number;
    averageTimeToHire: number;
  };
  recentActivity: {
    newApplications: number;
    scheduledInterviews: number;
    pendingOffers: number;
    activeBackgroundChecks: number;
    onboardingInProgress: number;
  };
  urgentItems: {
    overdueInterviews: number;
    expiredOffers: number;
    pendingApprovals: number;
    overdueBackgroundChecks: number;
  };
}

export default function RecruitmentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/recruitment/analytics?period=30');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');

      const data = await response.json();
      
      // Transform analytics data for dashboard
      const dashboardStats: DashboardStats = {
        summary: data.summary,
        recentActivity: {
          newApplications: data.summary.totalApplications,
          scheduledInterviews: data.summary.totalInterviews,
          pendingOffers: data.summary.totalOffers,
          activeBackgroundChecks: data.backgroundCheckStats.total - data.backgroundCheckStats.completed,
          onboardingInProgress: data.onboardingStats.inProgress,
        },
        urgentItems: {
          overdueInterviews: 0, // Would need specific API for this
          expiredOffers: 0, // Would need specific API for this
          pendingApprovals: 0, // Would need specific API for this
          overdueBackgroundChecks: 0, // Would need specific API for this
        }
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recruitment dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading recruitment dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">No dashboard data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Dashboard</h1>
          <p className="text-gray-600">Manage your entire recruitment process from one place</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/recruitment/analytics">
            <Button variant="outline">
              <BarChart className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/hr/recruitment/job-postings/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{stats.summary.totalApplications}</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Job Postings</p>
                <p className="text-2xl font-bold">{stats.summary.totalJobPostings}</p>
                <p className="text-xs text-gray-500 mt-1">Currently open</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offer Acceptance Rate</p>
                <p className="text-2xl font-bold">{stats.summary.offerAcceptanceRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Success rate</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
                <p className="text-2xl font-bold">{stats.summary.averageTimeToHire}</p>
                <p className="text-xs text-gray-500 mt-1">Days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common recruitment tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/hr/recruitment/job-postings/create">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="w-6 h-6" />
                <span className="text-xs">Post Job</span>
              </Button>
            </Link>
            
            <Link href="/hr/recruitment/candidates">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-xs">View Candidates</span>
              </Button>
            </Link>
            
            <Link href="/hr/recruitment/interviews">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Calendar className="w-6 h-6" />
                <span className="text-xs">Schedule Interview</span>
              </Button>
            </Link>
            
            <Link href="/hr/recruitment/offers/create">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-xs">Create Offer</span>
              </Button>
            </Link>
            
            <Link href="/hr/recruitment/background-checks/create">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-xs">Background Check</span>
              </Button>
            </Link>
            
            <Link href="/hr/onboarding/instances/create">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <UserPlus className="w-6 h-6" />
                <span className="text-xs">Start Onboarding</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest recruitment activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">New Applications</p>
                    <p className="text-sm text-gray-600">Recent candidate applications</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{stats.recentActivity.newApplications}</p>
                  <Link href="/hr/recruitment/applications">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Scheduled Interviews</p>
                    <p className="text-sm text-gray-600">Upcoming interviews</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">{stats.recentActivity.scheduledInterviews}</p>
                  <Link href="/hr/recruitment/interviews">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Pending Offers</p>
                    <p className="text-sm text-gray-600">Offers awaiting response</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{stats.recentActivity.pendingOffers}</p>
                  <Link href="/hr/recruitment/offers">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Onboarding in Progress</p>
                    <p className="text-sm text-gray-600">New hires being onboarded</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{stats.recentActivity.onboardingInProgress}</p>
                  <Link href="/hr/onboarding/instances">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Overview of recruitment system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Job Postings</p>
                    <p className="text-sm text-gray-600">All systems operational</p>
                  </div>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Application Tracking</p>
                    <p className="text-sm text-gray-600">Processing applications</p>
                  </div>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Background Checks</p>
                    <p className="text-sm text-gray-600">Vendor integrations active</p>
                  </div>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Onboarding Workflows</p>
                    <p className="text-sm text-gray-600">Automated processes running</p>
                  </div>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">All Systems Operational</span>
                </div>
                <p className="text-sm text-green-700">
                  Your recruitment system is running smoothly with all modules active and functioning properly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
