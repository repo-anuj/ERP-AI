'use client';

import { useState } from 'react';
import { Bell, BellOff, Activity, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useConnectionStatus } from '@/components/realtime/connection-status';

interface PushNotificationSettingsProps {
  className?: string;
}

export function PushNotificationSettings({ className }: PushNotificationSettingsProps) {
  const [testLoading, setTestLoading] = useState(false);
  
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    canSubscribe,
    canUnsubscribe,
    needsPermission,
    permissionDenied,
    clearError
  } = usePushNotifications();

  const { isConnected, connectionQuality } = useConnectionStatus();

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else if (canSubscribe) {
        await subscribe();
      } else if (needsPermission) {
        await requestPermission();
        // After permission is granted, subscribe will be called automatically
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestLoading(true);
      await sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Granted' };
      case 'denied':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Denied' };
      default:
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Not Set' };
    }
  };

  const getConnectionStatus = () => {
    if (!isConnected) {
      return { color: 'text-red-600', bg: 'bg-red-100', text: 'Offline' };
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Excellent' };
      case 'good':
        return { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Good' };
      case 'poor':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Poor' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  const permissionStatus = getPermissionStatus();
  const connectionStatus = getConnectionStatus();

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Real-time notifications for tasks and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive real-time notifications for tasks, approvals, and important updates
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Permission</p>
              <p className="text-xs text-muted-foreground">Browser permission status</p>
            </div>
            <Badge className={`${permissionStatus.bg} ${permissionStatus.color}`}>
              {permissionStatus.text}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Subscription</p>
              <p className="text-xs text-muted-foreground">Push notification status</p>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Connection</p>
              <p className="text-xs text-muted-foreground">Real-time connection</p>
            </div>
            <Badge className={`${connectionStatus.bg} ${connectionStatus.color}`}>
              <Wifi className="h-3 w-3 mr-1" />
              {connectionStatus.text}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Enable Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified about task assignments, approvals, and important updates
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={loading || (!canSubscribe && !canUnsubscribe)}
          />
        </div>

        {/* Permission Request */}
        {needsPermission && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Browser permission is required to enable push notifications.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestPermission}
                  disabled={loading}
                >
                  Grant Permission
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Denied */}
        {permissionDenied && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are blocked. To enable them, click the notification icon in your browser's address bar or check your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Test Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test notification to verify everything is working
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={testLoading || !isConnected}
              >
                <Activity className="h-4 w-4 mr-2" />
                {testLoading ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </>
        )}

        {/* Connection Warning */}
        {!isConnected && (
          <Alert variant="destructive">
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Real-time connection is offline. Push notifications may not work properly until connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {isSubscribed && isConnected && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are active! You'll receive real-time updates for tasks, approvals, and important events.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
