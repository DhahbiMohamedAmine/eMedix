"use client"

import type React from "react"
import { useState, useEffect } from "react"

// Define the Appointment interface directly in this file
interface Appointment {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  status: string
  note: string | null
}

interface EditAppointmentFormProps {
  isOpen: boolean
  appointment: Appointment | null
  onSave: (appointment: Appointment) => void
  onCancel: () => void
}

export default function EditAppointmentForm({ isOpen, appointment, onSave, onCancel }: EditAppointmentFormProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>({})
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    if (appointment) {
      const [datePart, timePart] = appointment.date.split("T")
      setFormData({
        ...appointment,
        date: datePart,
      })
      setTime(timePart ? timePart.substring(0, 5) : "")
    }
  }, [appointment])

  if (!isOpen || !appointment) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "time") {
      setTime(value)
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Validate date is not in the past
    if (formData.date && formData.date < today) {
      alert("Please select a future date. Past dates are not allowed.")
      return
    }

    // Validate time is between 8:00 and 17:00
    const timeValue = time.split(":").map(Number)
    const hours = timeValue[0]

    if (hours < 8 || hours >= 17) {
      alert("Please select a time between 8:00 AM and 5:00 PM.")
      return
    }

    // Ensure correct date-time format: "YYYY-MM-DDTHH:mm:ss"
    const combinedDateTime = `${formData.date}T${time}:00`

    const updatedAppointment: Appointment = {
      id: appointment.id,
      patient_id: appointment.patient_id,
      medecin_id: appointment.medecin_id,
      date: combinedDateTime,
      status: formData.status || appointment.status,
      note: formData.note || appointment.note,
    }

    // Pass the updated appointment to the parent component
    onSave(updatedAppointment)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Edit Appointment</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date || ""}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]} // Set minimum date to today
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#2DD4BF] focus:outline-none focus:ring-[#2DD4BF]"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={time}
              onChange={handleChange}
              min="08:00"
              max="17:00"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#2DD4BF] focus:outline-none focus:ring-[#2DD4BF]"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Business hours: 8:00 AM - 5:00 PM</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-medium text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

