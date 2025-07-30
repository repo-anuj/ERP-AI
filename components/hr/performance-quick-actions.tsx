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
  Users, 
  Target, 
  MessageSquare,
  FileText,
  BarChart,
  Award
} from 'lucide-react';

interface PerformanceQuickActionsProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
}

export function PerformanceQuickActions({
  open,
  onClose,
  onSuccess,
}: PerformanceQuickActionsProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setActiveDialog(actionId);
    onClose(); // Close the quick actions dialog
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-review',
      title: 'New Performance Review',
      description: 'Start a new performance review cycle',
      icon: Users,
      color: 'bg-blue-500',
      action: () => handleActionClick('new-review'),
    },
    {
      id: 'create-goal',
      title: 'Create Goal',
      description: 'Set new performance goals',
      icon: Target,
      color: 'bg-green-500',
      action: () => handleActionClick('create-goal'),
    },
    {
      id: 'give-feedback',
      title: 'Give Feedback',
      description: 'Provide performance feedback',
      icon: MessageSquare,
      color: 'bg-orange-500',
      action: () => handleActionClick('give-feedback'),
    },
    {
      id: 'create-template',
      title: 'Create Template',
      description: 'Design review template',
      icon: FileText,
      color: 'bg-purple-500',
      action: () => handleActionClick('create-template'),
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Performance insights and reports',
      icon: BarChart,
      color: 'bg-indigo-500',
      action: () => window.location.href = '/hr/performance?tab=analytics',
    },
    {
      id: 'recognition',
      title: 'Employee Recognition',
      description: 'Recognize outstanding performance',
      icon: Award,
      color: 'bg-yellow-500',
      action: () => handleActionClick('recognition'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Performance Quick Actions
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
                  onClick={action.action}
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
      </DialogContent>
    </Dialog>
  );
}
