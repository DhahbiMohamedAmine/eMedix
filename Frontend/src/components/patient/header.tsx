"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { LogOut, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { NotificationBadge } from "@/components/notification-badge"

interface UserData {
  photo?: string
  prenom: string
  nom: string
}

interface Notification {
  appointmentId: number
  type: "approved" | "modified"
  read: boolean
  dismissed: boolean
  timestamp: number
}

export default function HeaderComponent() {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentPathRef = useRef<string>("")

  // Function to check for new notifications by comparing appointment statuses
  const checkForNewNotifications = async () => {
    try {
      // Only check if we have patient data
      const patientData = localStorage.getItem("patientData")
      if (!patientData) return

      const { patient_id } = JSON.parse(patientData)
      if (!patient_id) return

      // Get current appointments
      const response = await fetch(`http://localhost:8000/appointments/patient/${patient_id}`)
      if (!response.ok) return

      const appointments = await response.json()

      // Get last known statuses
      const lastStatusesJson = localStorage.getItem("lastAppointmentStatuses")
      const lastStatuses = lastStatusesJson ? JSON.parse(lastStatusesJson) : {}

      // Check for changes
      const statusChanges = []
      const currentStatuses = {}

      for (const app of appointments) {
        currentStatuses[app.id] = app.status

        // If we have a previous status and it's different
        if (lastStatuses[app.id] !== undefined && lastStatuses[app.id] !== app.status) {
          console.log(`Header detected status change: ${app.id} from ${lastStatuses[app.id]} to ${app.status}`)

          // Only notify about these specific status changes
          if (app.status === "confirmed" || app.status === "waiting for patient confirmation") {
            statusChanges.push({
              id: app.id,
              status: app.status,
              type: app.status === "confirmed" ? "approved" : "modified",
            })
          }
        } else if (lastStatuses[app.id] === undefined) {
          // First time seeing this appointment
          console.log(`Header detected new appointment: ${app.id} with status ${app.status}`)

          if (app.status === "confirmed" || app.status === "waiting for patient confirmation") {
            // Check if we already have a notification for this appointment
            const existingNotifications = JSON.parse(localStorage.getItem("appointmentNotifications") || "[]")
            const hasNotification = existingNotifications.some(
              (n: Notification) => n.appointmentId === app.id && !n.dismissed,
            )

            if (!hasNotification) {
              statusChanges.push({
                id: app.id,
                status: app.status,
                type: app.status === "confirmed" ? "approved" : "modified",
              })
            }
          }
        }
      }

      // Save current statuses for next comparison
      localStorage.setItem("lastAppointmentStatuses", JSON.stringify(currentStatuses))

      // If we have changes, create notifications
      if (statusChanges.length > 0) {
        console.log(`Header creating ${statusChanges.length} new notifications`)

        // Get existing notifications
        const existingNotifications = JSON.parse(localStorage.getItem("appointmentNotifications") || "[]")

        // Create new notifications
        const newNotifications = statusChanges.map((change) => ({
          appointmentId: change.id,
          type: change.type,
          read: false,
          dismissed: false,
          timestamp: Date.now(),
        }))

        // Combine with existing, removing duplicates
        const filteredExisting = existingNotifications.filter(
          (n: Notification) => !newNotifications.some((newN) => newN.appointmentId === n.appointmentId) && !n.dismissed,
        )

        const updatedNotifications = [...filteredExisting, ...newNotifications]

        // Update localStorage
        localStorage.setItem("appointmentNotifications", JSON.stringify(updatedNotifications))

        // Update state if we're not on the appointments page
        if (!currentPathRef.current.includes("appointmentlist")) {
          setNotifications(updatedNotifications.filter((n: Notification) => !n.read && !n.dismissed))
        }
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error)
    }
  }

  useEffect(() => {
    // Track current path to know if we're on the appointments page
    if (typeof window !== "undefined") {
      currentPathRef.current = window.location.pathname
    }

    const storedUserData = localStorage.getItem("user")
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData)
        setUserData(parsedData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Load notifications from localStorage
    const loadNotifications = () => {
      try {
        const storedNotifications = localStorage.getItem("appointmentNotifications")
        if (!storedNotifications) {
          setNotifications([])
          return
        }

        const parsedNotifications = JSON.parse(storedNotifications) as Notification[]

        // Ensure all notifications have the required fields
        const validatedNotifications = parsedNotifications.map((n) => ({
          ...n,
          dismissed: !!n.dismissed, // Ensure dismissed is a boolean
          read: !!n.read, // Ensure read is a boolean
        }))

        // Filter out dismissed notifications
        const activeNotifications = validatedNotifications.filter((n) => !n.dismissed)

        // If we're on the appointments page, mark all as read and don't show in header
        if (currentPathRef.current.includes("appointmentlist")) {
          // Mark all as read in localStorage
          const updatedForStorage = validatedNotifications.map((n) => ({
            ...n,
            read: true,
          }))

          localStorage.setItem("appointmentNotifications", JSON.stringify(updatedForStorage))

          // Don't show any notifications in the header when on appointments page
          setNotifications([])
        } else {
          // Only show unread notifications in the header when not on appointments page
          const unreadNotifications = activeNotifications.filter((n) => !n.read)
          setNotifications(unreadNotifications)
        }
      } catch (error) {
        console.error("Error parsing notifications:", error)
        // Reset notifications if there's an error
        setNotifications([])
      }
    }

    // Initial load
    loadNotifications()

    // Initial check for new notifications
    checkForNewNotifications()

    // Set up event listener for storage changes (works across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "appointmentNotifications") {
        loadNotifications()
      }
    }

    // Set up custom event listener for same-window updates
    const handleCustomEvent = () => {
      loadNotifications()
    }

    // Listen for route changes to update currentPathRef
    const handleRouteChange = () => {
      if (typeof window !== "undefined") {
        const newPath = window.location.pathname
        console.log(`Route changed from ${currentPathRef.current} to ${newPath}`)
        currentPathRef.current = newPath
        loadNotifications() // Reload notifications when route changes
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("appointmentNotificationsUpdated", handleCustomEvent)
    window.addEventListener("popstate", handleRouteChange)

    // Set up polling to check for new notifications every 10 seconds
    const notificationInterval = setInterval(checkForNewNotifications, 10000)

    // Also poll for changes to localStorage every 5 seconds (as a backup)
    const checkInterval = setInterval(loadNotifications, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("appointmentNotificationsUpdated", handleCustomEvent)
      window.removeEventListener("popstate", handleRouteChange)
      clearInterval(checkInterval)
      clearInterval(notificationInterval)

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("patientData")
    // Don't remove notifications on logout so they persist between sessions
    // localStorage.removeItem("appointmentNotifications")
    router.push("/login")
    setShowDropdown(false)
  }

  const getPhotoUrl = () => {
    if (!userData || !userData.photo) return null
    return userData.photo.startsWith("http") ? userData.photo : `http://localhost:8000${userData.photo}`
  }

  const handleAppointmentClick = () => {
    // Mark all notifications as read when visiting appointments
    const storedNotifications = localStorage.getItem("appointmentNotifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Mark as read but don't change dismissed status
        const updatedNotifications = parsedNotifications.map((n: Notification) => ({
          ...n,
          read: true,
        }))
        localStorage.setItem("appointmentNotifications", JSON.stringify(updatedNotifications))

        // Clear notifications in the header
        setNotifications([])

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("appointmentNotificationsUpdated"))
      } catch (error) {
        console.error("Error updating notifications:", error)
      }
    }

    setShowDropdown(false)
  }

  const unreadNotifications = notifications.length

  return (
    <header className="bg-blue-500 text-white px-4 py-4">
      <div className="container mx-auto flex items-center">
        {/* Logo - Left aligned with some right margin */}
        <Link href="/home" className="text-white font-bold text-2xl mr-auto">
          eMedix
        </Link>

        {/* Navigation Links - Right aligned but before the profile */}
        <div className="flex space-x-6 mr-6">
          <Link href="/home" className="text-white hover:text-blue-200">
            Home
          </Link>
          <Link href="/medicament" className="text-white hover:text-blue-200">
            Medicaments
          </Link>
          <Link href="doctorlist" className="text-white hover:text-blue-200">
            All doctors
          </Link>
        </div>

        {/* User Profile - Far right */}
        <div className="relative">
          <button className="flex items-center focus:outline-none" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-blue-400">
              {userData && userData.photo ? (
                <Image
                  src={getPhotoUrl() || "/placeholder.svg"}
                  alt={`${userData.prenom} ${userData.nom}`}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1">
                <NotificationBadge count={unreadNotifications} />
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[9999]">
              <Link
                href="profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <div className="relative">
                <Link
                  href="appointmentlist"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleAppointmentClick}
                >
                  <User className="w-4 h-4 mr-2" />
                  My appointments
                  {unreadNotifications > 0 && <NotificationBadge count={unreadNotifications} />}
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

