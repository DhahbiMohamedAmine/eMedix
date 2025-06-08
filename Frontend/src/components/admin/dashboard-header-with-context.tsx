
"use client"
import { Menu, Search, User, Bell, Globe } from "lucide-react"
import { useState } from "react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { useNotifications } from "@/components/admin/notification-provider"
import { ThemeToggle } from "@/components/admin/theme-toggle"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { language, setLanguage } = useLanguage()
  const dictionary = useDictionary()
  const router = useRouter()
  const { pendingDoctors, loading, markAsRead } = useNotifications()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const languageNames = {
    en: "English",
    fr: "Français",
    ar: "العربية",
  }

  const handleNotificationClick = (doctorId?: number) => {
    setNotificationsOpen(false)
    if (doctorId) {
      // Mark as read
      markAsRead(doctorId)
      // Navigate to specific doctor's approval page (if implemented)
      router.push(`/admin/doctor-approval?selected=${doctorId}`)
    } else {
      // Navigate to general doctor approval page
      router.push("/admin/doctor-approval")
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
          <div className="relative">
            <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={dictionary.dashboard.searchHere}
                className="ml-2 bg-transparent border-none focus:outline-none text-sm dark:text-gray-300 dark:placeholder-gray-500"
              />
            </div>
          </div>

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
            <DropdownMenuContent align="end" className="w-40 dark:bg-gray-800 dark:border-gray-700">
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
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative">
                <Bell className="h-5 w-5" />
                {pendingDoctors.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white border-2 border-white dark:border-gray-800 rounded-full">
                    {pendingDoctors.length}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 dark:bg-gray-800 dark:border-gray-700 p-0">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium">Notifications</h3>
              </div>

              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                </div>
              ) : pendingDoctors.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {pendingDoctors.map((doctor) => (
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
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
