"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation" // Import useRouter for navigation
import Image from "next/image"
import Header from "./header"
import Footer from "../../components/footer"
import { AlertCircle, CheckCircle, X } from "lucide-react"

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
  const router = useRouter() // Initialize router for navigation
  const medecin_id = searchParams?.get("doctor") // Extract doctor ID from URL

  const [patientId, setPatientId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isRedirecting, setIsRedirecting] = useState(false)

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

    if (!medecin_id) {
      showToast("Doctor ID is missing from the URL.", "error")
      return
    }

    // Validate that the date is not in the past
    const selectedDateTime = new Date(selectedDate)
    const now = new Date()

    if (selectedDateTime < now) {
      showToast("Please select a future date. Past dates are not allowed.", "warning")
      return
    }

    // Validate that the time is between 8:00 and 17:00
    const hours = selectedDateTime.getHours()

    if (hours < 8 || hours >= 17) {
      showToast("Please select a time between 8:00 AM and 5:00 PM (business hours).", "warning")
      return
    }

    const formattedDate = new Date(selectedDate).toISOString().split(".")[0]

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
      setIsRedirecting(true) // Set redirecting state to true to trigger the navigation
    } catch (error) {
      console.error("Error submitting appointment:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Get current date and time in the format required for min attribute
  const getCurrentDateTime = () => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointment</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative w-full h-full overflow-hidden rounded-l-lg">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            <div className="p-8 md:p-12">
              <h1 className="mb-8 text-3xl font-bold text-gray-900">Prendre un rendez-vous</h1>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                    Entrer l horaire souhaité
                  </label>
                  <input
                    id="datetime"
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getCurrentDateTime()}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Heures d ouverture: 8:00 - 17:00, dates futures uniquement
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 active:bg-[#2DD4BF]/80"
                  disabled={isRedirecting}
                >
                  {isRedirecting ? "Redirection en cours..." : "Soumettre"}
                </button>
              </form>
            </div>
          </div>
        </div>
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

