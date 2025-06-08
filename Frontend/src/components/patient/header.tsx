"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  LogOut,
  User,
  Clock,
  Calendar,
  ShoppingCart,
  Home,
  PillIcon as Pills,
  Stethoscope,
  Bell,
  MessageSquare,
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

interface Notification {
  appointmentId: number
  type: "approved" | "modified"
  read: boolean
  dismissed: boolean
  timestamp: number
}

interface Appointment {
  id: number
  status: string
}

export default function HeaderComponent() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      const appointments = (await response.json()) as Appointment[]

      // Get last known statuses
      const lastStatusesJson = localStorage.getItem("lastAppointmentStatuses")
      const lastStatuses = lastStatusesJson ? (JSON.parse(lastStatusesJson) as Record<number, string>) : {}

      // Check for changes
      const statusChanges: Array<{ id: number; status: string; type: "approved" | "modified" }> = []
      const currentStatuses: Record<number, string> = {}

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
    localStorage.removeItem("patientid")
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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <div className="bg-white text-primary-600 rounded-lg p-2 mr-2">
              <span className="font-bold text-xl">e</span>
            </div>
            <span className="font-bold text-xl text-white">Medix</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/home"
              className="flex items-center text-sm font-medium text-white hover:text-primary-100 transition-colors"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <Link
              href="/patient/medicaments"
              className="flex items-center text-sm font-medium text-white hover:text-primary-100 transition-colors"
            >
              <Pills className="w-4 h-4 mr-1" />
              Medications
            </Link>
            <Link
              href="/patient/doctorlist"
              className="flex items-center text-sm font-medium text-white hover:text-primary-100 transition-colors"
            >
              <Stethoscope className="w-4 h-4 mr-1" />
              Doctors
            </Link>
            <Link
              href="/patient/cart"
              className="flex items-center text-sm font-medium text-white hover:text-primary-100 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Cart
            </Link>
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {unreadNotifications > 0 && (
              <Link
                href="/patient/appointmentlist"
                onClick={handleAppointmentClick}
                className="relative p-2 rounded-full hover:bg-primary-400 transition-colors"
              >
                <Bell className="h-5 w-5 text-white" />
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-medium text-primary-600">
                  {unreadNotifications}
                </span>
              </Link>
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
                  <div className=" rounded-full  flex items-center gap-2 p-4 border-b border-neutral-100">
                    <div className="rounded-full flex h-10 w-10 items-center justify-center  bg-primary-100">
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
                      <p className="text-xs text-neutral-500">Patient</p>
                    </div>
                  </div>
                )}
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/patient/profile" className="flex cursor-pointer items-center px-3 py-2">
                      <User className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link
                      href="/patient/appointmentlist"
                      className="flex cursor-pointer items-center px-3 py-2"
                      onClick={handleAppointmentClick}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">My Appointments</span>
                      {unreadNotifications > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-medium text-white">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/patient/appointment-history" className="flex cursor-pointer items-center px-3 py-2">
                      <Clock className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Appointment History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md focus:bg-primary-50">
                    <Link href="/patient/chat" className="flex cursor-pointer items-center px-3 py-2">
                      <MessageSquare className="mr-2 h-4 w-4 text-primary-500" />
                      <span className="text-neutral-800">Chat with Doctors</span>
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
