/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, User, FileText } from "lucide-react"
import Header from "./header"
import Footer from "../footer"
import EditAppointmentForm from "./appointmentedit"
import PatientDetailsPopup from "./patientdetails"
import AppointmentNotePopup from "./note"
import PrescriptionForm from "./prescription-form"
import PrescriptionDetails from "./prescription-details" // Import the new component
import axios from "axios"
import dayjs from "dayjs"
import "dayjs/locale/en-gb"
import localizedFormat from "dayjs/plugin/localizedFormat"
dayjs.extend(localizedFormat)
dayjs.locale("en-gb")

export default function AppointmentCalendar() {
  // Define the Appointment interface
  interface Appointment {
    id: number
    patient_id: number
    medecin_id: number
    date: string
    status: string
    note: string | null
    has_prescription?: boolean // Add this optional field
  }

  // Define the Patient interface
  interface Patient {
    nom: string
    prenom: string
    // Add other patient fields as needed
  }

  // Add these interfaces after the existing interfaces
  interface DoctorNotification {
    appointmentId: number
    type: "confirmed" | "modified" | "cancelled"
    read: boolean
    dismissed: boolean
    timestamp: number
    patientId: number
    appointmentDate: string
  }

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medecinId, setMedecinId] = useState<string | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)

  // New state for patient details popup
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

  const [isNotePopupOpen, setIsNotePopupOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Add state for prescription form
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false)
  const [appointmentForPrescription, setAppointmentForPrescription] = useState<Appointment | null>(null)

  // Add state for prescription details
  const [isPrescriptionDetailsOpen, setIsPrescriptionDetailsOpen] = useState(false)
  const [appointmentForPrescriptionDetails, setAppointmentForPrescriptionDetails] = useState<number | null>(null)

  // Add a state to track the highlighted appointment
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null)

  // Add a state to store patient information
  const [patients, setPatients] = useState<Record<number, Patient>>({})

  // Add a state to track appointments with prescriptions
  const [appointmentsWithPrescriptions, setAppointmentsWithPrescriptions] = useState<number[]>([])

  // Fetch medecinId from localStorage
  useEffect(() => {
    const storedMedecinData = localStorage.getItem("medecinData")
    if (storedMedecinData) {
      const parsedData = JSON.parse(storedMedecinData)
      if (parsedData.medecin_id) {
        setMedecinId(parsedData.medecin_id)
      }
    }
  }, [])

  // Make checkPrescriptionsForAppointments a useCallback function to avoid infinite loops
  const checkPrescriptionsForAppointments = useCallback(async (appointmentsList: Appointment[]) => {
    try {
      console.log("Checking prescriptions for appointments:", appointmentsList.length)
      const appointmentsWithPrescriptionsIds: number[] = []

      // For each finished appointment, check if it has a prescription
      const finishedAppointments = appointmentsList.filter((a) => a.status === "finished")
      console.log("Finished appointments:", finishedAppointments.length)

      for (const appointment of finishedAppointments) {
        try {
          console.log(`Checking prescription for appointment ${appointment.id}`)
          // Use the correct endpoint as specified by the user
          const response = await axios.get(`http://localhost:8000/prescriptions/${appointment.id}`)

          if (response.data && response.data.id) {
            console.log(`Found prescription for appointment ${appointment.id}:`, response.data.id)
            appointmentsWithPrescriptionsIds.push(appointment.id)
          }
        } catch (error) {
          // If there's an error or no prescription found, just continue
          console.log(`No prescription found for appointment ${appointment.id}`)
        }
      }

      console.log("Appointments with prescriptions:", appointmentsWithPrescriptionsIds)
      setAppointmentsWithPrescriptions(appointmentsWithPrescriptionsIds)

      // Update the appointments with the has_prescription flag
      setAppointments((prev) =>
        prev.map((appointment) => ({
          ...appointment,
          has_prescription: appointmentsWithPrescriptionsIds.includes(appointment.id),
        })),
      )
    } catch (error) {
      console.error("Error checking prescriptions:", error)
    }
  }, [])

  // Fetch appointments when medecinId is set
  useEffect(() => {
    if (!medecinId) return

    const fetchAppointments = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/appointments/medecin/${medecinId}`)
        setAppointments(response.data) // Store the list of appointments

        // Check which appointments have prescriptions
        checkPrescriptionsForAppointments(response.data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchAppointments()
  }, [medecinId, checkPrescriptionsForAppointments])

  // Function to fetch patient information
  const fetchPatientInfo = async (patientId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/users/patient/${patientId}`)
      if (response.data) {
        setPatients((prev) => ({
          ...prev,
          [patientId]: response.data,
        }))
      }
    } catch (err) {
      console.error(`Error fetching patient ${patientId} info:`, err)
    }
  }

  // Update the loadNotifications function to only mark notifications as read when explicitly viewing them
  const loadNotifications = () => {
    try {
      // We'll only mark notifications as read when the user explicitly views them
      // by clicking on a notification, not automatically when loading the calendar page

      // Check if we have a highlighted appointment ID from URL parameters
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const highlightParam = urlParams.get("highlight")

        if (highlightParam) {
          // If we have a highlighted appointment, mark only that notification as read
          const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
          if (storedNotifications) {
            const parsedNotifications = JSON.parse(storedNotifications) as DoctorNotification[]
            const appointmentId = Number.parseInt(highlightParam, 10)

            const updatedNotifications = parsedNotifications.map((n) =>
              n.appointmentId === appointmentId ? { ...n, read: true } : n,
            )

            localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedNotifications))

            // Notify header component
            window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))
          }
        }
      }
    } catch (error) {
      console.error("Error processing notifications:", error)
    }
  }

  // Add this function after the loadNotifications function
  const dismissNotification = (appointmentId: number) => {
    try {
      // Get all notifications from localStorage
      const storedNotifications = localStorage.getItem("doctorAppointmentNotifications")
      if (!storedNotifications) return

      const allNotifications = JSON.parse(storedNotifications) as DoctorNotification[]

      // Update the specific notification
      const updatedAllNotifications = allNotifications.map((n) =>
        n.appointmentId === appointmentId ? { ...n, dismissed: true, read: true } : n,
      )

      // Save back to localStorage
      localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(updatedAllNotifications))

      // Update local state - filter out the dismissed notification
      const updatedLocalNotifications = [] // notifications.filter((n) => n.appointmentId !== appointmentId)
      // setNotifications(updatedLocalNotifications)

      console.log(`Dismissed notification for appointment ${appointmentId}`)

      // Notify header component
      window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))
    } catch (error) {
      console.error("Error dismissing notification:", error)
    }
  }

  // Fetch patient information when appointments change
  useEffect(() => {
    // Get unique patient IDs from appointments
    const patientIds = [...new Set(appointments.map((app) => app.patient_id))]

    // Fetch info for each patient
    patientIds.forEach((patientId) => {
      if (!patients[patientId]) {
        fetchPatientInfo(patientId)
      }
    })
  }, [appointments, patients])

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    // Load notifications when component mounts
    loadNotifications()

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "doctorAppointmentNotifications") {
        loadNotifications()
      }
    }

    // Set up custom event listener for same-window updates
    const handleCustomEvent = () => {
      loadNotifications()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("doctorAppointmentNotificationsUpdated", handleCustomEvent)

    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("doctorAppointmentNotificationsUpdated", handleCustomEvent)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add this useEffect to get the highlighted appointment ID from URL or localStorage
  useEffect(() => {
    // Check URL parameters for highlighted appointment
    if (typeof window !== "undefined") {
      console.log("Checking URL parameters for highlighted appointment and date")
      const urlParams = new URLSearchParams(window.location.search)
      const highlightParam = urlParams.get("highlight")
      const dateParam = urlParams.get("date")

      console.log("URL parameters:", { highlight: highlightParam, date: dateParam })

      if (highlightParam) {
        const highlightId = Number.parseInt(highlightParam, 10)
        console.log("Setting highlighted appointment ID from URL:", highlightId)
        setHighlightedAppointmentId(highlightId)

        // After a delay, try to scroll to the highlighted appointment
        setTimeout(() => {
          const highlightedElement = document.querySelector(`[data-appointment-id="${highlightId}"]`)
          if (highlightedElement) {
            console.log("Scrolling to highlighted appointment element")
            highlightedElement.scrollIntoView({ behavior: "smooth", block: "center" })
          } else {
            console.log("Could not find highlighted appointment element")
          }
        }, 1000)
      } else {
        // Check localStorage for highlighted appointment
        const storedHighlight = localStorage.getItem("highlightedAppointmentId")
        if (storedHighlight) {
          const highlightId = Number.parseInt(storedHighlight, 10)
          console.log("Setting highlighted appointment ID from localStorage:", highlightId)
          setHighlightedAppointmentId(highlightId)
          // Clear it after setting
          localStorage.removeItem("highlightedAppointmentId")
        }
      }

      // Check URL for date parameter
      if (dateParam) {
        try {
          const paramDate = new Date(dateParam)
          if (!isNaN(paramDate.getTime())) {
            console.log("Setting selected date from URL:", paramDate.toISOString())
            setSelectedDate(paramDate)
            setCurrentDate(paramDate)
          }
        } catch (e) {
          console.error("Invalid date parameter:", e)
        }
      }
    }
  }, [])

  const handleAccept = async (appointmentId: number) => {
    console.log("Attempting to confirm appointment:", appointmentId)

    try {
      const response = await axios.put(`http://localhost:8000/appointments/mconfirm/${appointmentId}`, {
        status: "confirmed",
      })

      console.log("Response from server:", response.data)

      setAppointments((prevAppointments) =>
        prevAppointments.map((a) => (a.id === appointmentId ? { ...a, status: "confirmed" } : a)),
      )

      alert("Appointment confirmed successfully!")
    } catch (error) {
      console.error("Failed to confirm appointment:" + error)
    }
  }

  // New function to mark appointment as finished
  const handleFinishAppointment = async (appointmentId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log("Attempting to finish appointment:", appointmentId)

    try {
      const response = await axios.put(`http://localhost:8000/appointments/finish/${appointmentId}`)
      console.log("Response from server:", response.data)

      // Update the appointment status in the local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((a) => (a.id === appointmentId ? { ...a, status: "finished" } : a)),
      )

      // Find the appointment to open prescription form
      const appointment = appointments.find((a) => a.id === appointmentId)
      if (appointment) {
        setAppointmentForPrescription(appointment)
        setIsPrescriptionFormOpen(true)
      }

      alert("Appointment marked as finished!")
    } catch (error) {
      console.error("Failed to finish appointment:", error)
    }
  }

  // New function to view prescription details
  const handleViewPrescriptionDetails = (appointmentId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log("Opening prescription details for appointment:", appointmentId)

    // First check if we have the prescription in our state
    const appointmentWithPrescription = appointments.find(
      (a) => a.id === appointmentId && (a.has_prescription || appointmentsWithPrescriptions.includes(a.id)),
    )

    if (appointmentWithPrescription) {
      setAppointmentForPrescriptionDetails(appointmentId)
      setIsPrescriptionDetailsOpen(true)
    } else {
      // If we don't have it in state, try to fetch it
      axios
        .get(`http://localhost:8000/prescriptions/${appointmentId}`)
        .then((response) => {
          if (response.data && response.data.id) {
            // We found a prescription, update our state
            setAppointmentsWithPrescriptions((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]))
            setAppointmentForPrescriptionDetails(appointmentId)
            setIsPrescriptionDetailsOpen(true)
          } else {
            alert("No prescription found for this appointment.")
          }
        })
        .catch((error) => {
          console.error("Error fetching prescription:", error)
          alert("Failed to load prescription. Please try again.")
        })
    }
  }

  // New function to view patient details
  const handleViewPatientDetails = (patientId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedPatientId(patientId)
    setIsPatientDetailsOpen(true)
  }

  const handleEdit = (appointment: Appointment, event: React.MouseEvent) => {
    event.stopPropagation()
    setAppointmentToEdit(appointment)
    setIsEditFormOpen(true)
  }

  const saveAppointment = async (updatedAppointment: Appointment) => {
    try {
      // Make API call to update the appointment using the correct endpoint
      const response = await fetch(`http://localhost:8000/appointments/mupdateappointment/${updatedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAppointment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update appointment: ${errorData.message || errorData.error || "Unknown error"}`)
      }

      // Get the updated appointment from the response
      const updatedData = await response.json()

      // Update the local state with the updated appointment
      setAppointments(appointments.map((app) => (app.id === updatedAppointment.id ? updatedData : app)))

      console.log(`Updated appointment ${updatedAppointment.id}`, updatedData)
      setIsEditFormOpen(false)
      setAppointmentToEdit(null)
    } catch (error) {
      console.error("Error updating appointment:", error)
      alert(`Error updating appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const cancelEdit = () => {
    setIsEditFormOpen(false)
    setAppointmentToEdit(null)
  }

  const [currentDate, setCurrentDate] = useState(new Date()) // Today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Check if user is logged in
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) {
        setError("Please log in to view appointments")
      }
    }
  }, [])

  // Fetch appointments for a specific date - wrapped in useCallback to use in dependency array
  const fetchAppointmentsByDate = useCallback(
    async (date: Date) => {
      setIsLoading(true)
      setError(null)

      try {
        // Get medecin_id from localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const medecin_id = user.medecin_id

        if (!medecin_id) {
          setError("User not found or not logged in")
          setAppointments([])
          setIsLoading(false)
          return
        }

        // Format date as YYYY-MM-DD
        const year = date.getFullYear()
        const month = date.getMonth() + 1 // getMonth() is 0-indexed
        const day = date.getDate()
        const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

        // Create the filter object for the POST request
        const filter = {
          medecin_id: medecin_id,
          date: formattedDate,
        }

        // Make POST request to the backend endpoint
        const response = await fetch("http://localhost:8000/appointments/bydate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filter),
        })

        // Handle all non-200 responses here
        if (!response.ok) {
          // If it's a 404, we treat it as "no appointments" rather than an error
          if (response.status === 404) {
            setAppointments([])
            setIsLoading(false)
            return
          }

          // For status 500 or any other error, we'll also set empty appointments
          // instead of showing an error message
          setAppointments([])
          setIsLoading(false)
          return
        }

        const data = await response.json()

        // If data is empty array or null/undefined, handle it gracefully
        if (!data || data.length === 0) {
          setAppointments([])
          setIsLoading(false)
          return
        }

        // Transform the data to include name, reason, and time for display
        const transformedData = data.map((appointment: Appointment) => {
          // Extract time from the date
          const appointmentDate = new Date(appointment.date)
          const time = appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

          return {
            ...appointment,
            // These are placeholders - in a real app you would get this data from the API
            name: `Patient #${appointment.patient_id}`,
            reason: appointment.note || "Appointment",
            time: time,
          }
        })

        const appointmentsData = transformedData
        setAppointments(appointmentsData)

        // Check which appointments have prescriptions
        checkPrescriptionsForAppointments(appointmentsData)
      } catch (err) {
        // For any exception, just set empty appointments instead of showing error
        console.error("Error fetching appointments:", err)
        setAppointments([])
      } finally {
        setIsLoading(false)
      }
    },
    [checkPrescriptionsForAppointments],
  ) // Add checkPrescriptionsForAppointments to the dependency array

  useEffect(() => {
    fetchAppointmentsByDate(selectedDate)
  }, [selectedDate, fetchAppointmentsByDate]) // Added fetchAppointmentsByDate to dependencies

  // Add an event listener for prescription creation
  useEffect(() => {
    // Set up event listener for prescription creation
    const handlePrescriptionCreated = (event: Event) => {
      console.log("Prescription created event detected")

      // Check if it's a CustomEvent with detail
      if (event instanceof CustomEvent && event.detail) {
        console.log("Prescription created for appointment:", event.detail.appointmentId)

        // Immediately update the local state to show the prescription button
        setAppointmentsWithPrescriptions((prev) => {
          if (!prev.includes(event.detail.appointmentId)) {
            return [...prev, event.detail.appointmentId]
          }
          return prev
        })

        // Also update the appointment's has_prescription flag
        setAppointments((prev) =>
          prev.map((app) => (app.id === event.detail.appointmentId ? { ...app, has_prescription: true } : app)),
        )
      }

      // Refresh appointments to update prescription status
      fetchAppointmentsByDate(selectedDate)
    }

    window.addEventListener("prescriptionCreated", handlePrescriptionCreated)

    return () => {
      window.removeEventListener("prescriptionCreated", handlePrescriptionCreated)
    }
  }, [fetchAppointmentsByDate, selectedDate])

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    // Create date strings in YYYY-MM-DD format without timezone conversion
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const dateString = `${year}-${month}-${day}`

    return appointments.filter((appointment) => {
      // Parse the appointment date and extract just the date part
      const appointmentDate = new Date(appointment.date)
      const appointmentYear = appointmentDate.getFullYear()
      const appointmentMonth = (appointmentDate.getMonth() + 1).toString().padStart(2, "0")
      const appointmentDay = appointmentDate.getDate().toString().padStart(2, "0")
      const appointmentDateStr = `${appointmentYear}-${appointmentMonth}-${appointmentDay}`

      return appointmentDateStr === dateString
    })
  }

  // Get appointment count for a specific date
  const getAppointmentCountForDate = (date: Date) => {
    return getAppointmentsForDate(date).length
  }

  // Navigate to previous week/month
  const prevPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  // Navigate to next week/month
  const nextPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  // Format month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Generate days for the current week view
  const generateWeekDays = () => {
    const days = []
    // Find the Monday of the current week
    const firstDay = new Date(currentDate)
    const day = currentDate.getDay()
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    firstDay.setDate(diff)

    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay)
      date.setDate(firstDay.getDate() + i)
      days.push(date)
    }

    return days
  }

  // Get the days of the week
  const weekDays = generateWeekDays()

  // Get the day name (3 letters)
  const getDayName = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[date.getDay()]
  }

  // Check if a date is the selected date
  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleOpenNotePopup = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsNotePopupOpen(true)
  }

  const handleNoteUpdate = async (appointmentId: number, newNote: string) => {
    try {
      // Update the appointments state with the new note
      setAppointments(appointments.map((app) => (app.id === appointmentId ? { ...app, note: newNote } : app)))
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  // Add a helper function to check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time part for date comparison
    return date < today
  }

  // Function to check if an appointment has a prescription
  const hasPrescription = (appointmentId: number): boolean => {
    // Check both the state array and the appointment's has_prescription property
    const appointment = appointments.find((a) => a.id === appointmentId)
    const hasFlag = appointment?.has_prescription === true
    const inArray = appointmentsWithPrescriptions.includes(appointmentId)
    console.log(`Checking if appointment ${appointmentId} has prescription:`, { hasFlag, inArray })
    return hasFlag || inArray
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            {/* Calendar header */}
            <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100">
              <button
                onClick={prevPeriod}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Previous period"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              <h2 className="text-xl font-semibold text-gray-900">{formatMonthYear(currentDate)}</h2>

              <div className="flex items-center space-x-3">
                <div className="bg-teal-600 text-white w-8 h-8 rounded-md flex items-center justify-center font-medium shadow-sm">
                  W
                </div>
                <button
                  onClick={nextPeriod}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Next period"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Week view */}
            <div className="grid grid-cols-7 text-center">
              {/* Day names */}
              {weekDays.map((date, index) => (
                <div key={index} className="py-4 border-b border-gray-100">
                  <div className="font-medium text-gray-700">{getDayName(date)}</div>
                </div>
              ))}

              {/* Day numbers */}
              {weekDays.map((date, index) => {
                const appointmentCount = getAppointmentCountForDate(date)
                const isSelected = isSelectedDate(date)
                const isTodayDate = isToday(date)

                return (
                  <div
                    key={`day-${index}`}
                    className="py-5 relative cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSelectedDate(date)
                      fetchAppointmentsByDate(date)
                    }}
                  >
                    <div
                      className={`w-11 h-11 mx-auto flex items-center justify-center rounded-full transition-all
          ${
            isSelected
              ? "bg-teal-500 text-white shadow-md"
              : isTodayDate
                ? "border-2 border-teal-500 text-teal-700"
                : "hover:bg-gray-100"
          }`}
                    >
                      {date.getDate()}
                    </div>

                    {appointmentCount > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                        <span
                          className={`px-2 py-0.5 rounded-full ${isSelected ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-800"}`}
                        >
                          {appointmentCount}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selected date display */}
            <div className="p-5 bg-gray-50 border-t border-b border-gray-100">
              <div className="text-xl font-semibold text-gray-900">
                {selectedDate.getDate()} {selectedDate.toLocaleDateString("en-US", { month: "long" })} /{" "}
                {selectedDate.getFullYear()}
              </div>
            </div>

            {/* New Table Layout for Appointments */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  {getAppointmentsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-gray-500 text-lg">No appointments scheduled for this day.</p>
                      <p className="text-gray-400 text-sm mt-2">Select another date to view appointments.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Patient Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAppointmentsForDate(selectedDate).map((appointment) => {
                          const appointmentDate = new Date(appointment.date)
                          const isPastAppointment = isDateInPast(appointmentDate)
                          const isHighlighted = appointment.id === highlightedAppointmentId
                          const appointmentHasPrescription =
                            appointment.has_prescription || hasPrescription(appointment.id)

                          return (
                            <tr
                              key={appointment.id}
                              data-appointment-id={appointment.id}
                              className={`transition-all duration-300 ${
                                isHighlighted
                                  ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                                  : "hover:bg-gray-50"
                              }`}
                              ref={(el) => {
                                // Scroll to the highlighted appointment
                                if (isHighlighted && el) {
                                  setTimeout(() => {
                                    console.log("Scrolling to highlighted appointment:", appointment.id)
                                    el.scrollIntoView({ behavior: "smooth", block: "center" })
                                  }, 500)
                                }
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointmentDate.toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {patients[appointment.patient_id]
                                  ? `${patients[appointment.patient_id].prenom} ${patients[appointment.patient_id].nom}`
                                  : `Patient #${appointment.patient_id}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    isHighlighted
                                      ? appointment.status === "confirmed"
                                        ? "bg-green-200 text-green-800"
                                        : appointment.status === "cancelled"
                                          ? "bg-red-200 text-red-800"
                                          : "bg-amber-200 text-amber-800"
                                      : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {appointment.status}
                                </span>
                                {appointment.status === "finished" && (
                                  <button
                                    onClick={(event) => handleViewPrescriptionDetails(appointment.id, event)}
                                    className="ml-2 rounded-full bg-teal-500 px-4 py-1 text-xs font-semibold text-white hover:bg-teal-600 transition-colors flex items-center shadow-sm"
                                  >
                                    <FileText className="w-3 h-3 mr-1" />
                                    View Prescription
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-2">
                                  {isPastAppointment ? (
                                    // Show User Details and Add Note buttons for past appointments
                                    <>
                                      <button
                                        onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                        className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                      >
                                        <User className="w-3 h-3 mr-1" />
                                        User Details
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenNotePopup(appointment)
                                        }}
                                        className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                      >
                                        Add Note
                                      </button>
                                    </>
                                  ) : (
                                    // Show all buttons for current or future appointments
                                    <>
                                      {appointment.status === "waiting for medecin confirmation" ? (
                                        <>
                                          <button
                                            onClick={() => handleAccept(appointment.id)}
                                            className="rounded-full bg-green-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors shadow-sm"
                                          >
                                            Accept
                                          </button>
                                          <button
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                          >
                                            <User className="w-3 h-3 mr-1" />
                                            User Details
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                          >
                                            Add Note
                                          </button>
                                        </>
                                      ) : appointment.status === "waiting for patient confirmation" ? (
                                        <>
                                          <button
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                          >
                                            <User className="w-3 h-3 mr-1" />
                                            User Details
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                          >
                                            Add Note
                                          </button>
                                        </>
                                      ) : appointment.status === "confirmed" ? (
                                        <>
                                          <button
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                          >
                                            <User className="w-3 h-3 mr-1" />
                                            User Details
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                          >
                                            Add Note
                                          </button>
                                          {/* Add Finished button for confirmed appointments */}
                                          <button
                                            onClick={(event) => handleFinishAppointment(appointment.id, event)}
                                            className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-sm flex items-center"
                                          >
                                            <FileText className="w-3 h-3 mr-1" />
                                            Finished
                                          </button>
                                        </>
                                      ) : appointment.status === "finished" ? (
                                        <>
                                          <button
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                          >
                                            <User className="w-3 h-3 mr-1" />
                                            User Details
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                          >
                                            Add Note
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="rounded-full bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors flex items-center shadow-sm"
                                          >
                                            <User className="w-3 h-3 mr-1" />
                                            User Details
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                                          >
                                            Add Note
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Patient Details Popup */}
      <PatientDetailsPopup
        isOpen={isPatientDetailsOpen}
        patientId={selectedPatientId}
        onClose={() => setIsPatientDetailsOpen(false)}
      />

      {/* Edit Appointment Form */}
      <EditAppointmentForm
        isOpen={isEditFormOpen}
        appointment={appointmentToEdit}
        onSave={saveAppointment}
        onCancel={cancelEdit}
      />

      {/* Appointment Note Popup */}
      <AppointmentNotePopup
        isOpen={isNotePopupOpen}
        appointment={selectedAppointment}
        onClose={() => setIsNotePopupOpen(false)}
        onNoteUpdate={handleNoteUpdate}
      />

      {/* Prescription Form */}
      {isPrescriptionFormOpen && appointmentForPrescription && (
        <PrescriptionForm
          isOpen={isPrescriptionFormOpen}
          appointment={appointmentForPrescription}
          onClose={() => {
            setIsPrescriptionFormOpen(false)
            // After closing the prescription form, refresh the appointments to check for new prescriptions
            fetchAppointmentsByDate(selectedDate)
          }}
        />
      )}

      {/* Prescription Details */}
      {isPrescriptionDetailsOpen && appointmentForPrescriptionDetails && (
        <PrescriptionDetails
          appointmentId={appointmentForPrescriptionDetails}
          onClose={() => {
            setIsPrescriptionDetailsOpen(false)
            setAppointmentForPrescriptionDetails(null)
          }}
        />
      )}

      {/* Fixed Footer */}
      <div className="flex-shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  )
}
