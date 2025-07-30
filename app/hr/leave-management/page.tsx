'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Settings, BarChart, Users, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { LeaveDashboard } from '@/components/hr/leave-dashboard';
import { LeaveApplications } from '@/components/hr/leave-applications';
import { LeaveApprovals } from '@/components/hr/leave-approvals';
import { LeaveBalances } from '@/components/hr/leave-balances';
import { LeaveCalendar } from '@/components/hr/leave-calendar';
import { LeaveTypes } from '@/components/hr/leave-types';
import { LeaveQuickActions } from '@/components/hr/leave-quick-actions';
import { LeaveSettings } from '@/components/hr/leave-settings';

export default function LeaveManagementPage() {
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
            <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
            <p className="text-muted-foreground">
              Comprehensive leave tracking, approvals, and workforce planning
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
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Leave Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <LeaveDashboard />
        </TabsContent>

        <TabsContent value="applications">
          <LeaveApplications />
        </TabsContent>

        <TabsContent value="approvals">
          <LeaveApprovals />
        </TabsContent>

        <TabsContent value="balances">
          <LeaveBalances />
        </TabsContent>

        <TabsContent value="calendar">
          <LeaveCalendar />
        </TabsContent>

        <TabsContent value="types">
          <LeaveTypes />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LeaveQuickActions
        open={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onSuccess={handleQuickActionSuccess}
      />

      <LeaveSettings
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
