"use client"
import { useState, useEffect } from "react"

interface ToothStatusPopupProps {
  isOpen: boolean
  tooth: {
    id?: number
    tooth_code: string
    tooth_name: string
    status?: string
  } | null
  patientId: number
  onClose: () => void
  onStatusUpdate?: (toothId: number | undefined, newStatus: string) => void
}

export default function ToothStatusPopup({ isOpen, tooth, patientId, onClose, onStatusUpdate }: ToothStatusPopupProps) {
  const [status, setStatus] = useState<string>("Healthy")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusOptions = [
    { value: "Healthy", color: "bg-green-500" },
    { value: "Needs Attention", color: "bg-yellow-500" },
    { value: "Requires Treatment", color: "bg-red-500" },
    { value: "Treatment Completed", color: "bg-blue-500" },
  ]

  // Initialize status when tooth changes
  useEffect(() => {
    if (tooth && tooth.status) {
      setStatus(tooth.status)
    } else {
      setStatus("Healthy") // Default status
    }
  }, [tooth])

  const handleSaveStatus = async () => {
    if (!tooth || !patientId) return

    setIsLoading(true)
    setError(null)

    try {
      if (onStatusUpdate) {
        onStatusUpdate(tooth.id, status)
      }
    } catch (err) {
      console.error("Error saving status:", err)
      setError("Failed to save tooth status")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !tooth) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Update Tooth Status</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Tooth: {tooth.tooth_code} - {tooth.tooth_name}
            </p>
          </div>

          {error && <div className="text-red-500 p-2 mb-4 text-center bg-red-50 rounded-md">{error}</div>}

          <div className="space-y-3">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                <input
                  type="radio"
                  name="toothStatus"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${option.color} mr-2`}></div>
                  <span>{option.value}</span>
                </div>
              </label>
            ))}
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
            onClick={handleSaveStatus}
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
              "Save Status"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
