'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart, TrendingUp, Users, Briefcase, Calendar,
  Target, Clock, CheckCircle, AlertTriangle, Download,
  UserCheck, FileText, Shield, GraduationCap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
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
  distributions: {
    applicationsByStatus: Record<string, number>;
    candidatesBySource: Record<string, number>;
  };
  conversionFunnel: {
    applications: number;
    screenings: number;
    interviews: number;
    offers: number;
    hires: number;
  };
  departmentStats: Record<string, {
    applications: number;
    hires: number;
    conversionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    hires: number;
    conversionRate: number;
  }>;
  backgroundCheckStats: {
    total: number;
    completed: number;
    clear: number;
    flagged: number;
    failed: number;
  };
  onboardingStats: {
    total: number;
    completed: number;
    inProgress: number;
    averageCompletion: number;
  };
}

export default function RecruitmentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customDateRange, setCustomDateRange] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (customDateRange && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('period', period);
      }

      const response = await fetch(`/api/hr/recruitment/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recruitment analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, startDate, endDate, customDateRange]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      offer: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateConversionRate = (current: number, previous: number) => {
    return previous > 0 ? ((current / previous) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your recruitment performance</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Time Period:</Label>
              <Select 
                value={customDateRange ? 'custom' : period} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setCustomDateRange(true);
                  } else {
                    setCustomDateRange(false);
                    setPeriod(value);
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customDateRange && (
              <>
                <div className="flex items-center gap-2">
                  <Label>From:</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>To:</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}

            <Button onClick={fetchAnalytics} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{analytics.summary.totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Job Postings</p>
                <p className="text-2xl font-bold">{analytics.summary.totalJobPostings}</p>
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
                <p className="text-2xl font-bold">{analytics.summary.offerAcceptanceRate}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
                <p className="text-2xl font-bold">{analytics.summary.averageTimeToHire} days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recruitment Funnel
          </CardTitle>
          <CardDescription>Track candidate progression through the recruitment process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{analytics.conversionFunnel.applications}</div>
                  <div className="text-sm text-gray-600">Applications</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.conversionFunnel.screenings}</div>
                  <div className="text-sm text-gray-600">Screenings</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateConversionRate(analytics.conversionFunnel.screenings, analytics.conversionFunnel.applications)}%
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{analytics.conversionFunnel.interviews}</div>
                  <div className="text-sm text-gray-600">Interviews</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateConversionRate(analytics.conversionFunnel.interviews, analytics.conversionFunnel.screenings)}%
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{analytics.conversionFunnel.offers}</div>
                  <div className="text-sm text-gray-600">Offers</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateConversionRate(analytics.conversionFunnel.offers, analytics.conversionFunnel.interviews)}%
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-emerald-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-emerald-600">{analytics.conversionFunnel.hires}</div>
                  <div className="text-sm text-gray-600">Hires</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateConversionRate(analytics.conversionFunnel.hires, analytics.conversionFunnel.offers)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
            <CardDescription>Breakdown of applications by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.distributions.applicationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(count / analytics.summary.totalApplications) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Candidate Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Sources</CardTitle>
            <CardDescription>Where candidates are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.distributions.candidatesBySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${(count / analytics.summary.totalCandidates) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Recruitment metrics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Department</th>
                  <th className="text-right py-2">Applications</th>
                  <th className="text-right py-2">Hires</th>
                  <th className="text-right py-2">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.departmentStats).map(([dept, stats]) => (
                  <tr key={dept} className="border-b">
                    <td className="py-2 font-medium">{dept}</td>
                    <td className="text-right py-2">{stats.applications}</td>
                    <td className="text-right py-2">{stats.hires}</td>
                    <td className="text-right py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stats.conversionRate >= 20 ? 'bg-green-100 text-green-800' :
                        stats.conversionRate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stats.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Background Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Background Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{analytics.backgroundCheckStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium">{analytics.backgroundCheckStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Clear</span>
                <span className="font-medium text-green-600">{analytics.backgroundCheckStats.clear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-600">Flagged</span>
                <span className="font-medium text-yellow-600">{analytics.backgroundCheckStats.flagged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">Failed</span>
                <span className="font-medium text-red-600">{analytics.backgroundCheckStats.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-medium">{analytics.onboardingStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium">{analytics.onboardingStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="font-medium">{analytics.onboardingStats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. Completion</span>
                <span className="font-medium">{analytics.onboardingStats.averageCompletion.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interview Success</span>
                <span className="font-medium">{analytics.summary.interviewSuccessRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Offer Acceptance</span>
                <span className="font-medium">{analytics.summary.offerAcceptanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time to Hire</span>
                <span className="font-medium">{analytics.summary.averageTimeToHire} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Candidates</span>
                <span className="font-medium">{analytics.summary.totalCandidates}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
