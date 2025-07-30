'use client';

import { useState, useEffect, useCallback } from 'react';
import { hrmsRealtimeService, HRMSEventType, HRMSEvent, ConnectionState } from '@/lib/hrms-realtime-service';
import { useToast } from '@/components/ui/use-toast';

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  startDate: string;
  completionPercentage: number;
  estimatedHours: number;
  actualHours: number;
  approvalStatus: string;
  notes: string;
  assigneeId: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface UseRealtimeTasksOptions {
  projectId?: string;
  employeeId?: string;
  autoRefresh?: boolean;
  onTaskUpdate?: (task: Task) => void;
  onTaskAssigned?: (task: Task) => void;
  onTaskCompleted?: (task: Task) => void;
}

export function useRealtimeTasks(options: UseRealtimeTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const { toast } = useToast();

  const {
    projectId,
    employeeId,
    autoRefresh = true,
    onTaskUpdate,
    onTaskAssigned,
    onTaskCompleted
  } = options;

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/employee/tasks';
      const params = new URLSearchParams();
      
      if (projectId) {
        params.append('projectId', projectId);
      }
      if (employeeId) {
        params.append('employeeId', employeeId);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        setLastUpdate(new Date());
      } else {
        console.warn('Invalid tasks data structure:', data);
        setTasks([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, employeeId, toast]);

  // Handle real-time task updates
  const handleTaskUpdate = useCallback((event: HRMSEvent) => {
    const { data } = event;
    
    if (!data || !data.taskId) {
      return;
    }

    // Filter updates based on project/employee if specified
    if (projectId && data.projectId !== projectId) {
      return;
    }
    if (employeeId && data.assigneeId !== employeeId) {
      return;
    }

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(task => task.id === data.taskId);
      
      if (taskIndex >= 0) {
        // Update existing task
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          ...data.updates
        };
        
        setLastUpdate(new Date());
        
        // Call callback if provided
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks[taskIndex]);
        }
        
        return updatedTasks;
      } else if (data.task) {
        // Add new task if it doesn't exist
        const newTasks = [data.task, ...prevTasks];
        setLastUpdate(new Date());
        return newTasks;
      }
      
      return prevTasks;
    });

    // Show notification for task updates
    if (data.updateType) {
      let title = 'Task Updated';
      let description = `Task "${data.taskName || 'Unknown'}" has been updated`;
      
      switch (data.updateType) {
        case 'status_changed':
          title = 'Task Status Changed';
          description = `Task "${data.taskName}" status changed to ${data.newStatus}`;
          break;
        case 'progress_updated':
          title = 'Task Progress Updated';
          description = `Task "${data.taskName}" progress: ${data.completionPercentage}%`;
          break;
        case 'assigned':
          title = 'New Task Assigned';
          description = `You have been assigned: "${data.taskName}"`;
          if (onTaskAssigned && data.task) {
            onTaskAssigned(data.task);
          }
          break;
        case 'completed':
          title = 'Task Completed';
          description = `Task "${data.taskName}" has been completed`;
          if (onTaskCompleted && data.task) {
            onTaskCompleted(data.task);
          }
          break;
      }

      toast({
        title,
        description,
        duration: 5000,
      });
    }
  }, [projectId, employeeId, onTaskUpdate, onTaskAssigned, onTaskCompleted, toast]);

  // Handle task creation
  const handleTaskCreated = useCallback((event: HRMSEvent) => {
    const { data } = event;
    
    if (!data || !data.task) {
      return;
    }

    // Filter based on project/employee if specified
    if (projectId && data.task.projectId !== projectId) {
      return;
    }
    if (employeeId && data.task.assigneeId !== employeeId) {
      return;
    }

    setTasks(prevTasks => {
      // Check if task already exists
      const exists = prevTasks.some(task => task.id === data.task.id);
      if (!exists) {
        setLastUpdate(new Date());
        return [data.task, ...prevTasks];
      }
      return prevTasks;
    });

    toast({
      title: 'New Task Created',
      description: `Task "${data.task.name}" has been created`,
      duration: 5000,
    });
  }, [projectId, employeeId, toast]);

  // Handle task approval events
  const handleTaskApproval = useCallback((event: HRMSEvent) => {
    const { data } = event;
    
    if (!data || !data.taskId) {
      return;
    }

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(task => task.id === data.taskId);
      
      if (taskIndex >= 0) {
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          approvalStatus: data.approvalStatus,
          status: data.newStatus || updatedTasks[taskIndex].status,
          notes: data.notes || updatedTasks[taskIndex].notes
        };
        
        setLastUpdate(new Date());
        return updatedTasks;
      }
      
      return prevTasks;
    });

    const isApproved = data.approvalStatus === 'approved';
    toast({
      title: isApproved ? 'Task Approved' : 'Task Needs Revision',
      description: isApproved 
        ? `Your task "${data.taskName}" has been approved`
        : `Your task "${data.taskName}" needs revision: ${data.notes}`,
      variant: isApproved ? 'default' : 'destructive',
      duration: 7000,
    });
  }, [toast]);

  // Set up connection state monitoring
  useEffect(() => {
    // Initial state
    setConnectionState(hrmsRealtimeService.getConnectionState());
    setConnectionQuality(hrmsRealtimeService.getConnectionQuality());

    // Subscribe to connection changes
    const unsubscribeConnection = hrmsRealtimeService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setConnectionQuality(hrmsRealtimeService.getConnectionQuality());

      // Show connection status notifications
      if (state === ConnectionState.CONNECTED) {
        toast({
          title: 'Connected',
          description: 'Real-time updates are now active',
          duration: 3000,
        });
      } else if (state === ConnectionState.ERROR) {
        toast({
          title: 'Connection Error',
          description: 'Real-time updates are temporarily unavailable',
          variant: 'destructive',
          duration: 5000,
        });
      }
    });

    return unsubscribeConnection;
  }, [toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const unsubscribeUpdate = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_UPDATED,
      handleTaskUpdate
    );

    const unsubscribeCreated = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_CREATED,
      handleTaskCreated
    );

    const unsubscribeAssigned = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_ASSIGNED,
      handleTaskUpdate
    );

    const unsubscribeApproved = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_APPROVED,
      handleTaskApproval
    );

    const unsubscribeRejected = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_REJECTED,
      handleTaskApproval
    );

    const unsubscribeCompleted = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_COMPLETED,
      handleTaskUpdate
    );

    const unsubscribeSubmitted = hrmsRealtimeService.subscribe(
      HRMSEventType.TASK_SUBMITTED,
      handleTaskUpdate
    );

    return () => {
      unsubscribeUpdate();
      unsubscribeCreated();
      unsubscribeAssigned();
      unsubscribeApproved();
      unsubscribeRejected();
      unsubscribeCompleted();
      unsubscribeSubmitted();
    };
  }, [
    autoRefresh,
    handleTaskUpdate,
    handleTaskCreated,
    handleTaskApproval
  ]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update a task locally and send to server
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/employee/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state
      setTasks(prevTasks => {
        const taskIndex = prevTasks.findIndex(task => task.id === taskId);
        if (taskIndex >= 0) {
          const updatedTasks = [...prevTasks];
          updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...data.task };
          return updatedTasks;
        }
        return prevTasks;
      });

      // Send real-time update
      hrmsRealtimeService.sendTaskUpdate(taskId, data.task.projectId, 'manual_update', {
        updates,
        taskName: data.task.name
      });

      toast({
        title: 'Task Updated',
        description: 'Task has been updated successfully',
      });

      return data.task;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    tasks,
    loading,
    error,
    lastUpdate,
    connectionState,
    connectionQuality,
    fetchTasks,
    updateTask,
    refresh: fetchTasks,
    // Connection utilities
    isConnected: connectionState === ConnectionState.CONNECTED,
    connectionStats: hrmsRealtimeService.getConnectionStats(),
    forceReconnect: hrmsRealtimeService.forceReconnect.bind(hrmsRealtimeService)
  };
}
