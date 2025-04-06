"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Header from "@/components/medecin/header"
import Footer from "@/components/footer"
import PatientDetailsPopup from "./patientdetails"

interface Patient {
  id: number
  user_id: number
  nom: string
  prenom: string
  email: string
  photo: string | null
  telephone: string
  adresse: string
  date_naissance: string
  sexe: string
  antecedents_medicaux?: string
}

interface Appointment {
  id: number
  patient_id: number
  date: string
  heure: string
  statut: string
  motif: string
}

interface PatientWithAppointments extends Patient {
  appointments: Appointment[]
}

export default function PatientList() {
  const [patients, setPatients] = useState<PatientWithAppointments[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

  const handleViewPatientDetails = (patientId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedPatientId(patientId)
    setIsPatientDetailsOpen(true)
  }

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)

        const storedMedecinData = localStorage.getItem("medecinData")
        if (!storedMedecinData) {
          throw new Error("No medecin data found in localStorage")
        }

        const parsedData = JSON.parse(storedMedecinData)
        const medecinId = parsedData.medecin_id

        const response = await fetch(`http://localhost:8000/appointments/medecin/patients/${medecinId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch patients")
        }

        const data = await response.json()
        setPatients(data)
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePatientClick = (patientId: number) => {
    router.push(`/doctor/patient/${patientId}`)
  }

  

  const handleAddAppointment = (event: React.MouseEvent, patientId: number) => {
    event.stopPropagation() // Prevent the card click event from firing
    router.push(`/medecin/appointment?patient=${patientId}`)
  }

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.nom} ${patient.prenom}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Update the getImageUrl function to be more robust and handle edge cases better
  const getImageUrl = (photoPath: string | null) => {
    if (!photoPath) return "/images/patient-placeholder.jpg"

    try {
      // If it's already a full URL, return it
      if (photoPath.startsWith("http")) return photoPath

      // Make sure the path starts with a slash
      const formattedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`
      return `http://localhost:8000${formattedPath}`
    } catch (error) {
      console.error("Error formatting image URL:", error)
      return "/images/patient-placeholder.jpg"
    }
  }

  // Function to get the most recent appointment date
  const getLastAppointmentDate = (appointments: Appointment[]) => {
    if (!appointments || appointments.length === 0) return "No appointments"

    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return new Date(sortedAppointments[0].date).toLocaleDateString()
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">My Patients</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Patient List</h1>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DD4BF]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={(event) => handleViewPatientDetails(patient.id, event)}
                      >
                        <div className="flex h-full flex-col">
                          <div className="relative h-48 w-full bg-gray-200">
                            {patient.photo ? (
                              <Image
                                src={getImageUrl(patient.photo) || "/placeholder.svg"}
                                alt={`${patient.prenom} ${patient.nom}`}
                                fill
                                unoptimized
                                style={{ objectFit: "cover" }}
                                onError={(e) => {
                                  console.error("Image failed to load:", patient.photo)
                                  const target = e.target as HTMLImageElement
                                  target.src = "/images/patient-placeholder.jpg"
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-gray-300 text-gray-600 text-2xl font-bold">
                                <span>
                                  {patient.prenom[0]}
                                  {patient.nom[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-grow p-4">
                            <h3 className="text-xl font-bold text-gray-900">{`${patient.nom} ${patient.prenom}`}</h3>
                            <p className="text-sm text-[#2DD4BF] font-medium">Patient ID: {patient.id}</p>
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Date of Birth:</span>{" "}
                              {new Date(patient.date_naissance).toLocaleDateString()}
                            </p>
                            
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Contact:</span> {patient.telephone}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Last Visit:</span>{" "}
                              {getLastAppointmentDate(patient.appointments)}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Total Visits:</span> {patient.appointments?.length || 0}
                            </p>
                            <div className="mt-auto pt-4 space-y-2">
                              
                              <button
                                onClick={(e) => handleAddAppointment(e, patient.id)}
                                className="w-full rounded-md border border-[#2DD4BF] bg-white px-4 py-2 text-sm font-medium text-[#2DD4BF] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                              >
                                Add Appointment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-gray-500">
                      No patients found matching your search. Please try a different name.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <PatientDetailsPopup
          isOpen={isPatientDetailsOpen}
          patientId={selectedPatientId}
          onClose={() => setIsPatientDetailsOpen(false)}
        />
      </div>
      <Footer />
    </main>
  )
}