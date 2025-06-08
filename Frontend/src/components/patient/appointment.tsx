"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Header from "./header"
import Footer from "../../components/footer"
import { AlertCircle, CheckCircle, X, Calendar, Clock, Info, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface PatientData {
  patient_id: number
  date_naissance: string
}

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "warning"
}

interface DoctorAppointment {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  status: string
  note: string | null
}

export default function AppointmentForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const medecin_id = searchParams?.get("doctor")

  const [patientId, setPatientId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [doctorAppointments, setDoctorAppointments] = useState<DoctorAppointment[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)

  // Function to show toast notifications
  const showToast = (message: string, type: "success" | "error" | "warning") => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  // Function to dismiss a toast
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Helper function to check if a date is a weekend (Saturday or Sunday)
  const isWeekend = (dateString: string): boolean => {
    const date = new Date(dateString)
    const day = date.getDay()
    // 0 is Sunday, 6 is Saturday
    return day === 0 || day === 6
  }

  // Helper function to format date for database without timezone conversion
  const formatDateForDatabase = (dateString: string, timeString: string): string => {
    const [hours, minutes] = timeString.split(":").map(Number)

    // Create date object from the selected date string (YYYY-MM-DD format)
    const year = Number.parseInt(dateString.substring(0, 4))
    const month = Number.parseInt(dateString.substring(5, 7)) - 1 // Month is 0-indexed
    const day = Number.parseInt(dateString.substring(8, 10))

    // Create the date object in local timezone
    const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0)

    // Format as YYYY-MM-DD HH:MM:SS without timezone conversion
    const formattedYear = appointmentDateTime.getFullYear()
    const formattedMonth = String(appointmentDateTime.getMonth() + 1).padStart(2, "0")
    const formattedDay = String(appointmentDateTime.getDate()).padStart(2, "0")
    const formattedHours = String(appointmentDateTime.getHours()).padStart(2, "0")
    const formattedMinutes = String(appointmentDateTime.getMinutes()).padStart(2, "0")
    const formattedSeconds = String(appointmentDateTime.getSeconds()).padStart(2, "0")

    return `${formattedYear}-${formattedMonth}-${formattedDay} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  }

  // Helper function to check if a time is in the past
  const isTimeInPast = (dateString: string, timeString: string): boolean => {
    const [hours, minutes] = timeString.split(":").map(Number)
    const year = Number.parseInt(dateString.substring(0, 4))
    const month = Number.parseInt(dateString.substring(5, 7)) - 1
    const day = Number.parseInt(dateString.substring(8, 10))

    const appointmentDateTime = new Date(year, month, day, hours, minutes, 0, 0)
    const now = new Date()

    return appointmentDateTime <= now
  }

  // Helper function to check if a time slot is already booked by the doctor
  const isTimeSlotBooked = (dateString: string, timeString: string): boolean => {
    const [hours, minutes] = timeString.split(":").map(Number)

    return doctorAppointments.some((appointment) => {
      // Skip cancelled appointments
      if (appointment.status === "cancelled") {
        return false
      }

      const appointmentDate = new Date(appointment.date)
      const appointmentDateStr = appointmentDate.toISOString().split("T")[0]
      const appointmentHours = appointmentDate.getHours()
      const appointmentMinutes = appointmentDate.getMinutes()

      // Check if the appointment is on the same date and time
      return appointmentDateStr === dateString && appointmentHours === hours && appointmentMinutes === minutes
    })
  }

  // Fetch doctor's existing appointments
  const fetchDoctorAppointments = async () => {
    if (!medecin_id) return

    setIsLoadingAppointments(true)
    try {
      const response = await fetch(`http://localhost:8000/appointments/medecin/${medecin_id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch doctor appointments")
      }

      const appointments = await response.json()
      setDoctorAppointments(appointments)
      console.log("Fetched doctor appointments:", appointments)
    } catch (error) {
      console.error("Error fetching doctor appointments:", error)
      showToast("Failed to load doctor availability. Please try again.", "error")
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  // Generate available dates for the next 30 days (excluding weekends)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(today.getDate() + 30)

    for (let d = new Date(today); d <= thirtyDaysLater; d.setDate(d.getDate() + 1)) {
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        dates.push(`${year}-${month}-${day}`)
      }
    }

    return dates
  }

  useEffect(() => {
    // Generate available dates when component mounts
    setAvailableDates(generateAvailableDates())

    // Get and parse patientData from localStorage
    const storedPatientData = localStorage.getItem("patientData")
    if (storedPatientData) {
      try {
        const data: PatientData = JSON.parse(storedPatientData)
        setPatientId(data.patient_id)
      } catch (error) {
        console.error("Error parsing patient data:", error)
      }
    }

    // Fetch doctor's appointments
    fetchDoctorAppointments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medecin_id])

  // Handle date change and validate it's not a weekend
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value

    if (date && isWeekend(date)) {
      showToast("Weekends are not available for appointments. Please select a weekday (Monday-Friday).", "warning")
      setSelectedDate("")
    } else {
      setSelectedDate(date)
    }
  }

  // Generate time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slots = []

      // Set hours from 8:00 to 17:00 with 30-minute intervals
      for (let hour = 8; hour < 17; hour++) {
        for (const minute of [0, 30]) {
          const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

          // Only exclude past time slots, but show all future slots (including booked ones)
          if (!isTimeInPast(selectedDate, formattedTime)) {
            slots.push(formattedTime)
          }
        }
      }

      setTimeSlots(slots)
      setSelectedTimeSlot(null) // Reset selected time slot when date changes
    }
  }, [selectedDate, doctorAppointments])

  // Effect to handle redirection after successful appointment
  useEffect(() => {
    if (isRedirecting) {
      // Wait for the toast to be visible for a moment before redirecting
      const redirectTimer = setTimeout(() => {
        router.push("/patient/appointmentlist")
      }, 1500)

      return () => clearTimeout(redirectTimer)
    }
  }, [isRedirecting, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientId) {
      showToast("Patient ID not found. Please log in again.", "error")
      return
    }

    if (!selectedDate) {
      showToast("Please select a date for your appointment.", "warning")
      return
    }

    if (!selectedTimeSlot) {
      showToast("Please select a time slot for your appointment.", "warning")
      return
    }

    if (!medecin_id) {
      showToast("Doctor ID is missing from the URL.", "error")
      return
    }

    // Validate that the date is not a weekend
    if (isWeekend(selectedDate)) {
      showToast("Weekends are not available for appointments. Please select a weekday.", "warning")
      return
    }

    // Validate that the time slot is not already booked
    if (isTimeSlotBooked(selectedDate, selectedTimeSlot)) {
      showToast("This time slot is no longer available. Please select another time.", "warning")
      return
    }

    // Validate that the date and time is not in the past
    if (isTimeInPast(selectedDate, selectedTimeSlot)) {
      showToast("Please select a future date and time.", "warning")
      return
    }

    // Format the date without timezone conversion
    const formattedDate = formatDateForDatabase(selectedDate, selectedTimeSlot)

    const appointmentData = {
      patient_id: patientId,
      date: formattedDate,
    }

    console.log("Sending appointment data:", appointmentData)
    console.log("Selected date:", selectedDate)
    console.log("Selected time:", selectedTimeSlot)
    console.log("Formatted date for database:", formattedDate)

    try {
      const response = await fetch(`http://localhost:8000/appointments/addappointment/${medecin_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json().catch(() => null)
      console.log("Response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData?.message || "Failed to schedule appointment.")
      }

      showToast("Appointment scheduled successfully! Redirecting to appointments list...", "success")
      setSelectedDate("")
      setSelectedTimeSlot(null)
      setIsRedirecting(true)
    } catch (error) {
      console.error("Error submitting appointment:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""

    const year = Number.parseInt(dateString.substring(0, 4))
    const month = Number.parseInt(dateString.substring(5, 7)) - 1
    const day = Number.parseInt(dateString.substring(8, 10))

    const date = new Date(year, month, day)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      <Header />

      {/* Hero Section with Colorful Background */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Schedule Your Appointment</h1>
            <p className="text-primary-100 max-w-2xl mx-auto">
              Choose a convenient date and time for your medical consultation
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctors
        </Button>

        <Card className="overflow-hidden border border-primary-100 shadow-lg -mt-2">
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-auto overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white"></div>
              </div>
              <div className="relative h-full flex flex-col justify-center items-center p-8 text-white">
                <Calendar className="h-16 w-16 mb-6 opacity-90" />
                <h2 className="text-2xl font-bold mb-2 text-center">Medical Consultation</h2>
                <p className="text-primary-100 text-center max-w-xs">
                  Our doctors are available from 8:00 AM to 5:00 PM, Monday through Friday
                </p>
                <div className="mt-6 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 mr-2 text-primary-200" />
                    <span className="text-primary-100">Duration: 30 minutes</span>
                  </div>
                  <div className="flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary-200" />
                    <span className="text-primary-100">Please arrive 15 minutes early</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">Book Your Appointment</h3>
                <p className="text-neutral-600">Select your preferred date and time</p>
                {isLoadingAppointments && (
                  <div className="flex items-center mt-2 text-sm text-primary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Loading doctor availability...
                  </div>
                )}
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">
                      Select Date
                    </label>
                    <div className="space-y-2">
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        min={getCurrentDate()}
                        className="border-neutral-300 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                        required
                        disabled={isLoadingAppointments}
                      />
                      <p className="text-sm text-amber-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Appointments available Monday-Friday only
                      </p>
                    </div>
                  </div>

                  {selectedDate && !isWeekend(selectedDate) && !isLoadingAppointments && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Select Time Slot
                        <span className="text-sm font-normal text-neutral-500 ml-2">(Booked slots are disabled)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.length > 0 ? (
                          timeSlots.map((time) => {
                            const isBooked = isTimeSlotBooked(selectedDate, time)
                            return (
                              <Button
                                key={time}
                                type="button"
                                variant={selectedTimeSlot === time ? "default" : "outline"}
                                className={`
                                  border-neutral-300 
                                  ${
                                    selectedTimeSlot === time
                                      ? "bg-primary-500 hover:bg-primary-600 text-white"
                                      : isBooked
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                        : "hover:bg-primary-50 hover:text-primary-600"
                                  }
                                `}
                                onClick={() => !isBooked && setSelectedTimeSlot(time)}
                                disabled={isBooked}
                                title={isBooked ? "This time slot is already booked" : ""}
                              >
                                {time}
                                {isBooked && <span className="ml-1 text-xs">✕</span>}
                              </Button>
                            )
                          })
                        ) : (
                          <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-amber-500" />
                              <div>
                                <p className="font-medium">No available time slots</p>
                                <p className="text-sm mt-1">
                                  All time slots for this date are in the past. Please select another date.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDate && isWeekend(selectedDate) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-amber-500" />
                        <div>
                          <p className="font-medium">Weekend dates are not available</p>
                          <p className="text-sm mt-1">Please select a weekday (Monday-Friday) for your appointment.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedDate && selectedTimeSlot && !isWeekend(selectedDate) && (
                  <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                    <h4 className="font-medium text-neutral-800 mb-2">Appointment Summary</h4>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2 text-primary-500" />
                      <span className="text-sm text-neutral-700">{formatDateForDisplay(selectedDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary-500" />
                      <span className="text-sm text-neutral-700">{selectedTimeSlot}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-6 text-lg"
                  disabled={
                    isRedirecting ||
                    !selectedDate ||
                    !selectedTimeSlot ||
                    isWeekend(selectedDate) ||
                    isLoadingAppointments
                  }
                >
                  {isRedirecting ? "Redirecting..." : isLoadingAppointments ? "Loading..." : "Confirm Appointment"}
                </Button>
              </form>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between rounded-lg p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-5 ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border-l-4 border-green-500"
                : toast.type === "error"
                  ? "bg-red-50 text-red-800 border-l-4 border-red-500"
                  : "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
            }`}
            style={{ minWidth: "320px", maxWidth: "420px" }}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : toast.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={() => dismissToast(toast.id)} className="ml-4 rounded-full p-1 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Footer />
    </main>
  )
}
