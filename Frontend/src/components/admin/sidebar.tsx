"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Receipt, Bell, LogOut, Package, UserRound } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useDictionary } from "@/components/admin/dictionary-provider"

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter()
  const { dir } = useLanguage()
  const dictionary = useDictionary()

  const handleLogout = () => {
    // Here you would typically clear authentication tokens/cookies
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("adminData")
    // Redirect to login page
    router.push("/login")
  }

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : dir === "ltr" ? "-translate-x-full" : "translate-x-full"
      } fixed inset-y-0 ${dir === "ltr" ? "left-0" : "right-0"} z-50 w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen border-r border-gray-200 dark:border-gray-700`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold">{dictionary.dashboard.adminDashboard}</span>
        </div>
      </div>
      <nav className="p-4 space-y-1">
        <SidebarLink href="dashboard" icon={<LayoutDashboard />} text={dictionary.dashboard.dashboard} active />
        <SidebarLink href="doctors" icon={<Receipt />} text={dictionary.dashboard.doctors} />
        <SidebarLink href="patients" icon={<UserRound />} text={dictionary.dashboard.patients} />
        <SidebarLink href="confirmations" icon={<Bell />} text={dictionary.dashboard.confirmations} />

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 rounded-md transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 text-left"
        >
          <span className="w-6 h-6">
            <LogOut />
          </span>
          <span>{dictionary.dashboard.logout}</span>
        </button>
      </nav>
    </aside>
  )
}

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  text: string
  active?: boolean
}

function SidebarLink({ href, icon, text, active }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-3 rounded-md transition-colors ${
        active
          ? "bg-blue-500 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span>{text}</span>
    </Link>
  )
}
