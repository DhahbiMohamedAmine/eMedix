"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Calendar, Clock, MapPin, FileText, Filter, X } from "lucide-react"
import PrescriptionDetails from "@/components/medecin/prescription-details" // Import the PrescriptionDetails component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Appointment {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  status: string
  note: string | null
}

interface Doctor {
  id: number
  nom: string
  prenom: string
  specialite?: string
}

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Record<number, Doctor>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [showPrescription, setShowPrescription] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all") // New state for status filter

  // Fetch appointments and doctors data
  useEffect(() => {
    let isMounted = true
    const doctorsCache: Record<number, Doctor> = {}

    const fetchDoctorInfo = async (doctorId: number) => {
      // Check if we already have this doctor in the cache or state
      if (doctorsCache[doctorId] || doctors[doctorId]) return doctorsCache[doctorId] || doctors[doctorId]

      try {
        const response = await fetch(`http://localhost:8000/users/medecin/${doctorId}`)
        if (!response.ok) {
          console.error(`Failed to fetch doctor with ID ${doctorId}`)
          return null
        }
        const doctorData = await response.json()
        doctorsCache[doctorId] = doctorData
        return doctorData
      } catch (error) {
        console.error(`Error fetching doctor ${doctorId}:`, error)
        return null
      }
    }

    const fetchAppointments = async () => {
      if (!isMounted) return

      setIsLoading(true)
      try {
        const patientData = localStorage.getItem("patientData")
        if (!patientData) {
          throw new Error("Patient data not found in localStorage")
        }
        const { patient_id } = JSON.parse(patientData)
        if (!patient_id) {
          throw new Error("Patient ID not found in patientData")
        }

        const response = await fetch(`http://localhost:8000/appointments/patient/${patient_id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch appointments")
        }
        const data = (await response.json()) as Appointment[]

        console.log("Fetched appointments:", data)

        if (isMounted) {
          setAppointments(data)

          // Extract unique doctor IDs
          const doctorIds = [...new Set(data.map((app) => app.medecin_id))]

          // Fetch doctor info one by one and update state only once at the end
          const newDoctors: Record<number, Doctor> = { ...doctors }
          let hasNewDoctors = false

          for (const id of doctorIds) {
            if (!newDoctors[id]) {
              const doctorData = await fetchDoctorInfo(id)
              if (doctorData) {
                newDoctors[id] = doctorData
                hasNewDoctors = true
              }
            }
          }

          if (hasNewDoctors && isMounted) {
            setDoctors(newDoctors)
          }
        }
      } catch (error) {
        console.error("Error fetching appointments:", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    // Initial fetch
    fetchAppointments()

    return () => {
      isMounted = false
    }
  }, [doctors]) // Keep doctors in dependency array to update doctor info

  // Format date to a more readable format
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format time to a more readable format
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Handle view prescription click
  const handleViewPrescription = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId)
    setShowPrescription(true)
  }

  // Handle close prescription modal
  const handleClosePrescription = () => {
    setShowPrescription(false)
    setSelectedAppointmentId(null)
  }

  // Reset status filter
  const resetStatusFilter = () => {
    setStatusFilter("all")
  }

  // Filter past appointments
  const filteredAppointments = appointments
    .filter((appointment) => {
      // Filter for past appointments
      const appointmentDate = new Date(appointment.date)
      const now = new Date()
      return appointmentDate < now
    })
    .filter((appointment) => {
      // Apply status filter
      if (statusFilter === "all") return true
      return appointment.status === statusFilter
    })
    .sort((a, b) => {
      // Sort by date (descending - newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          dotColor: "bg-green-600",
          label: "Confirmed",
        }
      case "finished":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          dotColor: "bg-blue-600",
          label: "Completed",
        }
      case "cancelled":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          dotColor: "bg-red-600",
          label: "Cancelled",
        }
      case "waiting for medecin confirmation":
        return {
          bgColor: "bg-amber-100",
          textColor: "text-amber-800",
          dotColor: "bg-amber-600",
          label: "Pending Doctor Confirmation",
        }
      case "waiting for patient confirmation":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          dotColor: "bg-purple-600",
          label: "Pending Your Confirmation",
        }
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          dotColor: "bg-gray-600",
          label: status,
        }
    }
  }

  // Get unique status values for the filter
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "confirmed", label: "Confirmed" },
    { value: "finished", label: "Completed" },
    { value: "waiting for medecin confirmation", label: "Pending Doctor Confirmation" },
    { value: "waiting for patient confirmation", label: "Pending Your Confirmation" },
  ]

  return (
    <main className="w-full bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Medical History</h1>
              <p className="mt-2 text-white/80">View your past medical appointments and consultation records</p>
            </div>
          </div>

          <div className="p-6">
            {/* Status Filter */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Past Appointments</h2>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-full sm:w-64">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white border-gray-300 focus:ring-blue-500">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Filter by status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="hover:bg-gray-100">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {statusFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetStatusFilter}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear filter</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Status filter indicator */}
            {statusFilter !== "all" && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                    Status: {statusOptions.find((opt) => opt.value === statusFilter)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetStatusFilter}
                      className="ml-2 h-4 w-4 p-0 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Clear filter</span>
                    </Button>
                  </Badge>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            )}

            {!isLoading && filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-blue-50 p-6 mb-4">
                  <Calendar className="h-12 w-12 text-blue-500" />
                </div>
                <p className="text-xl font-medium text-gray-800">
                  {statusFilter !== "all"
                    ? `No appointments with status "${statusOptions.find((opt) => opt.value === statusFilter)?.label}" found`
                    : "No past appointments found"}
                </p>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  {statusFilter !== "all"
                    ? "Try selecting a different status filter"
                    : "Your medical history will appear here after your scheduled appointments have passed"}
                </p>
                {statusFilter !== "all" && (
                  <Button
                    variant="outline"
                    onClick={resetStatusFilter}
                    className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Show all appointments
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-500">
                  {filteredAppointments.length} {filteredAppointments.length === 1 ? "record" : "records"} found
                </div>
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => {
                    const doctor = doctors[appointment.medecin_id]
                    const statusInfo = getStatusInfo(appointment.status)
                    const appointmentDate = new Date(appointment.date)
                    const isCompleted = appointment.status === "confirmed" || appointment.status === "finished"

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-14 w-14 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-semibold">
                              {doctor ? doctor.prenom.charAt(0) + doctor.nom.charAt(0) : "DR"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {doctor ? `Dr. ${doctor.prenom} ${doctor.nom}` : `Doctor #${appointment.medecin_id}`}
                              </h3>
                              {doctor?.specialite && <p className="text-sm text-gray-600 mt-1">{doctor.specialite}</p>}

                              <div className="mt-3 flex flex-wrap gap-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
                                >
                                  <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                              <span>
                                {appointmentDate.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-blue-500" />
                              <span>
                                {appointmentDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                              <span>Medical Center</span>
                            </div>
                          </div>
                        </div>

                        {/* Alternative View Prescription Button - Full width at bottom of card */}
                        {isCompleted && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleViewPrescription(appointment.id)}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                              View Prescription
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {showPrescription && selectedAppointmentId && (
        <PrescriptionDetails appointmentId={selectedAppointmentId} onClose={handleClosePrescription} />
      )}

      <Footer />
    </main>
  )
}
