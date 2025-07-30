'use client';

// Push Notification Service for ERP System
export interface PushNotificationData {
  title: string;
  message: string;
  type: 'task' | 'approval' | 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  taskId?: string;
  projectId?: string;
  requiresAction?: boolean;
  expiresAt?: string;
  icon?: string;
  badge?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  private constructor() {
    this.initializeServiceWorker();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.registration);

        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.notifyServiceWorkerUpdate();
              }
            });
          }
        });

        // Check for existing subscription
        await this.checkExistingSubscription();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Service Workers are not supported in this browser');
    }
  }

  /**
   * Check for existing push subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    if (this.registration) {
      try {
        this.subscription = await this.registration.pushManager.getSubscription();
        if (this.subscription) {
          console.log('Existing push subscription found');
          // Optionally sync with server
          await this.syncSubscriptionWithServer();
        }
      } catch (error) {
        console.error('Error checking existing subscription:', error);
      }
    }
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<PushSubscription | null> {
    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      // Convert VAPID key
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const successful = await this.subscription.unsubscribe();
        if (successful) {
          this.subscription = null;
          // Remove subscription from server
          await this.removeSubscriptionFromServer();
        }
        return successful;
      }
      return true;
    } catch (error) {
      console.error('Push unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Get current subscription status
   */
  public getSubscriptionStatus(): {
    isSupported: boolean;
    isSubscribed: boolean;
    permission: NotificationPermission;
    subscription: PushSubscription | null;
  } {
    return {
      isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      isSubscribed: !!this.subscription,
      permission: 'Notification' in window ? Notification.permission : 'denied',
      subscription: this.subscription
    };
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(): Promise<void> {
    const permission = await this.requestPermission();
    if (permission === 'granted') {
      new Notification('ERP Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription to server: ${response.status}`);
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove subscription from server: ${response.status}`);
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Sync subscription with server
   */
  private async syncSubscriptionWithServer(): Promise<void> {
    if (this.subscription) {
      try {
        await this.sendSubscriptionToServer(this.subscription);
      } catch (error) {
        console.error('Error syncing subscription with server:', error);
      }
    }
  }

  /**
   * Notify about service worker update
   */
  private notifyServiceWorkerUpdate(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ERP Update Available', {
        body: 'A new version of the app is available. Refresh to update.',
        icon: '/favicon.ico',
        tag: 'app-update',
        requireInteraction: true,
        // Note: actions are not supported in standard Notification API
        // They would be supported in Service Worker notifications
      });
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Show local notification (fallback)
   */
  public async showLocalNotification(data: PushNotificationData): Promise<void> {
    const permission = await this.requestPermission();
    if (permission === 'granted') {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: `${data.type}-${Date.now()}`,
        requireInteraction: data.requiresAction || data.priority === 'urgent',
        data: {
          url: data.actionUrl,
          taskId: data.taskId,
          projectId: data.projectId,
          type: data.type,
          priority: data.priority
        }
      });

      notification.onclick = () => {
        if (data.actionUrl) {
          window.focus();
          window.location.href = data.actionUrl;
        }
        notification.close();
      };

      // Auto-close based on priority
      const autoCloseDelay = data.priority === 'urgent' ? 10000 : 
                           data.priority === 'high' ? 7000 : 5000;
      
      setTimeout(() => {
        notification.close();
      }, autoCloseDelay);
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();
