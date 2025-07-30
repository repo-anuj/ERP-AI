'use client';

import { useState, useEffect, useCallback } from 'react';
import { hrmsRealtimeService, HRMSEventType, HRMSEvent, ConnectionState } from '@/lib/hrms-realtime-service';
import { useToast } from '@/components/ui/use-toast';

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'task' | 'approval';
  timestamp: string;
  read: boolean;
  userId: string;
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  requiresAction?: boolean;
  expiresAt?: string;
}

interface UseRealtimeNotificationsOptions {
  enableBrowserNotifications?: boolean;
  enableToastNotifications?: boolean;
  filterByPriority?: ('low' | 'medium' | 'high' | 'urgent')[];
  filterByCategory?: string[];
  maxNotifications?: number;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  const {
    enableBrowserNotifications = true,
    enableToastNotifications = true,
    filterByPriority = ['low', 'medium', 'high', 'urgent'],
    filterByCategory = [],
    maxNotifications = 100
  } = options;

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && enableBrowserNotifications) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      return permission;
    }
    return 'denied';
  }, [enableBrowserNotifications]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: RealtimeNotification) => {
    if (browserNotificationPermission === 'granted' && enableBrowserNotifications) {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.requiresAction,
        silent: notification.priority === 'low'
      });

      browserNotif.onclick = () => {
        if (notification.actionUrl) {
          window.focus();
          window.location.href = notification.actionUrl;
        }
        browserNotif.close();
      };

      // Auto-close after delay based on priority
      const autoCloseDelay = notification.priority === 'urgent' ? 10000 : 
                           notification.priority === 'high' ? 7000 : 5000;
      
      setTimeout(() => {
        browserNotif.close();
      }, autoCloseDelay);
    }
  }, [browserNotificationPermission, enableBrowserNotifications]);

  // Show toast notification
  const showToastNotification = useCallback((notification: RealtimeNotification) => {
    if (enableToastNotifications) {
      const variant = notification.type === 'error' ? 'destructive' : 'default';
      const duration = notification.priority === 'urgent' ? 10000 : 
                      notification.priority === 'high' ? 7000 : 5000;

      toast({
        title: notification.title,
        description: notification.message,
        variant,
        duration,
        // Note: Action removed due to TypeScript complexity in .ts files
        // Users can click on the notification to navigate to the actionUrl
      });
    }
  }, [enableToastNotifications, toast]);

  // Handle new notification events
  const handleNewNotification = useCallback((event: HRMSEvent) => {
    const { data, priority = 'medium', category = 'system', requiresAction = false } = event;
    
    if (!data) return;

    // Filter by priority
    if (!filterByPriority.includes(priority)) {
      return;
    }

    // Filter by category
    if (filterByCategory.length > 0 && !filterByCategory.includes(category)) {
      return;
    }

    const notification: RealtimeNotification = {
      id: `${event.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: data.title || 'New Notification',
      message: data.message || 'You have a new notification',
      type: data.type || 'info',
      timestamp: event.timestamp,
      read: false,
      userId: event.userId || '',
      projectId: event.projectId,
      taskId: event.taskId,
      actionUrl: data.actionUrl,
      priority,
      category,
      requiresAction,
      expiresAt: event.expiresAt
    };

    // Add to notifications list
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Limit notifications count
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Show notifications
    showBrowserNotification(notification);
    showToastNotification(notification);
  }, [filterByPriority, filterByCategory, maxNotifications, showBrowserNotification, showToastNotification]);

  // Handle task-specific notifications
  const handleTaskNotification = useCallback((event: HRMSEvent) => {
    const { data, type } = event;
    
    let title = 'Task Update';
    let message = 'A task has been updated';
    let notificationType: RealtimeNotification['type'] = 'info';
    let priority: RealtimeNotification['priority'] = 'medium';

    switch (type) {
      case HRMSEventType.TASK_ASSIGNED:
        title = 'New Task Assigned';
        message = `You have been assigned: "${data.taskName}"`;
        notificationType = 'task';
        priority = 'high';
        break;
      case HRMSEventType.TASK_APPROVED:
        title = 'Task Approved';
        message = `Your task "${data.taskName}" has been approved`;
        notificationType = 'success';
        priority = 'medium';
        break;
      case HRMSEventType.TASK_REJECTED:
        title = 'Task Needs Revision';
        message = `Your task "${data.taskName}" needs revision`;
        notificationType = 'error';
        priority = 'high';
        break;
      case HRMSEventType.TASK_SUBMITTED:
        title = 'Task Submitted for Approval';
        message = `"${data.taskName}" has been submitted for your approval`;
        notificationType = 'approval';
        priority = 'urgent';
        break;
      case HRMSEventType.TASK_COMPLETED:
        title = 'Task Completed';
        message = `Task "${data.taskName}" has been completed`;
        notificationType = 'success';
        priority = 'medium';
        break;
      case HRMSEventType.TASK_OVERDUE:
        title = 'Task Overdue';
        message = `Task "${data.taskName}" is overdue`;
        notificationType = 'error';
        priority = 'urgent';
        break;
      case HRMSEventType.TASK_DUE_SOON:
        title = 'Task Due Soon';
        message = `Task "${data.taskName}" is due soon`;
        notificationType = 'warning';
        priority = 'high';
        break;
    }

    const enhancedEvent: HRMSEvent = {
      ...event,
      data: {
        ...data,
        title,
        message,
        type: notificationType,
        actionUrl: data.taskId ? `/projects?taskId=${data.taskId}` : undefined
      },
      priority,
      category: 'task',
      requiresAction: type === HRMSEventType.TASK_SUBMITTED || type === HRMSEventType.TASK_REJECTED
    };

    handleNewNotification(enhancedEvent);
  }, [handleNewNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  }, [notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set up connection monitoring
  useEffect(() => {
    setConnectionState(hrmsRealtimeService.getConnectionState());
    
    const unsubscribeConnection = hrmsRealtimeService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribeConnection;
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const subscriptions = [
      hrmsRealtimeService.subscribe(HRMSEventType.NOTIFICATION_NEW, handleNewNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_ASSIGNED, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_APPROVED, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_REJECTED, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_SUBMITTED, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_COMPLETED, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_OVERDUE, handleTaskNotification),
      hrmsRealtimeService.subscribe(HRMSEventType.TASK_DUE_SOON, handleTaskNotification),
    ];

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [handleNewNotification, handleTaskNotification]);

  // Initialize browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationPermission(Notification.permission);
    }
  }, []);

  // Clean up expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.filter(notif => !notif.expiresAt || notif.expiresAt > now)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    connectionState,
    browserNotificationPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestNotificationPermission,
    isConnected: connectionState === ConnectionState.CONNECTED,
    // Filtered notifications
    unreadNotifications: notifications.filter(n => !n.read),
    urgentNotifications: notifications.filter(n => n.priority === 'urgent'),
    actionRequiredNotifications: notifications.filter(n => n.requiresAction && !n.read)
  };
}
