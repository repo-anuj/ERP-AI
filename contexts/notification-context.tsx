"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  entityId?: string
  entityType?: string
  actionType?: string
  actorName?: string
  metadata?: any
  link?: string
  createdAt: Date
  updatedAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  loading: false,
  markAsRead: async () => {},
  refreshNotifications: async () => {},
  unreadCount: 0,
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // Fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()

      // Check if the response has a notifications property (new API format)
      if (data && data.notifications) {
        setNotifications(data.notifications)
      } else {
        // Fallback to the old format or empty array if neither format is valid
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error("Failed to mark notification as read")

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  // Make sure notifications is an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];

  // Calculate unread count
  const unreadCount = notificationsArray.filter(notification => !notification.read).length;

  // Parse metadata if it exists
  const processedNotifications = notificationsArray.map(notification => {
    if (notification.metadata && typeof notification.metadata === 'string') {
      try {
        return {
          ...notification,
          metadata: JSON.parse(notification.metadata)
        };
      } catch (e) {
        return notification;
      }
    }
    return notification;
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications: processedNotifications,
        loading,
        markAsRead,
        refreshNotifications: fetchNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
