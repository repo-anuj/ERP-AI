/**
 * WebSocket service for real-time analytics updates
 * This service manages WebSocket connections and provides methods for subscribing to data updates
 */

// Event types for analytics updates
export enum AnalyticsEventType {
  INVENTORY_UPDATE = 'inventory_update',
  SALES_UPDATE = 'sales_update',
  FINANCE_UPDATE = 'finance_update',
  ALERT = 'alert',
  THRESHOLD_REACHED = 'threshold_reached',
  ANOMALY_DETECTED = 'anomaly_detected'
}

// Interface for analytics update events
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
  data: any;
  source: string;
}

// Interface for alert notifications
export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  module: string;
  entityId?: string;
  actionUrl?: string;
}

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// Subscription callback type
type SubscriptionCallback = (event: AnalyticsEvent) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 2000; // Start with 2 seconds
  private subscriptions: Map<AnalyticsEventType, Set<SubscriptionCallback>> = new Map();
  private url: string = '';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize the WebSocket connection
   * @param url WebSocket server URL
   */
  public init(url: string): void {
    this.url = url;
    this.connect();
  }

  /**
   * Get the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Connect to the WebSocket server
   */
  private connect(): void {
    if (!this.url || this.connectionState === ConnectionState.CONNECTING) {
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.connectionState = ConnectionState.ERROR;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.connectionState = ConnectionState.CONNECTED;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as AnalyticsEvent;
      this.notifySubscribers(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.connectionState = ConnectionState.DISCONNECTED;
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.connectionState = ConnectionState.ERROR;
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts);
      console.log(`Scheduling reconnect in ${delay}ms`);

      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
    }
  }

  /**
   * Start the heartbeat to keep the connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.connectionState === ConnectionState.CONNECTED) {
        this.socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Send heartbeat every 30 seconds
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
   * Subscribe to analytics events
   * @param eventType Event type to subscribe to
   * @param callback Callback function to be called when event is received
   */
  public subscribe(eventType: AnalyticsEventType, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const subscribers = this.subscriptions.get(eventType)!;
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Subscribe to all analytics events
   * @param callback Callback function to be called when any event is received
   */
  public subscribeToAll(callback: SubscriptionCallback): () => void {
    const unsubscribers = Object.values(AnalyticsEventType).map(eventType => 
      this.subscribe(eventType as AnalyticsEventType, callback)
    );

    // Return unsubscribe function that unsubscribes from all events
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Notify subscribers of an event
   * @param event Event to notify subscribers about
   */
  private notifySubscribers(event: AnalyticsEvent): void {
    const subscribers = this.subscriptions.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Send a message to the WebSocket server
   * @param message Message to send
   */
  public send(message: any): boolean {
    if (this.socket && this.connectionState === ConnectionState.CONNECTED) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    this.connectionState = ConnectionState.DISCONNECTED;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();
