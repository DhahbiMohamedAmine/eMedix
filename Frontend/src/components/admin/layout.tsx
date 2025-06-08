"use client"
import { useState } from "react"
import { NotificationProvider } from "@/components/admin/notification-provider"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Sidebar } from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
