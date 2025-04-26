"use client"
import "../../../public/tailwind.css"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { useLanguage } from "@/contexts/language-context"

interface Patient {
  id: number
  nom: string
  prenom: string
  date_naissance: string
  email: string
  telephone: string
  photo: string
}

export function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const patientsPerPage = 8

  const dictionary = useDictionary()
  const { dir } = useLanguage()

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:8000/stats/patients")

        if (!response.ok) {
          throw new Error(`Error fetching patients: ${response.status}`)
        }

        const data = await response.json()
        setPatients(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch patients:", err)
        setError("Failed to load patients. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">{dictionary.dashboard.patientList}</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder={dictionary.dashboard.searchPatients}
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
              <table className="w-full border-collapse" dir={dir}>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.photo}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.name}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.age}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.email}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      {dictionary.dashboard.phone}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                          {patient.photo ? (
                            <Image
                              src={
                                patient.photo.startsWith("http")
                                  ? patient.photo
                                  : `http://localhost:8000${patient.photo}`
                              }
                              alt={`${patient.prenom} ${patient.nom}`}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                              {patient.prenom[0]}
                              {patient.nom[0]}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {patient.prenom} {patient.nom}
                      </td>
                      <td className="py-3 px-4">
                        {calculateAge(patient.date_naissance)} {dictionary.dashboard.years}
                      </td>
                      <td className="py-3 px-4">{patient.email}</td>
                      <td className="py-3 px-4">{patient.telephone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  {dictionary.dashboard.showing} {indexOfFirstPatient + 1} {dictionary.dashboard.to}{" "}
                  {Math.min(indexOfLastPatient, filteredPatients.length)} {dictionary.dashboard.of}{" "}
                  {filteredPatients.length} {dictionary.dashboard.patients}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-200 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-medium">
                    {dictionary.dashboard.page} {currentPage} {dictionary.dashboard.of} {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
