"use client"
import "../../../public/tailwind.css"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { useLanguage } from "@/contexts/language-context"

interface Doctor {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  photo: string
  ville: string
  adresse: string
  grade: string
  diplome: string
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const dictionary = useDictionary()
  const { dir } = useLanguage()

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true)
        const res = await fetch("http://localhost:8000/stats/doctors")
        if (!res.ok) throw new Error(`Error ${res.status}`)

        const data: Doctor[] = await res.json()
        setDoctors(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch doctors:", err)
        setError("Failed to load doctors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  const filtered = doctors.filter(
    (d) =>
      d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const last = currentPage * itemsPerPage
  const first = last - itemsPerPage
  const pageItems = filtered.slice(first, last)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <Card className="dark:bg-gray-800 dark:text-gray-100">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">{dictionary.dashboard.doctorsList}</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder={dictionary.dashboard.searchDoctors}
              className="w-full rounded-md border border-gray-200 pl-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse dark:text-gray-100" dir={dir}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.photo}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.name}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.email}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.phone}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.city}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.address}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.grade}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.diploma}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                          {doc.photo ? (
                            <Image
                              src={doc.photo.startsWith("http") ? doc.photo : `http://localhost:8000${doc.photo}`}
                              alt={`${doc.prenom} ${doc.nom}`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {doc.prenom[0]}
                              {doc.nom[0]}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {doc.prenom} {doc.nom}
                      </td>
                      <td className="py-3 px-4">{doc.email}</td>
                      <td className="py-3 px-4">{doc.telephone}</td>
                      <td className="py-3 px-4">{doc.ville}</td>
                      <td className="py-3 px-4">{doc.adresse}</td>
                      <td className="py-3 px-4">{doc.grade}</td>
                      <td className="py-3 px-4">{doc.diplome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  {dictionary.dashboard.showing} {first + 1} {dictionary.dashboard.to} {Math.min(last, filtered.length)}{" "}
                  {dictionary.dashboard.of} {filtered.length} {dictionary.dashboard.doctors}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-200 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-medium">
                    {dictionary.dashboard.page} {currentPage} {dictionary.dashboard.of} {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-200 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
