'use client';

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, PushNotificationData } from '@/lib/push-notification-service';
import { useToast } from '@/components/ui/use-toast';

interface UsePushNotificationsOptions {
  autoSubscribe?: boolean;
  showToastOnError?: boolean;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { autoSubscribe = false, showToastOnError = true } = options;

  // Update state from service
  const updateState = useCallback(() => {
    const status = pushNotificationService.getSubscriptionStatus();
    setIsSupported(status.isSupported);
    setIsSubscribed(status.isSubscribed);
    setPermission(status.permission);
    setSubscription(status.subscription);
  }, []);

  // Initialize
  useEffect(() => {
    updateState();

    // Auto-subscribe if enabled and permission is granted
    if (autoSubscribe && permission === 'granted' && !isSubscribed) {
      subscribe();
    }
  }, [autoSubscribe, permission, isSubscribed]);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications for important updates.',
          duration: 5000,
        });
      } else if (newPermission === 'denied') {
        const errorMsg = 'Notification permission denied. You can enable it in your browser settings.';
        setError(errorMsg);
        if (showToastOnError) {
          toast({
            title: 'Permission Denied',
            description: errorMsg,
            variant: 'destructive',
            duration: 7000,
          });
        }
      }

      return newPermission;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Permission Error',
          description: errorMsg,
          variant: 'destructive',
          duration: 5000,
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, showToastOnError]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const newSubscription = await pushNotificationService.subscribe();
      setSubscription(newSubscription);
      setIsSubscribed(!!newSubscription);

      if (newSubscription) {
        toast({
          title: 'Push Notifications Enabled',
          description: 'You will receive real-time notifications for tasks and approvals.',
          duration: 5000,
        });
      }

      return newSubscription;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to subscribe to notifications';
      setError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Subscription Failed',
          description: errorMsg,
          variant: 'destructive',
          duration: 5000,
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, showToastOnError]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setSubscription(null);
        setIsSubscribed(false);
        toast({
          title: 'Push Notifications Disabled',
          description: 'You will no longer receive push notifications.',
          duration: 3000,
        });
      }

      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unsubscribe from notifications';
      setError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Unsubscribe Failed',
          description: errorMsg,
          variant: 'destructive',
          duration: 5000,
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, showToastOnError]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Send local test notification
      await pushNotificationService.sendTestNotification();

      // Also send server-side test notification
      const response = await fetch('/api/push/send', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send test notification');
      }

      toast({
        title: 'Test Notification Sent',
        description: 'Check if you received the test notification.',
        duration: 3000,
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Test Failed',
          description: errorMsg,
          variant: 'destructive',
          duration: 5000,
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [permission, toast, showToastOnError]);

  // Show local notification
  const showLocalNotification = useCallback(async (data: PushNotificationData) => {
    try {
      await pushNotificationService.showLocalNotification(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to show notification';
      setError(errorMsg);
      if (showToastOnError) {
        toast({
          title: 'Notification Error',
          description: errorMsg,
          variant: 'destructive',
          duration: 3000,
        });
      }
      throw err;
    }
  }, [toast, showToastOnError]);

  // Get subscription info
  const getSubscriptionInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/push/subscribe');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription info');
      }
      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get subscription info';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isSupported,
    isSubscribed,
    permission,
    subscription,
    loading,
    error,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    showLocalNotification,
    getSubscriptionInfo,
    clearError,

    // Computed values
    canSubscribe: isSupported && permission === 'granted' && !isSubscribed,
    canUnsubscribe: isSupported && isSubscribed,
    needsPermission: isSupported && permission === 'default',
    permissionDenied: permission === 'denied',

    // Utility functions
    updateState
  };
}
