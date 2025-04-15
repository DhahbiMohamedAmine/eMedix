"use client"
import { useState, useEffect } from "react"
import axios from "axios"

interface AppointmentNotePopupProps {
  isOpen: boolean
  appointment: {
    id: number
    patient_id: number
    medecin_id: number
    date: string
    status: string
    note: string | null
  } | null
  onClose: () => void
  onNoteUpdate?: (appointmentId: number, newNote: string) => void
}

export default function AppointmentNotePopup({
  isOpen,
  appointment,
  onClose,
  onNoteUpdate,
}: AppointmentNotePopupProps) {
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize note when appointment changes
  useEffect(() => {
    if (appointment) {
      setNote(appointment.note || "")
    }
  }, [appointment]) // This dependency array ensures the effect runs when appointment changes

  const handleSaveNote = async () => {
    if (!appointment) return

    setIsLoading(true)
    setError(null)

    try {
      await axios.put(`http://localhost:8000/appointments/updatenote/${appointment.id}`, {
        ...appointment,
        note: note,
      })

      if (onNoteUpdate) {
        onNoteUpdate(appointment.id, note)
      }

      onClose()
    } catch (err) {
      console.error("Error saving note:", err)
      setError("Failed to save note")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Appointment Note</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Appointment Date: {new Date(appointment.date).toLocaleString()}</p>
          </div>

          {error && <div className="text-red-500 p-2 mb-4 text-center bg-red-50 rounded-md">{error}</div>}

          <div className="space-y-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[150px] p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Add notes about this appointment..."
            ></textarea>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveNote}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Note"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}