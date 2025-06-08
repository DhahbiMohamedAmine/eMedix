"use client"
import { useState, useEffect } from "react"
import { Menu, User, Bell, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { ThemeToggle } from "@/components/admin/theme-toggle"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PendingDoctor {
  id: number
  nom: string
  prenom: string
  email: string
  photo: string | null
  grade: string
}

// Create a standalone version that doesn't rely on the context
function StandaloneDashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { language, setLanguage } = useLanguage()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dictionary = useDictionary()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([])
  const [visibleDoctors, setVisibleDoctors] = useState<PendingDoctor[]>([])
  const [loading, setLoading] = useState(false)
  const [readNotifications, setReadNotifications] = useState<number[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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

        // Update visible doctors (excluding those that have been read and removed)
        updateVisibleDoctors(data, readNotifications)
      }
    } catch (error) {
      console.error("Failed to fetch pending doctors:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update visible doctors and unread count
  const updateVisibleDoctors = (doctors: PendingDoctor[], readIds: number[]) => {
    // Filter out doctors that have been read and removed
    const visible = doctors.filter((doctor) => !readIds.includes(doctor.id))
    setVisibleDoctors(visible)

    // Update unread count
    setUnreadCount(visible.length)
  }

  useEffect(() => {
    // Initial fetch
    fetchPendingDoctors()

    // Set up polling every 5 minutes
    const intervalId = setInterval(fetchPendingDoctors, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update visible doctors whenever readNotifications changes
  useEffect(() => {
    updateVisibleDoctors(pendingDoctors, readNotifications)
  }, [pendingDoctors, readNotifications])

  const markAsRead = (doctorId: number) => {
    // Add the doctor ID to the read notifications list if not already there
    if (!readNotifications.includes(doctorId)) {
      const updatedReadNotifications = [...readNotifications, doctorId]
      setReadNotifications(updatedReadNotifications)

      // Update visible doctors immediately
      setVisibleDoctors((prev) => prev.filter((doctor) => doctor.id !== doctorId))

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = () => {
    // Mark all current visible doctors as read
    const allIds = visibleDoctors.map((doctor) => doctor.id)
    const newReadNotifications = [...new Set([...readNotifications, ...allIds])]
    setReadNotifications(newReadNotifications)

    // Clear visible doctors
    setVisibleDoctors([])

    // Reset unread count
    setUnreadCount(0)
  }

  // When notification dropdown opens, don't mark all as read automatically
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open)
  }

  const handleNotificationClick = (doctorId?: number) => {
    setNotificationsOpen(false)

    if (doctorId) {
      // Mark this specific notification as read
      markAsRead(doctorId)

      // Navigate to specific doctor's approval page
      router.push(`/admin/confirmations?selected=${doctorId}`)
    } else {
      // Navigate to general doctor approval page
      router.push("/admin/confirmations")
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 flex justify-end items-center space-x-4">
          <div className="relative"></div>

          <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
            <User className="h-5 w-5" />
          </button>

          {/* Theme Toggle Switch */}
          <ThemeToggle />

          {/* Language Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700"
            >
              <DropdownMenuItem
                onClick={() => setLanguage("en")}
                className={language === "en" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : ""}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("fr")}
                className={language === "fr" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : ""}
              >
                Français
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("ar")}
                className={language === "ar" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : ""}
              >
                العربية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Dropdown */}
          <DropdownMenu open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white border-2 border-white dark:border-gray-800 rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-white dark:bg-gray-800 dark:border-gray-700 p-0 shadow-lg"
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-medium">Notifications</h3>
                {visibleDoctors.length > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {loading ? (
                <div className="p-4 text-center bg-white dark:bg-gray-800">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                </div>
              ) : visibleDoctors.length === 0 ? (
                <div className="p-4 text-center bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {visibleDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleNotificationClick(doctor.id)}
                    >
                      <div className="flex items-start">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={doctor.photo || ""} alt={`${doctor.nom} ${doctor.prenom}`} />
                          <AvatarFallback className="text-xs">
                            {doctor.nom.charAt(0)}
                            {doctor.prenom.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            New doctor registration
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {doctor.nom} {doctor.prenom} ({doctor.grade})
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{doctor.email}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30"
                        >
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingDoctors.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <button
                    className="w-full py-2 px-3 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                    onClick={() => handleNotificationClick()}
                  >
                    View all doctor applications
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Main component that wraps itself with NotificationProvider if needed
export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  // We're using a self-contained component that doesn't rely on the context
  return <StandaloneDashboardHeader onMenuClick={onMenuClick} />
}
