"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Header from "../header"
import Footer from "../footer"
import VerificationPopup from "./appointmentcancel"
import EditAppointmentForm from "./appointmentedit"
import axios from "axios"

interface Appointment {
  id: string
  date: string // or Date if it's already a Date object
  patient_id: string
  medecin_id: string
  note?: string
  status: string // Optional field
}
export default function AppointmentCalendar() {
  // Replace the static appointments array
  interface Appointment {
    id: number
    patient_id: number
    medecin_id: number
    date: string
    status: string
    note: string | null
  }
  
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medecinId, setMedecinId] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: number; date: string } | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)

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
console.log(medecinId)
  // Fetch appointments when medecinId is set
  useEffect(() => {
    if (!medecinId) return

    const fetchAppointments = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/appointments/medecin/${medecinId}`)
        setAppointments(response.data) // Store the list of appointments
      } catch (err) {
        setError("Error fetching appointments.")
        console.error(err)
      } 
    }

    fetchAppointments()
  }, [medecinId])
console.log(appointments)

const handleAccept = async (appointmentId: number) => {
  console.log("Attempting to confirm appointment:", appointmentId);

  try {
    const response = await axios.put(`http://localhost:8000/appointments/mconfirm/${appointmentId}`, {
      status: "confirmed",
    });

    console.log("Response from server:", response.data);

    setAppointments((prevAppointments) =>
      prevAppointments.map((a) =>
        a.id === appointmentId ? { ...a, status: "confirmed" } : a
      )
    );

    alert("Appointment confirmed successfully!");
  } catch (error) {
    console.error("Failed to confirm appointment:", );
  }
};

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

      // Optionally, update the local state to reflect the cancelled status
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) => (app.id === appointmentId ? { ...app, status: "cancelled" } : app)),
      )

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

  // Function to split date and time
  const splitDateTime = (dateTimeString: string) => {
    const [date, time] = dateTimeString.split("T")
    return { date, time: time.slice(0, 5) } // Assuming time is in HH:MM format
  }

  const [currentDate, setCurrentDate] = useState(new Date()) // Today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  useEffect(() => {
    fetchAppointmentsByDate(selectedDate)
  }, [selectedDate]) // Added selectedDate to dependencies

  // Fetch appointments for a specific date
  const fetchAppointmentsByDate = async (date: Date) => {
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

      setAppointments(transformedData)
    } catch (err) {
      // For any exception, just set empty appointments instead of showing error
      console.error("Error fetching appointments:", err)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <button onClick={prevPeriod} className="p-2 rounded-full hover:bg-gray-200" aria-label="Previous period">
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              <h2 className="text-lg font-medium text-gray-900">{formatMonthYear(currentDate)}</h2>

              <div className="flex items-center space-x-2">
                <div className="bg-gray-700 text-white w-8 h-8 rounded-md flex items-center justify-center font-medium">
                  W
                </div>
                <button onClick={nextPeriod} className="p-2 rounded-full hover:bg-gray-200" aria-label="Next period">
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Week view */}
            <div className="grid grid-cols-7 text-center">
              {/* Day names */}
              {weekDays.map((date, index) => (
                <div key={index} className="py-3 border-b">
                  <div className="font-medium text-gray-900">{getDayName(date)}</div>
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
                    className="py-4 relative cursor-pointer"
                    onClick={() => {
                      setSelectedDate(date)
                      fetchAppointmentsByDate(date)
                    }}
                  >
                    <div
                      className={`
                      w-10 h-10 mx-auto flex items-center justify-center rounded-full
                      ${isSelected ? "bg-teal-500 text-white" : isTodayDate ? "border-2 border-teal-500" : "hover:bg-gray-100"}
                    `}
                    >
                      {date.getDate()}
                    </div>

                    {appointmentCount > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                        {appointmentCount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selected date display */}
            <div className="p-4 bg-white border-t">
              <div className="text-lg font-medium text-gray-900">
                {selectedDate.getDate()} {selectedDate.toLocaleDateString("en-US", { month: "long" })} /{" "}
                {selectedDate.getFullYear()}
              </div>
            </div>

            {/* New Table Layout for Appointments */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  {getAppointmentsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 italic text-center py-8">No appointments scheduled for this day.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Patient ID
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAppointmentsForDate(selectedDate).map((appointment) => {
                          const appointmentDate = new Date(appointment.date)
                          return (
                            <tr key={appointment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointmentDate.toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointmentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {appointment.patient_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                  {appointment.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
  {appointment.status === "waiting for medecin confirmation" ? (
    <>
      <button
        onClick={() => handleAccept(appointment.id)}
        className="mr-2 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
      >
        Accept
      </button>
      <button
        onClick={() => handleReject(appointment.id, appointment.date)}
        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
      >
        Reject
      </button>
    </>
  ) : appointment.status === "waiting for patient confirmation" ? (
    <>
      <button
        onClick={(event) => handleEdit(appointment, event)}
        className="mr-2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600"
      >
        Edit
      </button>
      <button
        onClick={() => handleReject(appointment.id, appointment.date)}
        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
      >
        Reject
      </button>
    </>
  ) : appointment.status === "confirmed" ? (
    <button
      onClick={(event) => handleEdit(appointment, event)}
      className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600"
    >
      Edit
    </button>
  ) : null}
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
      {/* Fixed Footer */}
      
      <div className="flex-shrink-0">

        <Footer />
      </div>
    </div>
  )
}

