"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import axios from "axios"

interface Appointment {
  id: number
  patient_id: number
  medecin_id: number
  date: string
  status: string
  note: string | null
}

interface Medicament {
  id: number
  name: string
  description: string | null
  price: number | null
  dosage: string // Added dosage field
  duration: string // Added duration field
}

interface Patient {
  id: number
  nom: string
  prenom: string
  email: string
  phone: string
}

interface PrescriptionFormProps {
  isOpen: boolean
  appointment: Appointment
  onClose: () => void
}

export default function PrescriptionForm({ isOpen, appointment, onClose }: PrescriptionFormProps) {
  const [content, setContent] = useState("")
  const [selectedMedicaments, setSelectedMedicaments] = useState<{ id: number; dosage: string; duration: string }[]>([])
  const [availableMedicaments, setAvailableMedicaments] = useState<Medicament[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch available medicaments and patient info when component mounts
  useEffect(() => {
    if (isOpen && appointment) {
      fetchMedicaments()
      fetchPatientInfo(appointment.patient_id)
    }
  }, [isOpen, appointment])

  const fetchMedicaments = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("http://localhost:8000/medicaments/")
      setAvailableMedicaments(response.data)
    } catch (error) {
      console.error("Error fetching medicaments:", error)
      setError("Failed to load medicaments. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatientInfo = async (patientId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/users/patient/${patientId}`)
      setPatient(response.data)
    } catch (error) {
      console.error("Error fetching patient info:", error)
    }
  }

  const handleMedicamentToggle = (medicamentId: number) => {
    setSelectedMedicaments((prev) => {
      if (prev.some((item) => item.id === medicamentId)) {
        return prev.filter((item) => item.id !== medicamentId)
      } else {
        const medicament = availableMedicaments.find((m) => m.id === medicamentId)
        return [
          ...prev,
          {
            id: medicamentId,
            dosage: medicament?.dosage || "",
            duration: medicament?.duration || "",
          },
        ]
      }
    })
  }

  const handleMedicamentUpdate = (medicamentId: number, field: "dosage" | "duration", value: string) => {
    setSelectedMedicaments((prev) =>
      prev.map((item) => (item.id === medicamentId ? { ...item, [field]: value } : item)),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content || selectedMedicaments.length === 0) {
      setError("Please fill in the prescription content and select at least one medicament")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const prescriptionData = {
        content,
        medicaments: selectedMedicaments,
      }

      const response = await axios.post(`http://localhost:8000/prescriptions/${appointment.id}`, prescriptionData)

      console.log("Prescription created:", response.data)
      setSuccess("Prescription created successfully!")

      // Dispatch a custom event to notify that a prescription was created
      window.dispatchEvent(
        new CustomEvent("prescriptionCreated", {
          detail: {
            appointmentId: appointment.id,
            prescriptionId: response.data.id,
          },
        }),
      )

      // Reset form after successful submission
      setTimeout(() => {
        setContent("")
        setSelectedMedicaments([])
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error creating prescription:", error)
      setError("Failed to create prescription. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Plus className="w-5 h-5 mr-3 opacity-90" />
            Create Prescription
          </h2>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors flex items-center bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading medicaments...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8">
            {/* Patient Information */}
            {patient && (
              <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Patient Information</h3>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Name:</span>
                    <span className="text-gray-900">
                      {patient.prenom} {patient.nom}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Email:</span>
                    <span className="text-gray-900">{patient.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">Phone:</span>
                    <span className="text-gray-900">{patient.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 flex items-start">
                <div className="mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg text-green-700 flex items-start">
                <div className="mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>{success}</div>
              </div>
            )}

            {/* Prescription Content */}
            <div className="mb-8">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                rows={4}
                placeholder="Enter prescription details..."
                required
              />
            </div>

            {/* Medicaments Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Medicaments</h3>

              {availableMedicaments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500 font-medium">No medicaments available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {availableMedicaments.map((medicament) => (
                    <div
                      key={medicament.id}
                      className={`border rounded-lg overflow-hidden transition-colors ${
                        selectedMedicaments.some((item) => item.id === medicament.id)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="p-4 cursor-pointer" onClick={() => handleMedicamentToggle(medicament.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                selectedMedicaments.some((item) => item.id === medicament.id)
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-200"
                              }`}
                            >
                              {selectedMedicaments.some((item) => item.id === medicament.id) && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{medicament.name}</h4>
                          </div>
                          {selectedMedicaments.some((item) => item.id === medicament.id) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMedicamentToggle(medicament.id)
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="mt-3 pl-9">
                          {medicament.description && (
                            <p className="text-sm text-gray-600 mb-2">{medicament.description}</p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                            {selectedMedicaments.some((item) => item.id === medicament.id) ? (
                              <>
                                <div className="bg-white rounded-md p-3 border border-gray-100">
                                  <label
                                    htmlFor={`dosage-${medicament.id}`}
                                    className="text-xs text-gray-500 mb-1 block"
                                  >
                                    Dosage
                                  </label>
                                  <input
                                    id={`dosage-${medicament.id}`}
                                    type="text"
                                    className="w-full text-sm p-1 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={
                                      selectedMedicaments.find((m) => m.id === medicament.id)?.dosage ||
                                      medicament.dosage
                                    }
                                    onChange={(e) => handleMedicamentUpdate(medicament.id, "dosage", e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="bg-white rounded-md p-3 border border-gray-100">
                                  <label
                                    htmlFor={`duration-${medicament.id}`}
                                    className="text-xs text-gray-500 mb-1 block"
                                  >
                                    Duration
                                  </label>
                                  <input
                                    id={`duration-${medicament.id}`}
                                    type="text"
                                    className="w-full text-sm p-1 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={
                                      selectedMedicaments.find((m) => m.id === medicament.id)?.duration ||
                                      medicament.duration
                                    }
                                    onChange={(e) => handleMedicamentUpdate(medicament.id, "duration", e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="bg-white rounded-md p-3 border border-gray-100">
                                  <p className="text-xs text-gray-500 mb-1">Dosage</p>
                                  <p className="text-sm font-medium">{medicament.dosage}</p>
                                </div>
                                <div className="bg-white rounded-md p-3 border border-gray-100">
                                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                                  <p className="text-sm font-medium">{medicament.duration}</p>
                                </div>
                              </>
                            )}
                          </div>

                          {medicament.price && (
                            <p className="text-sm text-gray-600 mt-2">
                              Price: <span className="font-medium">${medicament.price.toFixed(2)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Medicaments Summary */}
            {selectedMedicaments.length > 0 && (
              <div className="mb-8 bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-3">Selected Medicaments ({selectedMedicaments.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMedicaments.map((item) => {
                    const medicament = availableMedicaments.find((m) => m.id === item.id)
                    return medicament ? (
                      <div
                        key={item.id}
                        className="bg-white px-3 py-2 rounded-full border border-gray-200 text-sm flex items-center"
                      >
                        {medicament.name} ({item.dosage}, {item.duration})
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMedicamentToggle(item.id)
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 mr-4 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Prescription
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
