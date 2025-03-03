import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import VerificationPopup from "./appointmentcancel"
import EditAppointmentForm from "./appointmentedit"

interface Appointment {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  status: string
  note: string | null
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: number; date: string } | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
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
        const data = await response.json()
        setAppointments(data)
      } catch (error) {
        console.error("Error fetching appointments:", error)
      }
    }

    fetchAppointments()
  }, [])

  const handleAccept = (id: number) => {
    console.log(`Accepted appointment ${id}`)
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
        throw new Error(
          `Failed to cancel appointment: ${errorData.message || errorData.error || "Unknown error"}`
        )
      }

      // Optionally, update the local state to reflect the cancelled status
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) =>
          app.id === appointmentId ? { ...app, status: "cancelled" } : app
        )
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
      const response = await fetch(`http://localhost:8000/appointments/updateappointment/${updatedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAppointment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update appointment: ${errorData.message || errorData.error || 'Unknown error'}`)
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
      alert(`Error updating appointment: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full h-full max-w-[95%] max-h-[95%] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointments</span>
          </div>

          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/4 h-64 md:h-full relative">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            <div className="w-full md:w-3/4 p-4 md:p-6 flex flex-col h-full">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Liste des rendez-vous</h1>

              <div className="overflow-auto flex-grow">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">Date</th>
                      <th scope="col" className="px-4 py-3">Time</th>
                      <th scope="col" className="px-4 py-3">Medecin ID</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => {
                      const { date, time } = splitDateTime(appointment.date)
                      return (
                        <tr
                          key={appointment.id}
                          className="border-b bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-4">{date}</td>
                          <td className="px-4 py-4">{time}</td>
                          <td className="px-4 py-4">{appointment.medecin_id}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "pending"
                                    ? "bg-orange-100 text-orange-800"
                                    : appointment.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 flex">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAccept(appointment.id)
                              }}
                              className="mr-2 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(appointment, e)
                              }}
                              className="mr-2 rounded-full bg-[#2DD4BF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReject(appointment.id, appointment.date)
                              }}
                              className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
