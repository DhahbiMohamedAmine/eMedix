import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useEffect, useState } from "react"
import axios from "axios"
import VerificationPopup from "./appointmentcancel"
import EditAppointmentForm from "./appointmentedit"

export default function AppointmentList() {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      } finally {
        setLoading(false)
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

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointments</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left side - Image */}
            <div className="w-full md:w-1/3 h-64 md:h-auto relative">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            {/* Right side - Appointment List */}
            <div className="w-full md:w-2/3 p-8">
              <h1 className="mb-6 text-3xl font-bold text-gray-900">Liste des rendez-vous</h1>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                    
                      <th className="px-4 py-3">id</th>
                      <th className="px-4 py-3">doctor id</th>
                      <th className="px-4 py-3">date</th>
                      <th className="px-4 py-3">status</th>
                      <th className="px-4 py-3">action</th>
                    </tr>
                  </thead>
                  <tbody>
  {appointments.map((appointment) => (
    <tr key={appointment.id} className="border-b bg-white">
      <td className="px-4 py-4">{appointment.id}</td>
      <td className="px-4 py-4">{appointment.patient_id}</td>
      <td className="px-4 py-4">{appointment.date}</td>
      <td className="px-4 py-4">{appointment.status}</td>
      <td className="px-4 py-4">{appointment.note}</td>
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
  ))}
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
