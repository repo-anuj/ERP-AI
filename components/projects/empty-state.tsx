'use client';

import { ClipboardList } from 'lucide-react';
import { AddProjectDialog } from '@/components/projects/add-project-dialog';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <ClipboardList className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight mb-2">No projects yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by creating your first project. Track progress, manage tasks, and collaborate with your team.
      </p>
      <AddProjectDialog />
    </div>
  );
}
