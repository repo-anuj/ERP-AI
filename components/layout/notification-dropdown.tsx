'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const { notifications, loading, markAsRead, unreadCount, refreshNotifications } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Refresh notifications when dropdown is opened
  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open, refreshNotifications]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to the link if provided
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget':
      case 'budget-alert':
        return '💰';
      case 'sale':
        return '🛒';
      case 'transaction':
        return '💸';
      case 'inventory':
        return '📦';
      default:
        return '🔔';
    }
  };

  // Format the time
  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full">
                    <div className="mr-3 text-lg">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm leading-none">{notification.title}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.actorName && (
                        <p className="text-xs text-muted-foreground">
                          By: {notification.actorName}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center cursor-pointer"
          onClick={() => router.push('/dashboard/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
