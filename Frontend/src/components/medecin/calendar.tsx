/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, User, FileText, Calendar, CheckCircle, AlertCircle, X } from "lucide-react"
import Header from "./header"
import Footer from "../footer"
import EditAppointmentForm from "./appointmentedit"
import PatientDetailsPopup from "./patientdetails"
import AppointmentNotePopup from "./note"
import PrescriptionForm from "./prescription-form"
import PrescriptionDetails from "./prescription-details"
import axios from "axios"
import dayjs from "dayjs"
import "dayjs/locale/en-gb"
import localizedFormat from "dayjs/plugin/localizedFormat"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
    has_prescription?: boolean
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
    type: "confirmed" | "modified" | "cancelled" | "new"
    read: boolean
    dismissed: boolean
    timestamp: number
    patientId: number
    appointmentDate: string
  }

  // Define notification interface
  interface Notification {
    id: string
    message: string
    type: "success" | "error" | "warning" | "info"
    duration?: number
  }

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medecinId, setMedecinId] = useState<string | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  const [isNotePopupOpen, setIsNotePopupOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false)
  const [appointmentForPrescription, setAppointmentForPrescription] = useState<Appointment | null>(null)
  const [isPrescriptionDetailsOpen, setIsPrescriptionDetailsOpen] = useState(false)
  const [appointmentForPrescriptionDetails, setAppointmentForPrescriptionDetails] = useState<number | null>(null)
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<number | null>(null)
  const [patients, setPatients] = useState<Record<number, Patient>>({})
  const [appointmentsWithPrescriptions, setAppointmentsWithPrescriptions] = useState<number[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Use refs to track processed notifications to prevent duplicates
  const processedNotificationsRef = useRef<Set<string>>(new Set())
  const lastAppointmentStatusRef = useRef<Map<number, string>>(new Map())

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Function to show notifications
  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    duration = 5000,
  ) => {
    const id = Date.now().toString()
    const newNotification = { id, message, type, duration }

    setNotifications((prev) => [...prev, newNotification])

    // Auto-dismiss after duration
    if (duration) {
      setTimeout(() => {
        dismissNotification(id)
      }, duration)
    }
  }

  // Function to dismiss a notification
  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Function to create a notification for the patient
  const createPatientNotification = (
    appointmentId: number,
    type: "confirmed" | "modified" | "cancelled" | "finished",
  ) => {
    try {
      // Get the appointment details
      const appointment = appointments.find((a) => a.id === appointmentId)
      if (!appointment) return

      // Get the patient ID
      const patientId = appointment.patient_id

      // Create a notification object
      const notification = {
        appointmentId,
        type,
        read: false,
        dismissed: false,
        timestamp: Date.now(),
        patientId,
        appointmentDate: appointment.date,
      }

      // Store the notification in localStorage
      const storedNotifications = localStorage.getItem("patientAppointmentNotifications") || "[]"
      const parsedNotifications = JSON.parse(storedNotifications)

      // Add the new notification
      parsedNotifications.push(notification)

      // Save back to localStorage
      localStorage.setItem("patientAppointmentNotifications", JSON.stringify(parsedNotifications))

      // Dispatch an event to notify other components
      window.dispatchEvent(new Event("patientAppointmentNotificationsUpdated"))

      console.log(`Created ${type} notification for patient ${patientId} for appointment ${appointmentId}`)
    } catch (error) {
      console.error("Error creating patient notification:", error)
    }
  }

  // Improved function to handle doctor notifications with better deduplication
  const createDoctorNotification = useCallback(
    (
      appointmentId: number,
      type: "new" | "cancelled" | "confirmed" | "modified",
      patientId: number,
      appointmentDate: string,
    ) => {
      try {
        // Create a unique key for this notification
        const notificationKey = `${appointmentId}-${type}`

        // Check if we've already processed this notification
        if (processedNotificationsRef.current.has(notificationKey)) {
          console.log(`Notification ${notificationKey} already processed, skipping`)
          return
        }

        // Create a notification object for the doctor
        const notification = {
          appointmentId,
          type,
          read: false,
          dismissed: false,
          timestamp: Date.now(),
          patientId,
          appointmentDate,
        }

        // Store the notification in localStorage
        const storedNotifications = localStorage.getItem("doctorAppointmentNotifications") || "[]"
        const parsedNotifications = JSON.parse(storedNotifications)

        // Check if a notification for this appointment and type already exists
        const existingNotificationIndex = parsedNotifications.findIndex(
          (n: any) => n.appointmentId === appointmentId && n.type === type,
        )

        // Only add if it doesn't exist
        if (existingNotificationIndex === -1) {
          // Add the new notification
          parsedNotifications.push(notification)

          // Save back to localStorage
          localStorage.setItem("doctorAppointmentNotifications", JSON.stringify(parsedNotifications))

          // Dispatch an event to notify other components
          window.dispatchEvent(new Event("doctorAppointmentNotificationsUpdated"))

          console.log(`Created ${type} appointment notification for doctor for appointment ${appointmentId}`)

          // Mark this notification as processed
          processedNotificationsRef.current.add(notificationKey)
        } else {
          console.log(`Notification for appointment ${appointmentId} and type ${type} already exists`)
        }
      } catch (error) {
        console.error("Error creating doctor notification:", error)
      }
    },
    [],
  )

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

  // Improved function to check for status changes and create notifications
  const checkForStatusChanges = useCallback(
    (newAppointments: Appointment[]) => {
      newAppointments.forEach((appointment) => {
        const previousStatus = lastAppointmentStatusRef.current.get(appointment.id)
        const currentStatus = appointment.status

        // If this is the first time we see this appointment, just record its status
        if (previousStatus === undefined) {
          lastAppointmentStatusRef.current.set(appointment.id, currentStatus)

          // Only create notification for new appointments waiting for confirmation
          if (currentStatus === "waiting for medecin confirmation") {
            createDoctorNotification(appointment.id, "new", appointment.patient_id, appointment.date)
          }
          return
        }

        // If status has changed, create appropriate notification
        if (previousStatus !== currentStatus) {
          console.log(`Status changed for appointment ${appointment.id}: ${previousStatus} -> ${currentStatus}`)

          // Update the stored status
          lastAppointmentStatusRef.current.set(appointment.id, currentStatus)

          // Create notifications based on status change
          switch (currentStatus) {
            case "waiting for medecin confirmation":
              createDoctorNotification(appointment.id, "new", appointment.patient_id, appointment.date)
              break
            case "cancelled":
              createDoctorNotification(appointment.id, "cancelled", appointment.patient_id, appointment.date)
              break
            case "confirmed":
              // Only create notification if it was previously waiting for confirmation
              if (previousStatus === "waiting for medecin confirmation") {
                createPatientNotification(appointment.id, "confirmed")
              }
              break
            case "finished":
              createPatientNotification(appointment.id, "finished")
              break
          }
        }
      })
    },
    [createDoctorNotification],
  )

  // Fetch appointments when medecinId is set
  useEffect(() => {
    if (!medecinId) return

    const fetchAppointments = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/appointments/medecin/${medecinId}`)
        const appointmentsData = response.data

        // Check for status changes and create notifications
        checkForStatusChanges(appointmentsData)

        setAppointments(appointmentsData) // Store the list of appointments

        // Check which appointments have prescriptions
        checkPrescriptionsForAppointments(appointmentsData)
      } catch (err) {
        console.error(err)
      }
    }

    fetchAppointments()
  }, [medecinId, checkPrescriptionsForAppointments, checkForStatusChanges])

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
  const dismissDoctorNotification = (appointmentId: number) => {
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

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("doctorAppointmentNotificationsUpdated", handleCustomEvent)
    }
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

      // Find the patient name for the local notification
      const appointment = appointments.find((a) => a.id === appointmentId)
      if (appointment && patients[appointment.patient_id]) {
        const patient = patients[appointment.patient_id]
        const patientName = `${patient.prenom} ${patient.nom}`
        showNotification(`Appointment with ${patientName} has been confirmed`, "success")

        // Create a notification for the patient only
        createPatientNotification(appointmentId, "confirmed")
      }
    } catch (error) {
      console.error("Failed to confirm appointment:" + error)
      showNotification("Failed to confirm appointment. Please try again.", "error")
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
        // Show success notification to the doctor only (not stored as a notification)
        const patientInfo = patients[appointment.patient_id]
        const patientName = patientInfo
          ? `${patientInfo.prenom} ${patientInfo.nom}`
          : `Patient #${appointment.patient_id}`

        showNotification(`Appointment with ${patientName} marked as finished!`, "success")

        // Create a notification for the patient only
        createPatientNotification(appointmentId, "finished")

        setAppointmentForPrescription(appointment)
        setIsPrescriptionFormOpen(true)
      }
    } catch (error) {
      console.error("Failed to finish appointment:", error)
      showNotification("Failed to mark appointment as finished. Please try again.", "error")
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
            showNotification("No prescription found for this appointment.", "warning")
          }
        })
        .catch((error) => {
          console.error("Error fetching prescription:", error)
          showNotification("Failed to load prescription. Please try again.", "error")
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

      // Show success notification to the doctor only (not stored as a notification)
      showNotification("Appointment updated successfully!", "success")

      // Create a notification for the patient only
      createPatientNotification(updatedAppointment.id, "modified")
    } catch (error) {
      console.error("Error updating appointment:", error)
      showNotification(
        `Error updating appointment: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      )
    }
  }

  const cancelEdit = () => {
    setIsEditFormOpen(false)
    setAppointmentToEdit(null)
  }

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

        // Check for status changes and create notifications
        checkForStatusChanges(appointmentsData)

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
    [checkPrescriptionsForAppointments, checkForStatusChanges],
  )

  useEffect(() => {
    fetchAppointmentsByDate(selectedDate)
  }, [selectedDate, fetchAppointmentsByDate])

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

        // Show success notification
        showNotification("Prescription created successfully!", "success")
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
      showNotification("Note updated successfully!", "success")
    } catch (error) {
      console.error("Error updating note:", error)
      showNotification("Failed to update note. Please try again.", "error")
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

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500 hover:bg-green-600"
      case "finished":
        return "bg-blue-500 hover:bg-blue-600"
      case "cancelled":
        return "bg-red-500 hover:bg-red-600"
      case "waiting for medecin confirmation":
        return "bg-amber-500 hover:bg-amber-600"
      case "waiting for patient confirmation":
        return "bg-purple-500 hover:bg-purple-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Hero Section with Colorful Background */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Appointment Calendar</h1>
            <p className="text-primary-100 max-w-2xl mx-auto">
              Manage your appointments and patient schedules efficiently
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8">
        <Card className="overflow-hidden border border-primary-100 shadow-lg">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-5 bg-white border-b border-primary-100">
            <Button
              onClick={prevPeriod}
              variant="ghost"
              className="rounded-full hover:bg-primary-50 text-neutral-600"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <h2 className="text-xl font-semibold text-neutral-800">{formatMonthYear(currentDate)}</h2>

            <div className="flex items-center space-x-3">
              <div className="flex rounded-md overflow-hidden border border-primary-100">
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  className={`rounded-none ${viewMode === "week" ? "bg-primary-500 text-white" : "text-neutral-600 hover:bg-primary-50"}`}
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  className={`rounded-none ${viewMode === "month" ? "bg-primary-500 text-white" : "text-neutral-600 hover:bg-primary-50"}`}
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Button>
              </div>
              <Button
                onClick={nextPeriod}
                variant="ghost"
                className="rounded-full hover:bg-primary-50 text-neutral-600"
                aria-label="Next period"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Week view */}
          <div className="grid grid-cols-7 text-center">
            {/* Day names */}
            {weekDays.map((date, index) => (
              <div key={index} className="py-4 border-b border-primary-100 bg-primary-50">
                <div className="font-medium text-neutral-700">{getDayName(date)}</div>
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
                  className={`py-5 relative cursor-pointer transition-colors ${
                    isSelected ? "bg-primary-50" : "hover:bg-neutral-50"
                  }`}
                  onClick={() => {
                    setSelectedDate(date)
                    fetchAppointmentsByDate(date)
                  }}
                >
                  <div
                    className={`w-11 h-11 mx-auto flex items-center justify-center rounded-full transition-all
                      ${
                        isSelected
                          ? "bg-primary-500 text-white shadow-md"
                          : isTodayDate
                            ? "border-2 border-primary-500 text-primary-700"
                            : "hover:bg-primary-100"
                      }`}
                  >
                    {date.getDate()}
                  </div>

                  {appointmentCount > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-medium">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-primary-700 text-white" : "bg-primary-100 text-primary-800"
                        }`}
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
          <div className="p-5 bg-primary-50 border-t border-b border-primary-100">
            <div className="text-xl font-semibold text-neutral-800">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Appointments Table */}
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 text-center">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border border-primary-100">
                    <Calendar className="h-16 w-16 mx-auto text-primary-300 mb-4" />
                    <p className="text-neutral-700 text-lg font-medium">No appointments scheduled for this day</p>
                    <p className="text-neutral-500 text-sm mt-2">Select another date to view appointments</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-primary-100">
                    <table className="min-w-full divide-y divide-primary-100">
                      <thead className="bg-primary-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"
                          >
                            Patient Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-primary-100">
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
                                  : "hover:bg-neutral-50"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                                {appointmentDate.toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                                {appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-2">
                                    {patients[appointment.patient_id]?.prenom?.[0] || "?"}
                                    {patients[appointment.patient_id]?.nom?.[0] || "?"}
                                  </div>
                                  <span>
                                    {patients[appointment.patient_id]
                                      ? `${patients[appointment.patient_id].prenom} ${patients[appointment.patient_id].nom}`
                                      : `Patient #${appointment.patient_id}`}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getStatusBadgeColor(appointment.status)}>{appointment.status}</Badge>
                                {appointment.status === "finished" && appointmentHasPrescription && (
                                  <Badge className="ml-2 bg-secondary-500 hover:bg-secondary-600">
                                    Has Prescription
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-2">
                                  {isPastAppointment ? (
                                    // Show User Details and Add Note buttons for past appointments
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                      >
                                        <User className="w-3.5 h-3.5 mr-1" />
                                        Details
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenNotePopup(appointment)
                                        }}
                                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                      >
                                        Add Note
                                      </Button>
                                    </>
                                  ) : (
                                    // Show all buttons for current or future appointments
                                    <>
                                      {appointment.status === "waiting for medecin confirmation" ? (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={() => handleAccept(appointment.id)}
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                          >
                                            Accept
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                          >
                                            <User className="w-3.5 h-3.5 mr-1" />
                                            Details
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                          >
                                            Add Note
                                          </Button>
                                        </>
                                      ) : appointment.status === "waiting for patient confirmation" ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                          >
                                            <User className="w-3.5 h-3.5 mr-1" />
                                            Details
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                          >
                                            Add Note
                                          </Button>
                                        </>
                                      ) : appointment.status === "confirmed" ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleEdit(appointment, event)}
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                          >
                                            <User className="w-3.5 h-3.5 mr-1" />
                                            Details
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                          >
                                            Add Note
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={(event) => handleFinishAppointment(appointment.id, event)}
                                            className="bg-primary-500 hover:bg-primary-600 text-white"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                            Finish
                                          </Button>
                                        </>
                                      ) : appointment.status === "finished" ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                          >
                                            <User className="w-3.5 h-3.5 mr-1" />
                                            Details
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                          >
                                            Add Note
                                          </Button>
                                          {appointmentHasPrescription ? (
                                            <Button
                                              size="sm"
                                              onClick={(event) => handleViewPrescriptionDetails(appointment.id, event)}
                                              className="bg-secondary-500 hover:bg-secondary-600 text-white"
                                            >
                                              <FileText className="w-3.5 h-3.5 mr-1" />
                                              View Prescription
                                            </Button>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setAppointmentForPrescription(appointment)
                                                setIsPrescriptionFormOpen(true)
                                              }}
                                              className="bg-tertiary-500 hover:bg-tertiary-600 text-white"
                                            >
                                              <FileText className="w-3.5 h-3.5 mr-1" />
                                              Add Prescription
                                            </Button>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => handleViewPatientDetails(appointment.patient_id, event)}
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                          >
                                            <User className="w-3.5 h-3.5 mr-1" />
                                            Details
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleOpenNotePopup(appointment)
                                            }}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                          >
                                            Add Note
                                          </Button>
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
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between rounded-lg p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-5 ${
              notification.type === "success"
                ? "bg-green-50 text-green-800 border-l-4 border-green-500"
                : notification.type === "error"
                  ? "bg-re d-50 text-red-800 border-l-4 border-red-500"
                  : notification.type === "warning"
                    ? "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
                    : "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
            }`}
            style={{ minWidth: "320px", maxWidth: "420px" }}
          >
            <div className="flex items-center gap-3">
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : notification.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : notification.type === "warning" ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-4 rounded-full p-1 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 mt-auto">
        <Footer />
      </div>
    </div>
  )
}
