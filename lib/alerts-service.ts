/**
 * Alerts and notifications service for analytics
 * This service manages alerts, thresholds, and notifications for analytics data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { websocketService, AnalyticsEventType, AlertNotification } from './websocket-service';

// Alert threshold types
export enum ThresholdType {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUAL_TO = 'equal_to',
  NOT_EQUAL_TO = 'not_equal_to',
  PERCENTAGE_CHANGE = 'percentage_change'
}

// Alert threshold definition
export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  module: string;
  metric: string;
  type: ThresholdType;
  value: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alert notification store interface
interface AlertsState {
  notifications: AlertNotification[];
  thresholds: AlertThreshold[];
  addNotification: (notification: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addThreshold: (threshold: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateThreshold: (id: string, updates: Partial<AlertThreshold>) => void;
  removeThreshold: (id: string) => void;
  getUnreadCount: () => number;
}

// Create alerts store with persistence
export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      thresholds: [],
      
      // Add a new notification
      addNotification: (notification) => set((state) => {
        const newNotification: AlertNotification = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        };
        
        return {
          notifications: [newNotification, ...state.notifications.slice(0, 99)] // Keep only the last 100 notifications
        };
      }),
      
      // Mark a notification as read
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((notification) => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      })),
      
      // Mark all notifications as read
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((notification) => ({ ...notification, read: true }))
      })),
      
      // Remove a notification
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((notification) => notification.id !== id)
      })),
      
      // Clear all notifications
      clearAllNotifications: () => set({ notifications: [] }),
      
      // Add a new threshold
      addThreshold: (threshold) => set((state) => {
        const newThreshold: AlertThreshold = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...threshold
        };
        
        return {
          thresholds: [...state.thresholds, newThreshold]
        };
      }),
      
      // Update a threshold
      updateThreshold: (id, updates) => set((state) => ({
        thresholds: state.thresholds.map((threshold) => 
          threshold.id === id 
            ? { 
                ...threshold, 
                ...updates, 
                updatedAt: new Date().toISOString() 
              } 
            : threshold
        )
      })),
      
      // Remove a threshold
      removeThreshold: (id) => set((state) => ({
        thresholds: state.thresholds.filter((threshold) => threshold.id !== id)
      })),
      
      // Get unread notification count
      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      }
    }),
    {
      name: 'analytics-alerts-storage',
      partialize: (state) => ({ 
        notifications: state.notifications,
        thresholds: state.thresholds
      })
    }
  )
);

// Alert service class
class AlertsService {
  private static instance: AlertsService;
  private isInitialized: boolean = false;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): AlertsService {
    if (!AlertsService.instance) {
      AlertsService.instance = new AlertsService();
    }
    return AlertsService.instance;
  }
  
  /**
   * Initialize the alerts service
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }
    
    // Subscribe to alert events from WebSocket
    websocketService.subscribe(AnalyticsEventType.ALERT, this.handleAlertEvent.bind(this));
    websocketService.subscribe(AnalyticsEventType.THRESHOLD_REACHED, this.handleThresholdEvent.bind(this));
    websocketService.subscribe(AnalyticsEventType.ANOMALY_DETECTED, this.handleAnomalyEvent.bind(this));
    
    this.isInitialized = true;
  }
  
  /**
   * Handle alert events from WebSocket
   */
  private handleAlertEvent(event: any): void {
    const { data } = event;
    
    useAlertsStore.getState().addNotification({
      title: data.title || 'New Alert',
      message: data.message || 'You have a new alert',
      type: data.severity || 'info',
      module: data.module || 'system',
      entityId: data.entityId,
      actionUrl: data.actionUrl
    });
  }
  
  /**
   * Handle threshold events from WebSocket
   */
  private handleThresholdEvent(event: any): void {
    const { data } = event;
    const threshold = data.threshold;
    
    useAlertsStore.getState().addNotification({
      title: `Threshold Alert: ${threshold.name}`,
      message: `The metric "${threshold.metric}" has ${this.getThresholdDescription(threshold)}`,
      type: 'warning',
      module: threshold.module,
      entityId: data.entityId,
      actionUrl: data.actionUrl
    });
  }
  
  /**
   * Handle anomaly events from WebSocket
   */
  private handleAnomalyEvent(event: any): void {
    const { data } = event;
    
    useAlertsStore.getState().addNotification({
      title: `Anomaly Detected: ${data.metric}`,
      message: `Unusual activity detected in ${data.module}: ${data.description}`,
      type: 'error',
      module: data.module,
      entityId: data.entityId,
      actionUrl: data.actionUrl
    });
  }
  
  /**
   * Get a human-readable description of a threshold
   */
  private getThresholdDescription(threshold: AlertThreshold): string {
    switch (threshold.type) {
      case ThresholdType.GREATER_THAN:
        return `exceeded the threshold of ${threshold.value}`;
      case ThresholdType.LESS_THAN:
        return `fallen below the threshold of ${threshold.value}`;
      case ThresholdType.EQUAL_TO:
        return `reached exactly ${threshold.value}`;
      case ThresholdType.NOT_EQUAL_TO:
        return `changed from the expected value of ${threshold.value}`;
      case ThresholdType.PERCENTAGE_CHANGE:
        return `changed by ${threshold.value}%`;
      default:
        return `triggered an alert (${threshold.value})`;
    }
  }
  
  /**
   * Check if a value triggers a threshold alert
   */
  public checkThreshold(module: string, metric: string, value: number): boolean {
    const thresholds = useAlertsStore.getState().thresholds.filter(
      t => t.enabled && t.module === module && t.metric === metric
    );
    
    for (const threshold of thresholds) {
      if (this.isThresholdTriggered(threshold, value)) {
        this.triggerThresholdAlert(threshold, value);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a threshold is triggered by a value
   */
  private isThresholdTriggered(threshold: AlertThreshold, value: number): boolean {
    switch (threshold.type) {
      case ThresholdType.GREATER_THAN:
        return value > threshold.value;
      case ThresholdType.LESS_THAN:
        return value < threshold.value;
      case ThresholdType.EQUAL_TO:
        return value === threshold.value;
      case ThresholdType.NOT_EQUAL_TO:
        return value !== threshold.value;
      case ThresholdType.PERCENTAGE_CHANGE:
        // This would require historical data to calculate percentage change
        return false;
      default:
        return false;
    }
  }
  
  /**
   * Trigger a threshold alert
   */
  private triggerThresholdAlert(threshold: AlertThreshold, value: number): void {
    useAlertsStore.getState().addNotification({
      title: `Threshold Alert: ${threshold.name}`,
      message: `The metric "${threshold.metric}" is now ${value} (${this.getThresholdDescription(threshold)})`,
      type: 'warning',
      module: threshold.module
    });
  }
  
  /**
   * Create a custom alert
   */
  public createAlert(
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    module: string = 'system',
    entityId?: string,
    actionUrl?: string
  ): void {
    useAlertsStore.getState().addNotification({
      title,
      message,
      type,
      module,
      entityId,
      actionUrl
    });
  }
}

// Export singleton instance
export const alertsService = AlertsService.getInstance();
