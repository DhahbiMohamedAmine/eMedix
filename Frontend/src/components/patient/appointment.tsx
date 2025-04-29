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

  useEffect(() => {
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
  }, [])

  // Generate time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slots = []
      const date = new Date(selectedDate)

      // Set hours from 8:00 to 17:00 with 30-minute intervals
      for (let hour = 8; hour < 17; hour++) {
        for (const minute of [0, 30]) {
          const timeDate = new Date(date)
          timeDate.setHours(hour, minute, 0, 0)

          // Only add future time slots
          if (timeDate > new Date()) {
            const formattedTime = timeDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
            slots.push(formattedTime)
          }
        }
      }

      setTimeSlots(slots)
      setSelectedTimeSlot(null) // Reset selected time slot when date changes
    }
  }, [selectedDate])

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

    // Create a date object with the selected date and time
    const [hours, minutes] = selectedTimeSlot.split(":").map(Number)
    const appointmentDateTime = new Date(selectedDate)
    appointmentDateTime.setHours(hours, minutes, 0, 0)

    // Validate that the date is not in the past
    const now = new Date()
    if (appointmentDateTime < now) {
      showToast("Please select a future date and time.", "warning")
      return
    }

    const formattedDate = appointmentDateTime.toISOString().split(".")[0]

    const appointmentData = {
      patient_id: patientId,
      date: formattedDate,
    }

    console.log("Sending appointment data:", appointmentData)

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
    return now.toISOString().split("T")[0]
  }

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
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
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">
                      Select Date
                    </label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getCurrentDate()}
                      className="border-neutral-300 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                      required
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Select Time Slot</label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.length > 0 ? (
                          timeSlots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTimeSlot === time ? "default" : "outline"}
                              className={`
                                border-neutral-300 
                                ${
                                  selectedTimeSlot === time
                                    ? "bg-primary-500 hover:bg-primary-600 text-white"
                                    : "hover:bg-primary-50 hover:text-primary-600"
                                }
                              `}
                              onClick={() => setSelectedTimeSlot(time)}
                            >
                              {time}
                            </Button>
                          ))
                        ) : (
                          <p className="col-span-3 text-neutral-500 text-sm py-2">
                            No available time slots for this date
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedDate && selectedTimeSlot && (
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
                  disabled={isRedirecting || !selectedDate || !selectedTimeSlot}
                >
                  {isRedirecting ? "Redirecting..." : "Confirm Appointment"}
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
