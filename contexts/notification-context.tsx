"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  loading: boolean
  markAsRead: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  loading: false,
  markAsRead: async () => {},
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
      setNotifications(data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        markAsRead,
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
