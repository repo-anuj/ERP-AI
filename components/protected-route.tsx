'use client';

import { ReactNode } from 'react';
import { usePermissionContext } from '@/contexts/permission-context';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProtectedRouteProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ permission, children, fallback }: ProtectedRouteProps) {
  const { can, loading } = usePermissionContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!can(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

interface ProtectedElementProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedElement({ permission, children, fallback }: ProtectedElementProps) {
  const { can, loading } = usePermissionContext();

  if (loading) {
    return null;
  }

  if (!can(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
