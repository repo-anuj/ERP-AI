'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/lib/permissions';

// Define the context type
interface PermissionContextType {
  permissions: string[];
  loading: boolean;
  error: string | null;
  userRole: string | null;
  userDepartment: string | null;
  isEmployee: boolean;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
}

// Create the context with a default value
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Provider component
export function PermissionProvider({ children }: { children: ReactNode }) {
  const permissionData = usePermissions();
  
  return (
    <PermissionContext.Provider value={permissionData}>
      {children}
    </PermissionContext.Provider>
  );
}

// Custom hook to use the permission context
export function usePermissionContext() {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  
  return context;
}

// Higher-order component to protect routes based on permissions
export function withPermission(Component: React.ComponentType, requiredPermission: string) {
  return function ProtectedComponent(props: any) {
    const { can, loading } = usePermissionContext();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!can(requiredPermission)) {
      return <div>You don't have permission to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
}

// Component to conditionally render based on permissions
export function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}: { 
  permission: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { can, loading } = usePermissionContext();
  
  if (loading) {
    return null;
  }
  
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

// Component to conditionally render based on multiple permissions (any)
export function PermissionGateAny({ 
  permissions, 
  children, 
  fallback = null 
}: { 
  permissions: string[]; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { canAny, loading } = usePermissionContext();
  
  if (loading) {
    return null;
  }
  
  return canAny(permissions) ? <>{children}</> : <>{fallback}</>;
}

// Component to conditionally render based on multiple permissions (all)
export function PermissionGateAll({ 
  permissions, 
  children, 
  fallback = null 
}: { 
  permissions: string[]; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const { canAll, loading } = usePermissionContext();
  
  if (loading) {
    return null;
  }
  
  return canAll(permissions) ? <>{children}</> : <>{fallback}</>;
}
