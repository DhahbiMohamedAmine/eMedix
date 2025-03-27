"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { LogOut, User, Bell, CheckCircle, XCircle, Calendar } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { NotificationBadge } from "@/components/notification-badge"

interface UserData {
  photo?: string
  prenom: string
  nom: string
}

interface DoctorNotification {
  appointmentId: number
  type: "confirmed" | "modified" | "cancelled"
  read: boolean
  dismissed: boolean
  timestamp: number
  patientId: number
  appointmentDate: string
}

export default function HeaderComponent() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<DoctorNotification[]>([])
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentPathRef = useRef<string>("")

  // Function to check for new notifications by comparing appointment statuses
  const checkForNewNotifications = async () => {
    try {
      // Only check if we have medecin data
      const medecinData = localStorage.getItem("medecinData")
      if (!medecinData) return

      const { medecin_id } = JSON.parse(medecinData)
      if (!medecin_id) return

      // Get current appointments
      const response = await fetch(`http://localhost:8000/appointments/medecin/${medecin_id}`)
      if (!response.ok) return

      const appointments = await response.json()

      // Get last known statuses
      const lastStatusesJson = localStorage.getItem("lastKnownAppointmentStatuses")
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
          if (
            app.status === "confirmed" ||
            app.status === "cancelled" ||
            app.status === "waiting for medecin confirmation"
          ) {
            statusChanges.push({
              id: app.id,
              status: app.status,
              type: app.status === "confirmed" ? "confirmed" : app.status === "cancelled" ? "cancelled" : "modified",
              patient_id: app.patient_id,
              date: app.date,
            })
          }
        } else if (lastStatuses[app.id] === undefined) {
          // First time seeing this appointment
          console.log(`Header detected new appointment: ${app.id} with status ${app.status}`)

          if (
            app.status === "confirmed" ||
            app.status === "cancelled" ||
            app.status === "waiting for medecin confirmation"
          ) {
            // Check if we already have a notification for this appointment
            const existingNotifications = JSON.parse(localStorage.getItem("doctorAppointmentNotifications") || "[]")
            const hasNotification = existingNotifications.some(
              (n: DoctorNotification) => n.appointmentId === app.id && !n.dismissed,
            )

            if (!hasNotification) {
              statusChanges.push({
                id: app.id,
                status: app.status,
                type: app.status === "confirmed" ? "confirmed" : app.status === "cancelled" ? "cancelled" : "modified",
                patient_id: app.patient_id,
                date: app.date,
              })
            }
          }
        }
      }

      // Save current statuses for next comparison
      localStorage.setItem("lastKnownAppointmentStatuses", JSON.stringify(currentStatuses))

      // If we have changes, create notifications
      if (statusChanges.length > 0) {
        console.log(`Header creating ${statusChanges.length} new notifications`)

        // Get existing notifications
        const existingNotifications = JSON.parse(localStorage.getItem("doctorAppointmentNotifications") || "[]")

        // Create new notifications
        const newNotifications = statusChanges.map((change) => ({
          appointmentId: change.id,
          type: change.type,
          read: false,
          dismissed: false,
          timestamp: Date.now(),
          patientId: change.patient_id,
          appointmentDate: change.date,
        }))

        // Combine with existing, removing duplicates
        const filteredExisting = existingNotifications.filter(
          (n: DoctorNotification) =>
            !newNotifications.some((newN) => newN.appointmentId === n.appointmentId) && !n.dismissed,
        )

        const updatedNotifications = [...filteredExisting, ...newNotifications]

        // Update localStorage
        localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedNotifications))

        // Update state if we're not on the calendar page
        if (!currentPathRef.current.includes("calendar")) {
          setNotifications(updatedNotifications.filter((n: DoctorNotification) => !n.read && !n.dismissed))
        }
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error)
    }
  }

  useEffect(() => {
    // Track current path to know if we're on the calendar page
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
        const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
        if (!storedNotifications) {
          setNotifications([])
          return
        }

        const parsedNotifications = JSON.parse(storedNotifications) as DoctorNotification[]

        // Ensure all notifications have the required fields
        const validatedNotifications = parsedNotifications.map((n) => ({
          ...n,
          dismissed: !!n.dismissed, // Ensure dismissed is a boolean
          read: !!n.read, // Ensure read is a boolean
        }))

        // Filter out dismissed notifications
        const activeNotifications = validatedNotifications.filter((n) => !n.dismissed)

        // If we're on the calendar page, mark all as read in localStorage
        if (currentPathRef.current.includes("calendar")) {
          // Mark all as read in localStorage
          const updatedForStorage = validatedNotifications.map((n) => ({
            ...n,
            read: true,
          }))

          localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedForStorage))

          // Don't show any notifications in the header when on calendar page
          setNotifications([])
        } else {
          // Only show unread notifications in the header when not on calendar page
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
      if (e.key === "doctorAppointmentNotifications") {
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
    window.addEventListener("doctorAppointmentNotificationsUpdated", handleCustomEvent)
    window.addEventListener("popstate", handleRouteChange)

    // Set up polling to check for new notifications every 10 seconds
    const notificationInterval = setInterval(checkForNewNotifications, 10000)

    // Also poll for changes to localStorage every 5 seconds (as a backup)
    const checkInterval = setInterval(loadNotifications, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("doctorAppointmentNotificationsUpdated", handleCustomEvent)
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
    localStorage.removeItem("medecinData")
    // Don't remove notifications on logout so they persist between sessions
    // localStorage.removeItem("doctorAppointmentNotifications")
    router.push("/login")
    setShowDropdown(false)
  }

  const getPhotoUrl = () => {
    if (!userData || !userData.photo) return null
    return userData.photo.startsWith("http") ? userData.photo : `http://localhost:8000${userData.photo}`
  }

  const handleCalendarClick = () => {
    // Don't automatically mark notifications as read when visiting calendar
    // Just close the dropdowns
    setShowDropdown(false)
    setShowNotifications(false)
  }

  const dismissAllNotifications = () => {
    const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Mark all as dismissed
        const updatedNotifications = parsedNotifications.map((n: DoctorNotification) => ({
          ...n,
          dismissed: true,
          read: true,
        }))
        localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedNotifications))

        // Clear notifications in the header
        setNotifications([])

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))
      } catch (error) {
        console.error("Error dismissing all notifications:", error)
      }
    }
    setShowNotifications(false)
  }

  const dismissNotification = (appointmentId: number) => {
    const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Mark specific notification as dismissed
        const updatedNotifications = parsedNotifications.map((n: DoctorNotification) =>
          n.appointmentId === appointmentId ? { ...n, dismissed: true, read: true } : n,
        )
        localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedNotifications))

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.appointmentId !== appointmentId))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))
      } catch (error) {
        console.error("Error dismissing notification:", error)
      }
    }
  }

  // Add a function to mark a notification as read without dismissing it
  // Add this function after the dismissNotification function:

  const markNotificationAsRead = (appointmentId: number) => {
    const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Mark specific notification as read but not dismissed
        const updatedNotifications = parsedNotifications.map((n: DoctorNotification) =>
          n.appointmentId === appointmentId ? { ...n, read: true } : n,
        )
        localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedNotifications))

        // Update local state - mark as read but keep in the list
        setNotifications((prev) => prev.map((n) => (n.appointmentId === appointmentId ? { ...n, read: true } : n)))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }
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
          <Link href="Calendar" className="text-white hover:text-blue-200" onClick={handleCalendarClick}>
            Calendar
          </Link>
        </div>

        {/* Notifications */}
        <div className="relative mr-4">
          <button
            className="flex items-center focus:outline-none"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Bell className="w-6 h-6 text-white" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1">
                  <NotificationBadge count={unreadNotifications} />
                </div>
              )}
            </div>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-20 max-h-[80vh] overflow-y-auto">
              <div className="p-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={dismissAllNotifications} className="text-xs text-gray-500 hover:text-gray-700">
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No new notifications</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={`${notification.appointmentId}-${notification.timestamp}`}
                      className={`p-3 ${!notification.read ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                    >
                      <div className="flex items-start">
                        <div
                          className={`flex-shrink-0 rounded-full p-1 ${
                            notification.type === "confirmed"
                              ? "bg-green-100"
                              : notification.type === "cancelled"
                                ? "bg-red-100"
                                : "bg-amber-100"
                          }`}
                        >
                          {notification.type === "confirmed" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : notification.type === "cancelled" ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Calendar className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.type === "confirmed"
                                ? "Appointment Confirmed"
                                : notification.type === "cancelled"
                                  ? "Appointment Cancelled"
                                  : "Appointment Modified"}
                            </p>
                            {!notification.read && (
                              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => {
                                // Navigate to calendar with the appointment date
                                const appointmentDate = new Date(notification.appointmentDate)
                                const formattedDate = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`

                                // Store the highlighted appointment ID in localStorage
                                localStorage.setItem("highlightedAppointmentId", notification.appointmentId.toString())

                                // Navigate to calendar with date parameter - use the correct path
                                // Use window.location.href instead of router.push to ensure a full page reload
                                window.location.href = `/medecin/Calendar?date=${formattedDate}&highlight=${notification.appointmentId}`

                                // Mark this notification as read but don't dismiss it
                                markNotificationAsRead(notification.appointmentId)
                                setShowNotifications(false)
                              }}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded"
                            >
                              View Appointment
                            </button>
                            <button
                              onClick={() => dismissNotification(notification.appointmentId)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-gray-200">
                <Link
                  href="/medecin/Calendar"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    handleCalendarClick()
                    setShowNotifications(false)
                  }}
                >
                  View all in calendar
                </Link>
              </div>
            </div>
          )}
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
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link
                href="profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
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

