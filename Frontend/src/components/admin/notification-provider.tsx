"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PendingDoctor {
  id: number
  nom: string
  prenom: string
  email: string
  photo: string | null
  grade: string
}

interface NotificationContextType {
  pendingDoctors: PendingDoctor[]
  loading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (doctorId: number) => void
  markAllAsRead: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([])
  const [loading, setLoading] = useState(false)
  const [readNotifications, setReadNotifications] = useState<number[]>([])

  // Load read notifications from localStorage on mount
  useEffect(() => {
    const storedReadNotifications = localStorage.getItem("readNotifications")
    if (storedReadNotifications) {
      try {
        const parsedReadNotifications = JSON.parse(storedReadNotifications)
        if (Array.isArray(parsedReadNotifications)) {
          setReadNotifications(parsedReadNotifications)
        }
      } catch (error) {
        console.error("Error parsing read notifications:", error)
      }
    }
  }, [])

  // Save read notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("readNotifications", JSON.stringify(readNotifications))
  }, [readNotifications])

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/auth/admin/pending-doctors")
      if (response.ok) {
        const data = await response.json()
        setPendingDoctors(data)
      }
    } catch (error) {
      console.error("Failed to fetch pending doctors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchPendingDoctors()

    // Set up polling every 5 minutes
    const intervalId = setInterval(fetchPendingDoctors, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Calculate unread notifications count
  const unreadCount = pendingDoctors.filter((doctor) => !readNotifications.includes(doctor.id)).length

  const markAsRead = (doctorId: number) => {
    // Add the doctor ID to the read notifications list if not already there
    if (!readNotifications.includes(doctorId)) {
      setReadNotifications((prev) => [...prev, doctorId])
    }
  }

  const markAllAsRead = () => {
    // Mark all current notifications as read
    const allIds = pendingDoctors.map((doctor) => doctor.id)
    const newReadNotifications = [...new Set([...readNotifications, ...allIds])]
    setReadNotifications(newReadNotifications)
  }

  return (
    <NotificationContext.Provider
      value={{
        pendingDoctors,
        loading,
        refreshNotifications: fetchPendingDoctors,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
