'use client';

import { useState } from 'react';
import { Bell, Check, CheckCircle, X, Wifi, WifiOff, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { ConnectionState } from '@/lib/hrms-realtime-service';
import { format } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

// Helper function to format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return format(date, 'MMM d, yyyy');
};

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    connectionState,
    browserNotificationPermission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestNotificationPermission,
    isConnected,
    unreadNotifications,
    urgentNotifications,
    actionRequiredNotifications
  } = useRealtimeNotifications({
    enableBrowserNotifications: true,
    enableToastNotifications: true,
    filterByPriority: ['medium', 'high', 'urgent'],
    maxNotifications: 50
  });

  const getConnectionIcon = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return <Wifi className="h-3 w-3 text-green-500" />;
      case ConnectionState.CONNECTING:
        return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />;
      case ConnectionState.ERROR:
        return <WifiOff className="h-3 w-3 text-red-500" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-500" />;
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (type) {
      case 'task':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      setOpen(false);
    }
  };

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            {getConnectionIcon()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getConnectionIcon()}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Browser notification permission */}
        {browserNotificationPermission === 'default' && (
          <>
            <DropdownMenuItem onClick={handleRequestPermission}>
              <Bell className="mr-2 h-4 w-4" />
              Enable browser notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Quick stats */}
        {(urgentNotifications.length > 0 || actionRequiredNotifications.length > 0) && (
          <>
            <DropdownMenuGroup>
              {urgentNotifications.length > 0 && (
                <DropdownMenuItem className="text-red-600">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {urgentNotifications.length} urgent notification{urgentNotifications.length !== 1 ? 's' : ''}
                </DropdownMenuItem>
              )}
              {actionRequiredNotifications.length > 0 && (
                <DropdownMenuItem className="text-orange-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {actionRequiredNotifications.length} action{actionRequiredNotifications.length !== 1 ? 's' : ''} required
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Actions */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuGroup>
              {unreadCount > 0 && (
                <DropdownMenuItem onClick={markAllAsRead}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={clearAllNotifications}>
                <X className="mr-2 h-4 w-4" />
                Clear all notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Notifications list */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(notification.timestamp))}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {notification.requiresAction && (
                            <Badge variant="outline" className="text-xs">
                              Action required
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
