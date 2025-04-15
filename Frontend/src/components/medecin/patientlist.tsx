/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/medecin/header"
import Footer from "@/components/footer"
import PatientDetailsPopup from "./patientdetails"
import { Calendar, FileText, Search, Plus, User, Phone, Mail, Clock, CalendarDays } from "lucide-react"

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
  const [processingPatient, setProcessingPatient] = useState<number | null>(null)
  const router = useRouter()
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [patientVisitData, setPatientVisitData] = useState<
    Record<number, { totalVisits: number; lastVisit: string | null }>
  >({})

  // Function to fetch visit data for a patient
  const fetchPatientVisitData = async (patientId: number, medecinId: number) => {
    try {
      // Fetch confirmed appointments count - updated URL pattern
      const countResponse = await fetch(`http://localhost:8000/appointments/count/confirmed/${patientId}/${medecinId}`)
      if (!countResponse.ok) {
        throw new Error("Failed to fetch appointment count")
      }
      const countData = await countResponse.json()

      // Fetch last confirmed past appointment
      let lastVisitDate = null
      try {
        const lastVisitResponse = await fetch(
          `http://localhost:8000/appointments/last-confirmed-past/${patientId}/${medecinId}`,
        )
        if (lastVisitResponse.ok) {
          const lastVisitData = await lastVisitResponse.json()
          lastVisitDate = new Date(lastVisitData.last_confirmed_past_appointment.date).toLocaleDateString()
        }
      } catch (error) {
        console.log("No past appointments found for patient", patientId)
      }

      // Update state with the fetched data - updated response key
      setPatientVisitData((prev) => ({
        ...prev,
        [patientId]: {
          totalVisits: countData.past_confirmed_appointments_count,
          lastVisit: lastVisitDate,
        },
      }))
    } catch (error) {
      console.error(`Error fetching visit data for patient ${patientId}:`, error)
    }
  }

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

        // Fetch visit data for each patient
        data.forEach((patient: PatientWithAppointments) => {
          fetchPatientVisitData(patient.id, medecinId)
        })
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const handlePatientClick = (patientId: number) => {
    router.push(`/doctor/patient/${patientId}`)
  }

  const handleAddAppointment = (event: React.MouseEvent, patientId: number) => {
    event.stopPropagation() // Prevent the row click event from firing
    router.push(`/medecin/appointment?patient=${patientId}`)
  }

  const handleViewDentalChart = async (event: React.MouseEvent, patientId: number) => {
    event.stopPropagation() // Prevent the row click event from firing

    try {
      setProcessingPatient(patientId)

      // Store the patient ID in localStorage for the dental chart to use
      localStorage.setItem("patientData", JSON.stringify({ patient_id: patientId }))

      // Navigate to the dental chart page
      router.push(`/medecin/dental-chart`)
    } catch (error) {
      console.error("Error processing dental chart:", error)
      alert("There was an error accessing the dental chart. Please try again.")
    } finally {
      setProcessingPatient(null)
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.nom} ${patient.prenom}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Function to get the most recent appointment date
  const getLastAppointmentDate = (appointments: Appointment[]) => {
    if (!appointments || appointments.length === 0) return "No previous visits"

    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return new Date(sortedAppointments[0].date).toLocaleDateString()
  }

  // Function to format date of birth
  const formatDateOfBirth = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Calculate age from date of birth
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
    <main className="w-full bg-gray-50 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-teal-500">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-semibold text-white">Patient Management</h1>
              <button
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-cyan-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                onClick={() => router.push("/medecin/add-patient")}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Patient
              </button>
            </div>
          </div>

          <div className="px-8 py-6 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 mb-8">
              <div className="text-xl font-medium text-gray-700">
                {filteredPatients.length} {filteredPatients.length === 1 ? "Patient" : "Patients"}
              </div>
              <div className="w-full md:w-80 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full rounded-md border border-gray-300 pl-10 px-4 py-2.5 bg-gray-50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {filteredPatients.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Patient
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Contact Information
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Age / DOB
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Visit History
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={(event) => handleViewPatientDetails(patient.id, event)}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-cyan-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-base font-medium text-gray-900">
                                  {patient.nom} {patient.prenom}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center text-base text-gray-900">
                                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                                {patient.telephone}
                              </div>
                              <div className="flex items-center text-base text-gray-500 mt-2">
                                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                                {patient.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="text-base text-gray-900">
                                {calculateAge(patient.date_naissance)} years
                              </div>
                              <div className="text-sm text-gray-500 mt-2">
                                {formatDateOfBirth(patient.date_naissance)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center text-base text-gray-900">
                                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                                Last visit: {patientVisitData[patient.id]?.lastVisit || "No previous visits"}
                              </div>
                              <div className="flex items-center text-base text-gray-500 mt-2">
                                <CalendarDays className="h-5 w-5 text-gray-400 mr-2" />
                                Total visits: {patientVisitData[patient.id]?.totalVisits || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-base font-medium">
                            <div className="flex flex-col space-y-3">
                              <button
                                onClick={(e) => handleViewDentalChart(e, patient.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                                disabled={processingPatient === patient.id}
                              >
                                {processingPatient === patient.id ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Dental Chart
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => handleAddAppointment(e, patient.id)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                                disabled={processingPatient === patient.id}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Appointment
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                      <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900">No patients found</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Try adjusting your search or filters to find what you re looking for.
                    </p>
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
      <Footer />
    </main>
  )
}
