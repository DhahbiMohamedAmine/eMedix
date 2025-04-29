"use client"

import "../../../public/tailwind.css"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/admin/sidebar"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { MedicalStatsCards } from "@/components/admin/medical-stats-cards"
import { AppointmentsPerDay } from "@/components/admin/appointments-per-day"
import { PatientsByAge } from "@/components/admin/patients-by-age"
import { AppointmentsPerDoctor } from "@/components/admin/appointments-per-doctor"
import { YearlyAppointmentsPerDoctor } from "@/components/admin/yearly-appointments-per-doctor"
import { LanguageProvider } from "@/contexts/language-context"
import { DictionaryProvider } from "@/components/admin/dictionary-provider"
import { getDictionary } from "@/lib/dictionary"

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dictionaries, setDictionaries] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDictionaries() {
      try {
        const [en, fr, ar] = await Promise.all([getDictionary("en"), getDictionary("fr"), getDictionary("ar")])

        setDictionaries({ en, fr, ar })
        setLoading(false)
      } catch (error) {
        console.error("Failed to load dictionaries:", error)
      }
    }

    loadDictionaries()
  }, [])

  if (loading || !dictionaries) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <DictionaryProvider dictionaries={dictionaries}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar isOpen={isSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-900 dark:text-gray-100">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Medical Dashboard</h1>
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                      <li className="inline-flex items-center">
                        <a href="/ " className="text-gray-500 hover:text-gray-700 text-sm">
                          Home
                        </a>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <span className="text-gray-400 mx-2">/</span>
                          <span className="text-gray-500 text-sm">Dashboard</span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>

                <MedicalStatsCards />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <AppointmentsPerDay />
                  <PatientsByAge />
                  <AppointmentsPerDoctor />
                </div>

                <div className="mb-6">
                  <YearlyAppointmentsPerDoctor />
                </div>
              </div>
            </main>
          </div>
        </div>
      </DictionaryProvider>
    </LanguageProvider>
  )
}
// Global styles should be imported in _app.js or layout.tsx, not here
