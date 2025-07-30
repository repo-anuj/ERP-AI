'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  FileText
} from 'lucide-react';

export default function ProjectAnalyticsPage() {
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
        <Badge variant="secondary" className="text-sm">
          Coming Soon
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              75% of total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45d</div>
            <p className="text-xs text-muted-foreground">
              -5 days from average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Project Performance Analytics
            </CardTitle>
            <CardDescription>
              Track project completion rates, timeline adherence, and team productivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">On-time Completion Rate</span>
              <Badge variant="outline">85%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Budget Adherence</span>
              <Badge variant="outline">92%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Team Productivity Score</span>
              <Badge variant="outline">78/100</Badge>
            </div>
            <div className="pt-4">
              <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Interactive charts coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Analytics
            </CardTitle>
            <CardDescription>
              Monitor project profitability, budget utilization, and ROI metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Project Value</span>
              <Badge variant="outline">$2.4M</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Project ROI</span>
              <Badge variant="outline">145%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Budget Variance</span>
              <Badge variant="outline">-8%</Badge>
            </div>
            <div className="pt-4">
              <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Financial dashboards coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Analytics
            </CardTitle>
            <CardDescription>
              Analyze team performance, workload distribution, and skill utilization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Team Utilization</span>
              <Badge variant="outline">87%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Task Completion</span>
              <Badge variant="outline">4.2 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Skill Match Score</span>
              <Badge variant="outline">91%</Badge>
            </div>
            <div className="pt-4">
              <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Team insights coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Risk & Quality Analytics
            </CardTitle>
            <CardDescription>
              Monitor project risks, quality metrics, and predictive insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Risk Score</span>
              <Badge variant="outline">Low</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quality Score</span>
              <Badge variant="outline">94%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Predicted Delays</span>
              <Badge variant="outline">2 projects</Badge>
            </div>
            <div className="pt-4">
              <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Risk analytics coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Features
          </CardTitle>
          <CardDescription>
            Advanced analytics features planned for future releases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Automated Reports</p>
                <p className="text-sm text-muted-foreground">AI-generated insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Predictive Analytics</p>
                <p className="text-sm text-muted-foreground">Forecast project outcomes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Goal Tracking</p>
                <p className="text-sm text-muted-foreground">Monitor KPIs and objectives</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <Button variant="outline" disabled>
          <BarChart className="mr-2 h-4 w-4" />
          Full Analytics Dashboard (Coming Soon)
        </Button>
      </div>
    </div>
  );
}
