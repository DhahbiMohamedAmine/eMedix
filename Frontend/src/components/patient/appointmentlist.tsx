"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import VerificationPopup from "./appointmentcancel"
import EditAppointmentForm from "./appointmentedit"
import AppointmentDetailsPopup from "./appointmentdetails"


// Define the Appointment type
interface Appointment {
  id: number
  name: string
  date: string
  time: string
  reason: string
}

// Sample appointment data
const initialAppointments: Appointment[] = [
  { id: 1, name: "John Doe", date: "2023-06-15", time: "10:00", reason: "Check-up" },
  { id: 2, name: "Jane Smith", date: "2023-06-16", time: "14:30", reason: "Dental cleaning" },
  { id: 3, name: "Alice Johnson", date: "2023-06-17", time: "11:15", reason: "Eye exam" },
  { id: 4, name: "Bob Brown", date: "2023-06-18", time: "09:45", reason: "Physical therapy" },
  { id: 5, name: "Emma Wilson", date: "2023-06-19", time: "16:00", reason: "Vaccination" },
]

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: number; name: string } | null>(null)

  // Edit form state
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)

  // Details popup state
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false)
  const [appointmentToView, setAppointmentToView] = useState<Appointment | null>(null)

  const handleAccept = (id: number) => {
    // Placeholder function for accepting an appointment
    console.log(`Accepted appointment ${id}`)
  }

  const handleReject = (id: number, name: string) => {
    // Instead of immediately rejecting, open the verification popup
    setSelectedAppointment({ id, name })
    setIsPopupOpen(true)
  }

  const handleEdit = (appointment: Appointment, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row click event
    setAppointmentToEdit(appointment)
    setIsEditFormOpen(true)
  }

  const handleRowClick = (appointment: Appointment) => {
    setAppointmentToView(appointment)
    setIsDetailsPopupOpen(true)
  }

  const confirmReject = () => {
    if (selectedAppointment) {
      // Remove the appointment from the list
      setAppointments(appointments.filter((app) => app.id !== selectedAppointment.id))
      console.log(`Rejected appointment ${selectedAppointment.id}`)

      // Close the popup
      setIsPopupOpen(false)
      setSelectedAppointment(null)
    }
  }

  const cancelReject = () => {
    // Just close the popup without rejecting
    setIsPopupOpen(false)
    setSelectedAppointment(null)
  }

  const saveAppointment = (updatedAppointment: Appointment) => {
    // Update the appointment in the list
    setAppointments(appointments.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app)))
    console.log(`Updated appointment ${updatedAppointment.id}`, updatedAppointment)

    // Close the edit form
    setIsEditFormOpen(false)
    setAppointmentToEdit(null)
  }

  const cancelEdit = () => {
    // Close the edit form without saving
    setIsEditFormOpen(false)
    setAppointmentToEdit(null)
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Partie 5 Banner */}
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
                      <th scope="col" className="px-4 py-3">
                        Nom
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Heure
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Raison
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="border-b bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(appointment)}
                      >
                        <td className="px-4 py-4">{appointment.name}</td>
                        <td className="px-4 py-4">{appointment.date}</td>
                        <td className="px-4 py-4">{appointment.time}</td>
                        <td className="px-4 py-4">{appointment.reason}</td>
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
                            onClick={(e) => handleEdit(appointment, e)}
                            className="mr-2 rounded-full bg-[#2DD4BF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(appointment.id, appointment.name)
                            }}
                            className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            X
                          </button>
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

      {/* Verification Popup */}
      <VerificationPopup
        isOpen={isPopupOpen}
        appointmentId={selectedAppointment?.id || null}
        appointmentName={selectedAppointment?.name || ""}
        onConfirm={confirmReject}
        onCancel={cancelReject}
      />

      {/* Edit Appointment Form */}
      <EditAppointmentForm
        isOpen={isEditFormOpen}
        appointment={appointmentToEdit}
        onSave={saveAppointment}
        onCancel={cancelEdit}
      />

      {/* Appointment Details Popup */}
      <AppointmentDetailsPopup
        isOpen={isDetailsPopupOpen}
        appointment={appointmentToView}
        onClose={() => setIsDetailsPopupOpen(false)}
      />

      <Footer />
    </main>
  )
}

