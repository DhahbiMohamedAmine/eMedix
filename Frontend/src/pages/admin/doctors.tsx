"use client"
import "../../../public/tailwind.css"
import { useState, useEffect } from "react"
import { DoctorsList } from "@/components/admin/doctors-list"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { Sidebar } from "@/components/admin/sidebar"
import { LanguageProvider } from "@/contexts/language-context"
import { DictionaryProvider } from "@/components/admin/dictionary-provider"
import { getDictionary } from "@/lib/dictionary"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"


function DoctorsContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const dictionary = useDictionary()

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{dictionary.dashboard.doctors}</h1>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="mx-2">/</span>
                  <span className="text-gray-700 dark:text-gray-300">{dictionary.dashboard.doctors}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
              </TabsList>
              <TabsContent value="all">
                <DoctorsList />
              </TabsContent>
              <TabsContent value="active">
                <DoctorsList />
              </TabsContent>
              <TabsContent value="pending">
                <DoctorsList />
              </TabsContent>
            </Tabs>
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
