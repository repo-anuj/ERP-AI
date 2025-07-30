/**
 * HRMS Real-time Service for task management, chat, and notifications
 * This service manages real-time updates for the HRMS system
 */

// HRMS-specific event types
export enum HRMSEventType {
  // Task Events
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_SUBMITTED = 'task_submitted',
  TASK_APPROVED = 'task_approved',
  TASK_REJECTED = 'task_rejected',
  TASK_PROGRESS_UPDATED = 'task_progress_updated',
  TASK_DELETED = 'task_deleted',
  TASK_OVERDUE = 'task_overdue',
  TASK_DUE_SOON = 'task_due_soon',

  // Project Events
  PROJECT_UPDATED = 'project_updated',
  PROJECT_CREATED = 'project_created',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
  PROJECT_STATUS_CHANGED = 'project_status_changed',
  PROJECT_DEADLINE_APPROACHING = 'project_deadline_approaching',

  // Chat Events
  CHAT_MESSAGE = 'chat_message',
  CHAT_APPROVAL_REQUEST = 'chat_approval_request',
  CHAT_APPROVAL_RESPONSE = 'chat_approval_response',
  CHAT_TYPING = 'chat_typing',
  CHAT_USER_JOINED = 'chat_user_joined',
  CHAT_USER_LEFT = 'chat_user_left',

  // Attendance Events
  ATTENDANCE_CHECKIN = 'attendance_checkin',
  ATTENDANCE_CHECKOUT = 'attendance_checkout',
  ATTENDANCE_BREAK_START = 'attendance_break_start',
  ATTENDANCE_BREAK_END = 'attendance_break_end',
  ATTENDANCE_OVERTIME = 'attendance_overtime',

  // Notification Events
  NOTIFICATION_NEW = 'notification_new',
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_DISMISSED = 'notification_dismissed',
  NOTIFICATION_ACTION_TAKEN = 'notification_action_taken',

  // Employee Events
  EMPLOYEE_STATUS_CHANGED = 'employee_status_changed',
  EMPLOYEE_WORKLOAD_UPDATED = 'employee_workload_updated',
  EMPLOYEE_PERFORMANCE_UPDATED = 'employee_performance_updated',

  // Manager Events
  MANAGER_APPROVAL_REQUIRED = 'manager_approval_required',
  MANAGER_TEAM_UPDATE = 'manager_team_update',
  MANAGER_REPORT_READY = 'manager_report_ready',

  // System Events
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  CONNECTION_STATUS = 'connection_status'
}

// Interface for HRMS events
export interface HRMSEvent {
  type: HRMSEventType;
  timestamp: string;
  data: any;
  userId?: string;
  projectId?: string;
  taskId?: string;
  companyId: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'task' | 'project' | 'chat' | 'attendance' | 'notification' | 'system';
  requiresAction?: boolean;
  expiresAt?: string;
}

// Interface for notifications
export interface HRMSNotification {
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
}

// Connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// Subscription callback type
type HRMSSubscriptionCallback = (event: HRMSEvent) => void;

class HRMSRealtimeService {
  private static instance: HRMSRealtimeService;
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeout: number = 1000;
  private subscriptions: Map<HRMSEventType, Set<HRMSSubscriptionCallback>> = new Map();
  private url: string = '';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private companyId: string | null = null;
  private connectionListeners: Set<(state: ConnectionState) => void> = new Set();
  private messageQueue: HRMSEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private lastHeartbeat: number = 0;
  private connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'offline';

  private constructor() {
    // Private constructor for singleton pattern
    this.setupNetworkListeners();
  }

  public static getInstance(): HRMSRealtimeService {
    if (!HRMSRealtimeService.instance) {
      HRMSRealtimeService.instance = new HRMSRealtimeService();
    }
    return HRMSRealtimeService.instance;
  }

