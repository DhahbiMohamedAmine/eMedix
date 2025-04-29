"use client"
import { useState, useEffect } from "react"
import { DoctorsList } from "@/components/admin/doctors-list"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Sidebar } from "@/components/admin/sidebar"
import { LanguageProvider } from "@/contexts/language-context"
import { DictionaryProvider } from "@/components/admin/dictionary-provider"
import { getDictionary } from "@/lib/dictionary"
import { useDictionary } from "@/components/admin/dictionary-provider"

function DoctorsContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const dictionary = useDictionary()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <a href="/." className="text-gray-500 hover:text-gray-700">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-gray-500 mx-2">/</span>
                      <span className="text-gray-500">{dictionary.dashboard.doctors}</span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">{dictionary.dashboard.doctors}</h1>

            <DoctorsList />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
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
        <DoctorsContent />
      </DictionaryProvider>
    </LanguageProvider>
  )
}
