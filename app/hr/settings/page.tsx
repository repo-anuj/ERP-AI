'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IdProofTypesManager } from '@/components/hr/id-proof-types-manager';
import { DepartmentManagement } from '@/components/hr/department-management';
import { RewardManagement } from '@/components/hr/reward-management';
import { LeaveManagement } from '@/components/hr/leave-management';
import { PerformanceManagement } from '@/components/hr/performance-management';
import { JobPostingSettings } from '@/components/hr/job-posting-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Users, Award, Calendar, Target, Globe } from 'lucide-react';
import Link from 'next/link';

export default function HRSettingsPage() {

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/hr">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to HR
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">HR Settings</h2>
            <p className="text-muted-foreground">
              Configure HR system settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="departments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Departments</span>
          </TabsTrigger>
          <TabsTrigger value="job-posting" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Job Posting</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Leave</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="id-proofs" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>ID Proof Types</span>
          </TabsTrigger>
        </TabsList>

        {/* ID Proof Types Tab */}
        <TabsContent value="id-proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>ID Proof Types Management</span>
              </CardTitle>
              <CardDescription>
                Configure the types of identification documents your company requires from employees. 
                All ID proof values are encrypted for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdProofTypesManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <DepartmentManagement />
        </TabsContent>

        {/* Job Posting Tab */}
        <TabsContent value="job-posting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Job Posting Distribution</span>
              </CardTitle>
              <CardDescription>
                Configure where your job postings are automatically distributed and manage platform integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobPostingSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <RewardManagement />
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leave" className="space-y-6">
          <LeaveManagement />
        </TabsContent>

        {/* Performance Management Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceManagement />
        </TabsContent>

        {/* ID Proof Types Tab */}
        <TabsContent value="id-proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>ID Proof Types Management</span>
              </CardTitle>
              <CardDescription>
                Configure the types of identification documents your company requires from employees.
                All ID proof values are encrypted for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdProofTypesManager />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
