'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { hrmsRealtimeService, ConnectionState } from '@/lib/hrms-realtime-service';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({ className, showDetails = false }: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    // Initial state
    setConnectionState(hrmsRealtimeService.getConnectionState());
    setConnectionQuality(hrmsRealtimeService.getConnectionQuality());
    setStats(hrmsRealtimeService.getConnectionStats());

    // Subscribe to connection changes
    const unsubscribe = hrmsRealtimeService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setConnectionQuality(hrmsRealtimeService.getConnectionQuality());
      setStats(hrmsRealtimeService.getConnectionStats());
    });

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(hrmsRealtimeService.getConnectionStats());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusInfo = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return {
          icon: <Wifi className="h-4 w-4" />,
          color: connectionQuality === 'excellent' ? 'text-green-500' : 
                 connectionQuality === 'good' ? 'text-blue-500' : 'text-yellow-500',
          bgColor: connectionQuality === 'excellent' ? 'bg-green-100' : 
                   connectionQuality === 'good' ? 'bg-blue-100' : 'bg-yellow-100',
          text: 'Connected',
          description: `Real-time updates active (${connectionQuality} connection)`
        };
      case ConnectionState.CONNECTING:
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'Connecting',
          description: 'Establishing connection...'
        };
      case ConnectionState.ERROR:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'Error',
          description: 'Connection failed. Some features may not work.'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: 'Offline',
          description: 'Real-time updates unavailable'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleReconnect = () => {
    hrmsRealtimeService.forceReconnect();
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              <div className={statusInfo.color}>
                {statusInfo.icon}
              </div>
              {connectionState === ConnectionState.ERROR && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleReconnect}
                >
                  Retry
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{statusInfo.text}</p>
              <p className="text-sm">{statusInfo.description}</p>
              {stats.reconnectAttempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  Reconnect attempts: {stats.reconnectAttempts}
                </p>
              )}
              {stats.queuedMessages > 0 && (
                <p className="text-xs text-muted-foreground">
                  Queued messages: {stats.queuedMessages}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${statusInfo.bgColor} ${className}`}>
      <div className={statusInfo.color}>
        {statusInfo.icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{statusInfo.text}</span>
          <Badge variant="outline" className="text-xs">
            {connectionQuality}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {statusInfo.description}
        </p>
      </div>

      {connectionState === ConnectionState.ERROR && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReconnect}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}

      {/* Connection stats */}
      {(stats.reconnectAttempts > 0 || stats.queuedMessages > 0) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {stats.reconnectAttempts > 0 && (
            <div>Attempts: {stats.reconnectAttempts}</div>
          )}
          {stats.queuedMessages > 0 && (
            <div>Queued: {stats.queuedMessages}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for connection status
export function useConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');

  useEffect(() => {
    setConnectionState(hrmsRealtimeService.getConnectionState());
    setConnectionQuality(hrmsRealtimeService.getConnectionQuality());

    const unsubscribe = hrmsRealtimeService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setConnectionQuality(hrmsRealtimeService.getConnectionQuality());
    });

    return unsubscribe;
  }, []);

  return {
    connectionState,
    connectionQuality,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    hasError: connectionState === ConnectionState.ERROR,
    stats: hrmsRealtimeService.getConnectionStats(),
    forceReconnect: hrmsRealtimeService.forceReconnect.bind(hrmsRealtimeService)
  };
}
