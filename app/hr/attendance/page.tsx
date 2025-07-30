'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Settings, BarChart, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { AttendanceDashboard } from '@/components/hr/attendance-dashboard';
import { AttendanceTimeTracking } from '@/components/hr/attendance-time-tracking';
import { AttendanceShiftManagement } from '@/components/hr/attendance-shift-management';
import { AttendanceReports } from '@/components/hr/attendance-reports';
import { AttendancePolicyManagement } from '@/components/hr/attendance-policy-management';
import { AttendanceQuickActions } from '@/components/hr/attendance-quick-actions';
import { AttendanceSettings } from '@/components/hr/attendance-settings';

export default function AttendancePage() {
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
            <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
            <p className="text-muted-foreground">
              Comprehensive attendance tracking, shift management, and workforce analytics
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="time-tracking" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shift Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AttendanceDashboard />
        </TabsContent>

        <TabsContent value="time-tracking">
          <AttendanceTimeTracking />
        </TabsContent>

        <TabsContent value="shifts">
          <AttendanceShiftManagement />
        </TabsContent>

        <TabsContent value="reports">
          <AttendanceReports />
        </TabsContent>

        <TabsContent value="policies">
          <AttendancePolicyManagement />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AttendanceQuickActions
        open={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onSuccess={handleQuickActionSuccess}
      />

      <AttendanceSettings
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
