'use client';

import { useEffect, useState } from 'react';

interface ManagedProject {
  id: string;
  name: string;
  status: string;
  teamMembersCount: number;
  pendingTasksCount: number;
}

interface ManagerStatus {
  isManager: boolean;
  managedProjects: ManagedProject[];
  totalManagedProjects: number;
  totalPendingApprovals: number;
  loading: boolean;
  error: string | null;
}

export function useManagerStatus() {
  const [managerStatus, setManagerStatus] = useState<ManagerStatus>({
    isManager: false,
    managedProjects: [],
    totalManagedProjects: 0,
    totalPendingApprovals: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchManagerStatus() {
      try {
        setManagerStatus(prev => ({ ...prev, loading: true, error: null }));

        // First, get the current employee profile to check if they're a manager
        const profileResponse = await fetch('/api/auth/employee-profile');
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch employee profile');
        }

        const profileData = await profileResponse.json();
        
        // If not an employee, return early
        if (!profileData.isEmployee) {
          setManagerStatus(prev => ({ 
            ...prev, 
            loading: false,
            isManager: false 
          }));
          return;
        }

        // Check if this employee is a project manager
        const managerCheckResponse = await fetch('/api/employee/manager/status');
        if (!managerCheckResponse.ok) {
          // If the endpoint doesn't exist or fails, assume not a manager
          setManagerStatus(prev => ({ 
            ...prev, 
            loading: false,
            isManager: false 
          }));
          return;
        }

        const managerData = await managerCheckResponse.json();
        
        setManagerStatus({
          isManager: managerData.isManager || false,
          managedProjects: managerData.managedProjects || [],
          totalManagedProjects: managerData.totalManagedProjects || 0,
          totalPendingApprovals: managerData.totalPendingApprovals || 0,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching manager status:', error);
        setManagerStatus(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          isManager: false,
        }));
      }
    }

    fetchManagerStatus();
  }, []);

  // Refresh manager status (useful after project assignments change)
  const refreshManagerStatus = async () => {
    setManagerStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch('/api/employee/manager/status');
      if (response.ok) {
        const data = await response.json();
        setManagerStatus(prev => ({
          ...prev,
          isManager: data.isManager || false,
          managedProjects: data.managedProjects || [],
          totalManagedProjects: data.totalManagedProjects || 0,
          totalPendingApprovals: data.totalPendingApprovals || 0,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Error refreshing manager status:', error);
      setManagerStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  return {
    ...managerStatus,
    refreshManagerStatus,
  };
}
