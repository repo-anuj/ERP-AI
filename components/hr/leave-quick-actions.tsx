'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Calendar,
  Users,
  Settings,
  Download,
  Upload,
  Clock
} from 'lucide-react';
import { LeaveApplicationForm } from './leave-application-form';
import { LeaveBalanceAdjustment } from './leave-balance-adjustment';
import { LeaveBulkApproval } from './leave-bulk-approval';
import { LeaveDataExport } from './leave-data-export';
import { LeaveYearEndProcess } from './leave-year-end-process';

interface LeaveQuickActionsProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeaveQuickActions({
  open,
  onClose,
  onSuccess,
}: LeaveQuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'new-application',
      title: 'New Leave Application',
      description: 'Apply for leave on behalf of employee',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      id: 'bulk-approve',
      title: 'Bulk Approve',
      description: 'Approve multiple leave applications',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      id: 'adjust-balance',
      title: 'Adjust Balance',
      description: 'Adjust employee leave balance',
      icon: Settings,
      color: 'bg-orange-500',
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export leave data to Excel',
      icon: Download,
      color: 'bg-purple-500',
    },
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Import leave data from file',
      icon: Upload,
      color: 'bg-indigo-500',
    },
    {
      id: 'year-end',
      title: 'Year End Process',
      description: 'Process year-end leave balances',
      icon: Clock,
      color: 'bg-red-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Leave Quick Actions
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={action.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setActiveAction(action.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Dialogs */}
        <LeaveApplicationForm
          open={activeAction === 'new-application'}
          onClose={() => setActiveAction(null)}
          onSuccess={() => {
            setActiveAction(null);
            onSuccess?.();
          }}
        />

        <LeaveBulkApproval
          open={activeAction === 'bulk-approve'}
          onClose={() => setActiveAction(null)}
          onSuccess={() => {
            setActiveAction(null);
            onSuccess?.();
          }}
        />

        <LeaveBalanceAdjustment
          open={activeAction === 'adjust-balance'}
          onClose={() => setActiveAction(null)}
          onSuccess={() => {
            setActiveAction(null);
            onSuccess?.();
          }}
        />

        <LeaveDataExport
          open={activeAction === 'export-data'}
          onClose={() => setActiveAction(null)}
        />

        <LeaveYearEndProcess
          open={activeAction === 'year-end'}
          onClose={() => setActiveAction(null)}
          onSuccess={() => {
            setActiveAction(null);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
