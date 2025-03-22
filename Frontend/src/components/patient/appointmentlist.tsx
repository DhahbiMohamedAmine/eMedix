"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import VerificationPopup from "./appointmentcancel"
import EditAppointmentForm from "./appointmentedit"
import { AppointmentNotification } from "@/components/appointment-notification"
import { Trash2 } from "lucide-react"

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

interface Notification {
  appointmentId: number
  type: "approved" | "modified"
  read: boolean
  dismissed: boolean
  timestamp: number
}

// Define a type for the enhanced notification with appointment and doctor info
interface EnhancedNotification extends Notification {
  appointment: Appointment
  doctorName: string
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: number; date: string } | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [doctors, setDoctors] = useState<Record<number, Doctor>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const initialLoadDone = useRef(false)
  const lastAppointmentStatusesRef = useRef<Record<number, string>>({})

  // Add this function at the beginning of the component to help with debugging
  useEffect(() => {
    // Debug function to log the current state of notifications
    const logNotificationState = () => {
      const storedNotifications = localStorage.getItem("appointmentNotifications")
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications)
          console.log("Current notifications in localStorage:", parsedNotifications)
          console.log("Current notifications in state:", notifications)
          console.log("Current appointment statuses:", lastAppointmentStatusesRef.current)
        } catch (error) {
          console.error("Error parsing notifications for debug:", error)
        }
      } else {
        console.log("No notifications in localStorage")
      }
    }

    // Log on mount
    logNotificationState()

    // Set up interval to log periodically
    const debugInterval = setInterval(logNotificationState, 10000)

    return () => {
      clearInterval(debugInterval)
    }
  }, [notifications])

  // Load notifications from localStorage and mark them as read since we're on the appointments page
  useEffect(() => {
    const loadAndUpdateNotifications = () => {
      try {
        // Get notifications from localStorage
        const storedNotifications = localStorage.getItem("appointmentNotifications")
        if (!storedNotifications) return

        const parsedNotifications = JSON.parse(storedNotifications) as Notification[]

        // Mark all as read since we're on the appointments page
        // But keep dismissed status as is
        const updatedNotifications = parsedNotifications.map((n) => ({
          ...n,
          read: true,
          // Ensure dismissed is a boolean
          dismissed: !!n.dismissed,
        }))

        // Save back to localStorage
        localStorage.setItem("appointmentNotifications", JSON.stringify(updatedNotifications))

        // Update state with only non-dismissed notifications
        const activeNotifications = updatedNotifications.filter((n) => !n.dismissed)
        setNotifications(activeNotifications)

        // Notify header component
        window.dispatchEvent(new Event("appointmentNotificationsUpdated"))
      } catch (error) {
        console.error("Error processing notifications:", error)
      }
    }

    // Run once on mount
    loadAndUpdateNotifications()

    // Initialize the lastAppointmentStatusesRef with current appointments if available
    const initializeStatusTracking = async () => {
      try {
        const patientData = localStorage.getItem("patientData")
        if (!patientData) {
          console.log("No patient data found for status initialization")
          return
        }

        const { patient_id } = JSON.parse(patientData)
        if (!patient_id) {
          console.log("No patient ID found for status initialization")
          return
        }

        const response = await fetch(`http://localhost:8000/appointments/patient/${patient_id}`)
        if (!response.ok) {
          console.error("Failed to fetch appointments for status initialization")
          return
        }

        const data = await response.json()

        // Initialize the status tracking ref
        const initialStatuses: Record<number, string> = {}
        data.forEach((app: Appointment) => {
          initialStatuses[app.id] = app.status
        })

        console.log("Initialized appointment statuses:", initialStatuses)
        lastAppointmentStatusesRef.current = initialStatuses

        // Also store in localStorage for the header component to use
        localStorage.setItem("lastAppointmentStatuses", JSON.stringify(initialStatuses))
      } catch (error) {
        console.error("Error initializing appointment statuses:", error)
      }
    }

    initializeStatusTracking()
  }, []) // Empty dependency array means this runs once on mount

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

        // Check for status changes by comparing with last known statuses
        const currentStatuses: Record<number, string> = {}
        const statusChanges: Array<{ id: number; status: string; type: "approved" | "modified" }> = []

        data.forEach((app) => {
          currentStatuses[app.id] = app.status

          // If we have a previous status and it's different, record the change
          if (
            lastAppointmentStatusesRef.current[app.id] !== undefined &&
            lastAppointmentStatusesRef.current[app.id] !== app.status
          ) {
            console.log(
              `Status change detected for appointment ${app.id}: ${lastAppointmentStatusesRef.current[app.id]} -> ${app.status}`,
            )

            // Only notify about these specific status changes
            if (app.status === "confirmed" || app.status === "waiting for patient confirmation") {
              statusChanges.push({
                id: app.id,
                status: app.status,
                type: app.status === "confirmed" ? "approved" : "modified",
              })
            }
          } else if (lastAppointmentStatusesRef.current[app.id] === undefined) {
            // First time seeing this appointment, check if it's already in a notifiable state
            console.log(`New appointment detected: ${app.id} with status ${app.status}`)

            if (app.status === "confirmed" || app.status === "waiting for patient confirmation") {
              // Check if we already have a notification for this appointment
              const existingNotifications = JSON.parse(localStorage.getItem("appointmentNotifications") || "[]")
              const hasNotification = existingNotifications.some(
                (n: Notification) => n.appointmentId === app.id && !n.dismissed,
              )

              if (!hasNotification) {
                console.log(`Creating notification for new appointment ${app.id} with status ${app.status}`)
                statusChanges.push({
                  id: app.id,
                  status: app.status,
                  type: app.status === "confirmed" ? "approved" : "modified",
                })
              }
            }
          }
        })

        // Update the ref with current statuses for next comparison
        lastAppointmentStatusesRef.current = currentStatuses

        // Also store in localStorage for the header component to use
        localStorage.setItem("lastAppointmentStatuses", JSON.stringify(currentStatuses))

        // If we have status changes, create notifications
        if (statusChanges.length > 0 && isMounted) {
          console.log(`Creating ${statusChanges.length} new notifications for status changes:`, statusChanges)

          // Get existing notifications
          const existingNotifications = JSON.parse(localStorage.getItem("appointmentNotifications") || "[]")

          // Create new notifications for status changes
          const newNotifications = statusChanges.map((change) => ({
            appointmentId: change.id,
            type: change.type,
            read: false, // Not read yet
            dismissed: false,
            timestamp: Date.now(), // Add timestamp
          }))

          // Combine with existing, but first remove any duplicates for the same appointment
          // This ensures we only have only one notification per appointment
          const filteredExisting = existingNotifications.filter(
            (n: Notification) =>
              // Keep if it's for a different appointment
              !newNotifications.some((newN) => newN.appointmentId === n.appointmentId) &&
              // And it's not dismissed
              !n.dismissed,
          )

          const updatedNotifications = [...filteredExisting, ...newNotifications]
          console.log("Updated notifications:", updatedNotifications)

          // Update localStorage
          localStorage.setItem("appointmentNotifications", JSON.stringify(updatedNotifications))

          // Since we're on the appointments page, mark these as read immediately
          const readNotifications = updatedNotifications.map((n: Notification) => ({
            ...n,
            read: true, // Mark as read since we're on the appointments page
            dismissed: !!n.dismissed, // Ensure dismissed is a boolean
          }))

          localStorage.setItem("appointmentNotifications", JSON.stringify(readNotifications))
          setNotifications(readNotifications.filter((n) => !n.dismissed))

          // Notify header component
          window.dispatchEvent(new Event("appointmentNotificationsUpdated"))
        }

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

    // Set up polling to check for appointment changes
    const intervalId = setInterval(fetchAppointments, 10000) // Check every 10 seconds

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [doctors]) // Keep doctors in dependency array to update doctor info

  const handleAccept = async (id: number) => {
    try {
      // Make the API call to confirm the appointment
      const response = await fetch(`http://localhost:8000/appointments/pconfirm/${id}`, {
        method: "PUT",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to confirm appointment: ${errorData.detail || "Unknown error"}`)
      }

      // Update the local state to reflect the confirmed status
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) => (app.id === id ? { ...app, status: "confirmed" } : app)),
      )

      // Update lastAppointmentStatusesRef
      lastAppointmentStatusesRef.current = {
        ...lastAppointmentStatusesRef.current,
        [id]: "confirmed",
      }

      // Also update in localStorage
      localStorage.setItem("lastAppointmentStatuses", JSON.stringify(lastAppointmentStatusesRef.current))

      console.log(`Confirmed appointment ${id}`)
    } catch (error) {
      console.error("Error confirming appointment:", error)
      alert(`Error confirming appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleReject = (id: number, date: string) => {
    setSelectedAppointment({ id, date })
    setIsPopupOpen(true)
  }

  const handleEdit = (appointment: Appointment, event: React.MouseEvent) => {
    event.stopPropagation()
    setAppointmentToEdit(appointment)
    setIsEditFormOpen(true)
  }

  const confirmReject = async (appointmentId: number) => {
    try {
      // Make the API call to update the status
      const response = await fetch(`http://localhost:8000/appointments/cancelappointment/${appointmentId}`, {
        method: "PUT",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to cancel appointment: ${errorData.message || errorData.error || "Unknown error"}`)
      }

      // Update the local state to reflect the cancelled status
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) => (app.id === appointmentId ? { ...app, status: "cancelled" } : app)),
      )

      // Update lastAppointmentStatusesRef
      lastAppointmentStatusesRef.current = {
        ...lastAppointmentStatusesRef.current,
        [appointmentId]: "cancelled",
      }

      // Also update in localStorage
      localStorage.setItem("lastAppointmentStatuses", JSON.stringify(lastAppointmentStatusesRef.current))

      console.log(`Cancelled appointment ${appointmentId}`)
      setIsPopupOpen(false)
      setSelectedAppointment(null)
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert(`Error cancelling appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const cancelReject = () => {
    setIsPopupOpen(false)
    setSelectedAppointment(null)
  }

  const saveAppointment = async (updatedAppointment: Appointment) => {
    try {
      // Make API call to update the appointment using the correct endpoint
      const response = await fetch(`http://localhost:8000/appointments/pupdateappointment/${updatedAppointment.id}`, {
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

      // Update lastAppointmentStatusesRef
      lastAppointmentStatusesRef.current = {
        ...lastAppointmentStatusesRef.current,
        [updatedAppointment.id]: updatedData.status,
      }

      // Also update in localStorage
      localStorage.setItem("lastAppointmentStatuses", JSON.stringify(lastAppointmentStatusesRef.current))

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

  // Function to split date and time
  const splitDateTime = (dateTimeString: string) => {
    const [date, time] = dateTimeString.split("T")
    return { date, time: time.slice(0, 5) } // Assuming time is in HH:MM format
  }

  const dismissNotification = (appointmentId: number) => {
    try {
      // Get all notifications from localStorage
      const storedNotifications = localStorage.getItem("appointmentNotifications")
      if (!storedNotifications) return

      const allNotifications = JSON.parse(storedNotifications) as Notification[]

      // Update the specific notification
      const updatedAllNotifications = allNotifications.map((n) =>
        n.appointmentId === appointmentId ? { ...n, dismissed: true, read: true } : n,
      )

      // Save back to localStorage
      localStorage.setItem("appointmentNotifications", JSON.stringify(updatedAllNotifications))

      // Update local state - filter out the dismissed notification
      const updatedLocalNotifications = notifications.filter((n) => n.appointmentId !== appointmentId)
      setNotifications(updatedLocalNotifications)

      console.log(`Dismissed notification for appointment ${appointmentId}`)
      console.log("Updated notifications in localStorage:", updatedAllNotifications)
      console.log("Updated notifications in state:", updatedLocalNotifications)

      // Notify header component
      window.dispatchEvent(new Event("appointmentNotificationsUpdated"))
    } catch (error) {
      console.error("Error dismissing notification:", error)
    }
  }

  // For debugging - clear all notifications
  const clearAllNotifications = () => {
    localStorage.removeItem("appointmentNotifications")
    setNotifications([])
    console.log("All notifications cleared")

    // Notify header component
    window.dispatchEvent(new Event("appointmentNotificationsUpdated"))
  }

  // Filter active notifications (not dismissed)
  const activeNotifications = notifications
    .filter((n) => !n.dismissed)
    .map((notification) => {
      const appointment = appointments.find((app) => app.id === notification.appointmentId)
      if (!appointment) return null

      const doctor = doctors[appointment.medecin_id]
      if (!doctor) return null

      return {
        ...notification,
        appointment,
        doctorName: `${doctor.prenom} ${doctor.nom}`,
      }
    })
    .filter(Boolean) as EnhancedNotification[] // Cast to the proper type

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full h-full max-w-[95%] max-h-[95%] rounded-lg bg-white shadow-xl flex flex-col ">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-gradient-to-r from-cyan-500 to-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointments</span>
          </div>

          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/4 h-64 md:h-full relative bg-gradient-to-br from-cyan-500 to-[#2DD4BF]">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay">
                <Image
                  src="/images/cap1.png"
                  alt="Medical appointment illustration"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <h2 className="text-2xl font-bold mb-2">My Appointments</h2>
                <p className="text-center text-white/80">
                  Manage your medical appointments and stay updated with your healthcare schedule
                </p>

                {/* Clear notifications button - only visible in development or when there are notifications */}
                {(process.env.NODE_ENV === "development" || activeNotifications.length > 0) && (
                  <button
                    onClick={clearAllNotifications}
                    className="mt-6 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear notifications
                  </button>
                )}
              </div>
            </div>

            <div className="w-full md:w-3/4 p-4 md:p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Appointment Schedule</h1>
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#2DD4BF]"></div>
                </div>
              )}

              {/* Notifications section - keep this part as is to maintain the notification logic */}
              {activeNotifications.length > 0 && (
                <div className="mb-6 space-y-4">
                  {activeNotifications.map((notification, index) => (
                    <AppointmentNotification
                      key={`${notification.appointmentId}-${index}`}
                      type={notification.type}
                      appointmentDate={notification.appointment.date}
                      doctorName={notification.doctorName}
                      onDismiss={() => dismissNotification(notification.appointmentId)}
                    />
                  ))}
                </div>
              )}

              <div className="overflow-auto flex-grow">
                {!isLoading && appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-600">No upcoming appointments found</p>
                    <p className="text-sm text-gray-500 mt-1">Schedule an appointment to get started</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-4 font-medium">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-4 font-medium">
                            Time
                          </th>
                          <th scope="col" className="px-6 py-4 font-medium">
                            Doctor
                          </th>
                          <th scope="col" className="px-6 py-4 font-medium">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-4 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {appointments
                          .filter((appointment) => {
                            // Filter out past appointments
                            const appointmentDate = new Date(appointment.date)
                            const now = new Date()
                            return appointmentDate >= now
                          })
                          .sort((a, b) => {
                            // Sort by date (ascending)
                            return new Date(a.date).getTime() - new Date(b.date).getTime()
                          })
                          .map((appointment) => {
                            const { date, time } = splitDateTime(appointment.date)
                            // Check if this appointment has a new notification
                            const hasNotification = notifications.some(
                              (n) => n.appointmentId === appointment.id && !n.dismissed,
                            )

                            return (
                              <tr
                                key={appointment.id}
                                className={`${
                                  hasNotification
                                    ? "bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500"
                                    : "hover:bg-gray-50"
                                } transition-colors`}
                              >
                                <td className="px-6 py-4 font-medium text-gray-900">{date}</td>
                                <td className="px-6 py-4 text-gray-700">{time}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                      {doctors[appointment.medecin_id]
                                        ? doctors[appointment.medecin_id].prenom.charAt(0) +
                                          doctors[appointment.medecin_id].nom.charAt(0)
                                        : "DR"}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {doctors[appointment.medecin_id]
                                        ? `Dr. ${doctors[appointment.medecin_id].prenom} ${doctors[appointment.medecin_id].nom}`
                                        : `Doctor #${appointment.medecin_id}`}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                      appointment.status === "confirmed"
                                        ? "bg-green-100 text-green-800"
                                        : appointment.status === "pending"
                                          ? "bg-orange-100 text-orange-800"
                                          : appointment.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : appointment.status === "waiting for patient confirmation"
                                              ? "bg-amber-100 text-amber-800"
                                              : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    <span
                                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                        appointment.status === "confirmed"
                                          ? "bg-green-600"
                                          : appointment.status === "pending"
                                            ? "bg-orange-600"
                                            : appointment.status === "cancelled"
                                              ? "bg-red-600"
                                              : appointment.status === "waiting for patient confirmation"
                                                ? "bg-amber-600"
                                                : "bg-gray-600"
                                      }`}
                                    ></span>
                                    {appointment.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex space-x-2">
                                    {appointment.status === "waiting for patient confirmation" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAccept(appointment.id)
                                        }}
                                        className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3.5 w-3.5 mr-1.5"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Accept
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(appointment, e)
                                      }}
                                      className="inline-flex items-center rounded-md bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3.5 w-3.5 mr-1.5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleReject(appointment.id, appointment.date)
                                      }}
                                      className="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3.5 w-3.5 mr-1.5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <VerificationPopup
        isOpen={isPopupOpen}
        appointmentId={selectedAppointment?.id || null}
        appointmentName={selectedAppointment?.date || ""}
        onConfirm={confirmReject}
        onCancel={cancelReject}
      />

      <EditAppointmentForm
        isOpen={isEditFormOpen}
        appointment={appointmentToEdit}
        onSave={saveAppointment}
        onCancel={cancelEdit}
      />
      <Footer />
    </main>
  )
}

