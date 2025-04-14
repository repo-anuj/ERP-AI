'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/contexts/notification-context';
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle, RefreshCw, Eye } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, refreshNotifications, unreadCount } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleViewDetails = (notification: any) => {
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true;
  });

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
      return format(new Date(date), 'PPpp');
    } catch (error) {
      return '';
    }
  };

  // Format the relative time
  const formatRelativeTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                View all notifications related to your ERP system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No notifications found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={!notification.read ? 'bg-muted/50' : ''}
                      >
                        <TableCell>
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        </TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell>
                          <div className="max-w-md truncate">{notification.message}</div>
                          {notification.actorName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              By: {notification.actorName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatRelativeTime(notification.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Read
                              </Button>
                            )}
                            {notification.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(notification)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>
                View your unread notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No unread notifications
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow key={notification.id} className="bg-muted/50">
                        <TableCell>
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        </TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell>
                          <div className="max-w-md truncate">{notification.message}</div>
                          {notification.actorName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              By: {notification.actorName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatRelativeTime(notification.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Read
                            </Button>
                            {notification.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(notification)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
