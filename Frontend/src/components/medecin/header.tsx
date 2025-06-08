"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  LogOut,
  User,
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  MessageSquare,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Stethoscope,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Home,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserData {
  photo?: string
  prenom: string
  nom: string
}

interface DoctorNotification {
  appointmentId: number
  type: "confirmed" | "modified" | "cancelled" | "new"
  read: boolean
  dismissed: boolean
  timestamp: number
  patientId: number
  appointmentDate: string
}

export default function HeaderComponent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<DoctorNotification[]>([])
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentPathRef = useRef<string>("")
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)

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
      const lastStatuses: Record<number, string> = lastStatusesJson ? JSON.parse(lastStatusesJson) : {}

      // Check for changes
      const statusChanges = []
      const currentStatuses: Record<number, string> = {}

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
            // Check if this action was performed by the doctor (don't notify them about their own actions)
            const actionByDoctor = app.last_updated_by === "medecin"

            // Only create notification if the action wasn't performed by the doctor
            if (!actionByDoctor) {
              let notificationType =
                app.status === "confirmed" ? "confirmed" : app.status === "cancelled" ? "cancelled" : "modified"

              // If status is "waiting for medecin confirmation", it's a new appointment
              if (app.status === "waiting for medecin confirmation") {
                notificationType = "new"
              }

              statusChanges.push({
                id: app.id,
                status: app.status,
                type: notificationType,
                patient_id: app.patient_id,
                date: app.date,
              })
            }
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

            // Check if this action was performed by the doctor (don't notify them about their own actions)
            const actionByDoctor = app.last_updated_by === "medecin"

            if (!hasNotification && !actionByDoctor) {
              let notificationType =
                app.status === "confirmed" ? "confirmed" : app.status === "cancelled" ? "cancelled" : "modified"

              // If status is "waiting for medecin confirmation", it's a new appointment
              if (app.status === "waiting for medecin confirmation") {
                notificationType = "new"
              }

              statusChanges.push({
                id: app.id,
                status: app.status,
                type: notificationType,
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
    localStorage.removeItem("doctorId")
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
    setShowNotificationsDropdown(false)
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
    setShowNotificationsDropdown(false)
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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/medecin/dashboard" className="flex items-center">
            <div className="bg-white text-primary-600 rounded-lg p-2 mr-2">
              <span className="font-bold text-xl">e</span>
            </div>
            <span className="font-bold text-xl text-white">Medix</span>
          </Link>

          {/* Navigation Links - Desktop */}
          

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {unreadNotifications > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative p-2 rounded-full hover:bg-primary-400 transition-colors"
                >
                  <Bell className="h-5 w-5 text-white" />
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-medium text-primary-600">
                    {unreadNotifications}
                  </span>
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 max-h-[80vh] overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={dismissAllNotifications}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
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
                                      : notification.type === "new"
                                        ? "bg-blue-100"
                                        : "bg-amber-100"
                                }`}
                              >
                                {notification.type === "confirmed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : notification.type === "cancelled" ? (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                ) : notification.type === "new" ? (
                                  <Calendar className="h-5 w-5 text-blue-500" />
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
                                        : notification.type === "new"
                                          ? "New Appointment"
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
                                      const formattedDate = `${appointmentDate.getFullYear()}-${String(
                                        appointmentDate.getMonth() + 1,
                                      ).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`

                                      // Store the highlighted appointment ID in localStorage
                                      localStorage.setItem(
                                        "highlightedAppointmentId",
                                        notification.appointmentId.toString(),
                                      )

                                      // Navigate to calendar with date parameter - use the correct path
                                      // Use window.location.href instead of router.push to ensure a full page reload
                                      window.location.href = `/medecin/Calendar?date=${formattedDate}&highlight=${notification.appointmentId}`

                                      // Mark this notification as read but don't dismiss it
                                      markNotificationAsRead(notification.appointmentId)
                                      setShowNotificationsDropdown(false)
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

                    <div className="p-3 border-t border-gray-200"></div>
                  </div>
                )}
              </div>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-primary-400">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-primary-400">
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
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-neutral-200 shadow-lg">
                {userData && (
                  <div className="rounded-full flex items-center gap-2 p-4 border-b border-neutral-100">
                    <div className="rounded-full flex h-10 w-10 items-center justify-center bg-primary-100">
                      {userData.photo ? (
                        <Image
                          src={getPhotoUrl() || "/placeholder.svg"}
                          alt={`${userData.prenom} ${userData.nom}`}
                          width={70}
                          height={70}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="h-4 w-4 text-primary-500" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium text-neutral-900">{`${userData.prenom} ${userData.nom}`}</p>
                      <p className="text-xs text-neutral-500">Doctor</p>
                    </div>
                  </div>
                )}
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/medecin/profile" className="flex cursor-pointer items-center px-3 py-2">
                      <User className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link
                      href="/medecin/Calendar"
                      className="flex cursor-pointer items-center px-3 py-2"
                      onClick={handleCalendarClick}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Calendar</span>
                      {unreadNotifications > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-medium text-white">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/medecin/patientlist" className="flex cursor-pointer items-center px-3 py-2">
                      <Users className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">My Patients</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/medecin/chat" className="flex cursor-pointer items-center px-3 py-2">
                      <MessageSquare className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Chat with Patients</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-neutral-200" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer rounded-md text-red-600 focus:bg-red-50 focus:text-red-600 px-3 py-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
