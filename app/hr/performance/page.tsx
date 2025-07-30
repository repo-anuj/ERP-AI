'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Settings, BarChart, Users, Target, MessageSquare, Award } from 'lucide-react';
import Link from 'next/link';
import { PerformanceDashboard } from '@/components/hr/performance-dashboard';
import { PerformanceReviews } from '@/components/hr/performance-reviews';
import { PerformanceGoals } from '@/components/hr/performance-goals';
import { PerformanceFeedback } from '@/components/hr/performance-feedback';
import { PerformanceTemplates } from '@/components/hr/performance-templates';
import { PerformanceAnalytics } from '@/components/hr/performance-analytics';
import { PerformanceQuickActions } from '@/components/hr/performance-quick-actions';
import { PerformanceSettings } from '@/components/hr/performance-settings';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleQuickActionSuccess = () => {
    // Refresh data or perform any necessary updates
    window.location.reload();
  };

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
            <h2 className="text-3xl font-bold tracking-tight">Performance Management</h2>
            <p className="text-muted-foreground">
              Comprehensive performance tracking, reviews, goals, and employee development
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setIsQuickActionsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="reviews">
          <PerformanceReviews />
        </TabsContent>

        <TabsContent value="goals">
          <PerformanceGoals />
        </TabsContent>

        <TabsContent value="feedback">
          <PerformanceFeedback />
        </TabsContent>

        <TabsContent value="templates">
          <PerformanceTemplates />
        </TabsContent>

        <TabsContent value="analytics">
          <PerformanceAnalytics />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PerformanceQuickActions
        open={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onSuccess={handleQuickActionSuccess}
      />

      <PerformanceSettings
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
