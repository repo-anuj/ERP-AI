import { useEffect, useState } from 'react';
import { PERMISSIONS, hasPermission, getCombinedPermissions } from '@/lib/permissions';

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    async function fetchUserPermissions() {
      try {
        setLoading(true);

        // Fetch the current user's permissions from the API
        const response = await fetch('/api/auth/permissions');

        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();

        // Set the permissions
        setPermissions(data.permissions || []);
        setUserRole(data.role || null);
        setUserDepartment(data.department || null);
        setIsEmployee(data.isEmployee || false);

      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set default permissions (minimal access)
        setPermissions([PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_SETTINGS]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPermissions();
  }, []);

  // Check if the user has a specific permission
  const can = (permission: string): boolean => {
    // If this is a regular user (not an employee), they have unrestricted access
    if (!isEmployee) return true;

    // Otherwise, check if the employee has the specific permission
    return hasPermission(permissions, permission);
  };

  // Check if the user has any of the specified permissions
  const canAny = (permissionList: string[]): boolean => {
    return permissionList.some(permission => can(permission));
  };

  // Check if the user has all of the specified permissions
  const canAll = (permissionList: string[]): boolean => {
    return permissionList.every(permission => can(permission));
  };

  return {
    permissions,
    loading,
    error,
    userRole,
    userDepartment,
    isEmployee,
    can,
    canAny,
    canAll,
  };
}
