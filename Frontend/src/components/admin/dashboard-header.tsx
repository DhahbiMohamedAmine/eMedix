"use client"
import { Menu, Search, User, Bell, Globe } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { ThemeToggle } from "@/components/admin/theme-toggle"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { language, setLanguage } = useLanguage()
  const dictionary = useDictionary()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const languageNames = {
    en: "English",
    fr: "Français",
    ar: "العربية",
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

          <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}