  /**
   * Initialize the WebSocket connection with user context
   */
  public init(url: string, userId: string, companyId: string): void {
    this.url = url;
    this.userId = userId;
    this.companyId = companyId;
    this.connect();
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('Network came online, attempting to reconnect...');
        if (this.connectionState === ConnectionState.DISCONNECTED) {
          this.connect();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.connectionQuality = 'offline';
        console.log('Network went offline');
        this.notifyConnectionListeners(ConnectionState.DISCONNECTED);
      });
    }
  }

  /**
   * Get the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get connection quality
   */
  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    return this.connectionQuality;
  }

  /**
   * Subscribe to connection state changes
   */
  public onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Notify connection listeners
   */
  private notifyConnectionListeners(state: ConnectionState): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Connect to the WebSocket server
   */
  private connect(): void {
    if (!this.url || this.connectionState === ConnectionState.CONNECTING || !this.isOnline) {
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.notifyConnectionListeners(ConnectionState.CONNECTING);

    try {
      // Add user context and connection metadata to WebSocket URL
      const wsUrl = `${this.url}?userId=${this.userId}&companyId=${this.companyId}&reconnect=${this.reconnectAttempts}`;
      this.socket = new WebSocket(wsUrl);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.connectionState === ConnectionState.CONNECTING) {
          console.warn('WebSocket connection timeout');
          this.socket.close();
        }
      }, 10000);

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.handleOpen();
      };
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('HRMS WebSocket connection error:', error);
      this.connectionState = ConnectionState.ERROR;
      this.notifyConnectionListeners(ConnectionState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('HRMS WebSocket connection established');
    this.connectionState = ConnectionState.CONNECTED;
    this.connectionQuality = 'excellent';
    this.reconnectAttempts = 0;
    this.lastHeartbeat = Date.now();
    this.notifyConnectionListeners(ConnectionState.CONNECTED);
    this.startHeartbeat();

    // Send user online status
    this.sendEvent({
      type: HRMSEventType.USER_ONLINE,
      timestamp: new Date().toISOString(),
      data: {
        userId: this.userId,
        connectionQuality: this.connectionQuality,
        userAgent: navigator.userAgent
      },
      companyId: this.companyId!,
      category: 'system'
    });

    // Process queued messages
    this.processMessageQueue();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as HRMSEvent;

      // Handle heartbeat responses
      if (data.type === HRMSEventType.CONNECTION_STATUS) {
        this.lastHeartbeat = Date.now();
        this.updateConnectionQuality(data.data?.latency || 0);
        return;
      }

      // Update connection quality based on message frequency
      this.lastHeartbeat = Date.now();

      this.notifySubscribers(data);
    } catch (error) {
      console.error('Error parsing HRMS WebSocket message:', error);
    }
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(latency: number): void {
    if (latency < 100) {
      this.connectionQuality = 'excellent';
    } else if (latency < 300) {
      this.connectionQuality = 'good';
    } else {
      this.connectionQuality = 'poor';
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`HRMS WebSocket connection closed: ${event.code} ${event.reason}`);
    this.connectionState = ConnectionState.DISCONNECTED;
    this.connectionQuality = 'offline';
    this.notifyConnectionListeners(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();

    // Only attempt reconnect if it wasn't a deliberate close
    if (event.code !== 1000 && this.isOnline) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('HRMS WebSocket error:', event);
    this.connectionState = ConnectionState.ERROR;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isOnline) {
      // Exponential backoff with jitter
      const baseDelay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds

      console.log(`Scheduling HRMS reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting HRMS reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum HRMS reconnect attempts (${this.maxReconnectAttempts}) reached`);
      this.connectionState = ConnectionState.ERROR;
      this.notifyConnectionListeners(ConnectionState.ERROR);
    }
  }

  /**
   * Start the heartbeat to keep the connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.connectionState === ConnectionState.CONNECTED) {
        const heartbeatTime = Date.now();
        this.socket.send(JSON.stringify({
          type: 'heartbeat',
          userId: this.userId,
          timestamp: heartbeatTime
        }));

        // Check if we haven't received a heartbeat response in too long
        if (heartbeatTime - this.lastHeartbeat > 60000) {
          console.warn('Heartbeat timeout detected, connection may be stale');
          this.connectionQuality = 'poor';
        }
      }
    }, 30000);
  }

  /**
   * Stop the heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to HRMS events
   */
  public subscribe(eventType: HRMSEventType, callback: HRMSSubscriptionCallback): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const subscribers = this.subscriptions.get(eventType)!;
    subscribers.add(callback);

    return () => {
      const subscribers = this.subscriptions.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Notify subscribers of an event
   */
  private notifySubscribers(event: HRMSEvent): void {
    const subscribers = this.subscriptions.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in HRMS subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);
      const messages = [...this.messageQueue];
      this.messageQueue = [];

      messages.forEach(message => {
        this.sendEvent(message);
      });
    }
  }

  /**
   * Send an event to the WebSocket server
   */
  public sendEvent(event: HRMSEvent): boolean {
    // Add default metadata if not provided
    const enrichedEvent: HRMSEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      userId: event.userId || this.userId || undefined,
      companyId: event.companyId || this.companyId!,
      priority: event.priority || 'medium',
      category: event.category || this.getCategoryFromEventType(event.type) as any
    };

    if (this.socket && this.connectionState === ConnectionState.CONNECTED) {
      try {
        this.socket.send(JSON.stringify(enrichedEvent));
        return true;
      } catch (error) {
        console.error('Error sending HRMS WebSocket event:', error);
        this.queueMessage(enrichedEvent);
        return false;
      }
    } else {
      // Queue message for later if connection is down
      this.queueMessage(enrichedEvent);
      return false;
    }
  }

  /**
   * Queue a message for later sending
   */
  private queueMessage(event: HRMSEvent): void {
    // Only queue important messages and limit queue size
    if (event.priority === 'high' || event.priority === 'urgent' || event.requiresAction) {
      if (this.messageQueue.length < 100) { // Limit queue size
        this.messageQueue.push(event);
        console.log(`Queued message: ${event.type} (queue size: ${this.messageQueue.length})`);
      } else {
        console.warn('Message queue full, dropping message:', event.type);
      }
    }
  }

  /**
   * Get category from event type
   */
  private getCategoryFromEventType(type: HRMSEventType): string {
    if (type.startsWith('TASK_')) return 'task';
    if (type.startsWith('PROJECT_')) return 'project';
    if (type.startsWith('CHAT_')) return 'chat';
    if (type.startsWith('ATTENDANCE_')) return 'attendance';
    if (type.startsWith('NOTIFICATION_')) return 'notification';
    if (type.startsWith('EMPLOYEE_') || type.startsWith('MANAGER_')) return 'employee';
    return 'system';
  }

  /**
   * Send a chat message
   */
  public sendChatMessage(projectId: string, content: string, taskId?: string): boolean {
    return this.sendEvent({
      type: HRMSEventType.CHAT_MESSAGE,
      timestamp: new Date().toISOString(),
      data: { content, taskId },
      userId: this.userId || undefined,
      projectId,
      companyId: this.companyId!
    });
  }

  /**
   * Send task update notification
   */
  public sendTaskUpdate(taskId: string, projectId: string, updateType: string, data: any): boolean {
    return this.sendEvent({
      type: HRMSEventType.TASK_UPDATED,
      timestamp: new Date().toISOString(),
      data: { updateType, ...data },
      userId: this.userId || undefined,
      projectId,
      taskId,
      companyId: this.companyId!,
      priority: 'high',
      category: 'task',
      requiresAction: updateType === 'status_change' || updateType === 'assignment_change'
    });
  }

  /**
   * Send task assignment notification
   */
  public sendTaskAssignment(taskId: string, projectId: string, assigneeId: string, assigneeName: string, taskName: string): boolean {
    return this.sendEvent({
      type: HRMSEventType.TASK_ASSIGNED,
      timestamp: new Date().toISOString(),
      data: {
        assigneeId,
        assigneeName,
        taskName,
        assignedBy: this.userId
      },
      userId: assigneeId, // Send to the assignee
      projectId,
      taskId,
      companyId: this.companyId!,
      priority: 'high',
      category: 'task',
      requiresAction: true
    });
  }

  /**
   * Send task completion notification
   */
  public sendTaskCompletion(taskId: string, projectId: string, taskName: string, managerId?: string): boolean {
    return this.sendEvent({
      type: HRMSEventType.TASK_COMPLETED,
      timestamp: new Date().toISOString(),
      data: {
        taskName,
        completedBy: this.userId,
        completedAt: new Date().toISOString()
      },
      userId: managerId || this.userId || undefined,
      projectId,
      taskId,
      companyId: this.companyId!,
      priority: 'medium',
      category: 'task'
    });
  }

  /**
   * Send task approval request
   */
  public sendTaskApprovalRequest(taskId: string, projectId: string, taskName: string, managerId: string): boolean {
    return this.sendEvent({
      type: HRMSEventType.TASK_SUBMITTED,
      timestamp: new Date().toISOString(),
      data: {
        taskName,
        submittedBy: this.userId,
        submittedAt: new Date().toISOString(),
        requiresApproval: true
      },
      userId: managerId,
      projectId,
      taskId,
      companyId: this.companyId!,
      priority: 'urgent',
      category: 'task',
      requiresAction: true
    });
  }

  /**
   * Send task approval response
   */
  public sendTaskApprovalResponse(taskId: string, projectId: string, taskName: string, assigneeId: string, approved: boolean, comments?: string): boolean {
    return this.sendEvent({
      type: approved ? HRMSEventType.TASK_APPROVED : HRMSEventType.TASK_REJECTED,
      timestamp: new Date().toISOString(),
      data: {
        taskName,
        approved,
        comments,
        reviewedBy: this.userId,
        reviewedAt: new Date().toISOString()
      },
      userId: assigneeId,
      projectId,
      taskId,
      companyId: this.companyId!,
      priority: 'high',
      category: 'task',
      requiresAction: !approved // If rejected, employee needs to take action
    });
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    state: ConnectionState;
    quality: string;
    reconnectAttempts: number;
    queuedMessages: number;
    lastHeartbeat: number;
    isOnline: boolean;
  } {
    return {
      state: this.connectionState,
      quality: this.connectionQuality,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      lastHeartbeat: this.lastHeartbeat,
      isOnline: this.isOnline
    };
  }

  /**
   * Force reconnection
   */
  public forceReconnect(): void {
    console.log('Forcing reconnection...');
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    // Send user offline status before disconnecting
    if (this.socket && this.connectionState === ConnectionState.CONNECTED) {
      this.sendEvent({
        type: HRMSEventType.USER_OFFLINE,
        timestamp: new Date().toISOString(),
        data: {
          userId: this.userId,
          disconnectedAt: new Date().toISOString(),
          reason: 'manual_disconnect'
        },
        companyId: this.companyId!,
        category: 'system'
      });
    }

    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect'); // Normal closure
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    this.connectionState = ConnectionState.DISCONNECTED;
    this.connectionQuality = 'offline';
    this.notifyConnectionListeners(ConnectionState.DISCONNECTED);

    // Clear message queue on manual disconnect
    this.messageQueue = [];
  }
}

// Export singleton instance
export const hrmsRealtimeService = HRMSRealtimeService.getInstance();
