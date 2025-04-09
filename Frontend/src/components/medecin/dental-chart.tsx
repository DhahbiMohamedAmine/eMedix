/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Users, Calendar, Grid2X2 } from "lucide-react"
import { useRouter } from "next/navigation"

import Header from "@/components/medecin/header"
import Footer from "@/components/footer"
import { DentalChartSVG } from "@/components/medecin/dental-chart-svg"
import { NoteEditor } from "@/components/medecin/note-editor"

interface Tooth {
  id: number
  tooth_code: string
  tooth_name: string
  note: string
}

interface ToothNoteUpdate {
  note: string
}

interface PatientData {
  id: number
  nom: string
  prenom: string
}

export default function DentalApp() {
  const [teeth, setTeeth] = useState<Tooth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [patientLoading, setPatientLoading] = useState(true)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [showPermanent, setShowPermanent] = useState(true)
  const [selectedToothCode, setSelectedToothCode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      setPatientLoading(true)
      try {
        // Get patient ID from localStorage
        const storedPatientData = localStorage.getItem("patientData")
        if (!storedPatientData) {
          console.warn("Patient data not found in localStorage")
          return
        }

        const { patient_id } = JSON.parse(storedPatientData)
        if (!patient_id) {
          throw new Error("Patient ID not found in patientData")
        }

        // Fetch patient details
        const response = await fetch(`http://localhost:8000/users/patient/${patient_id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch patient data")
        }

        const data = await response.json()
        setPatientData(data)
      } catch (error) {
        console.error("Error fetching patient data:", error)
      } finally {
        setPatientLoading(false)
      }
    }

    fetchPatientData()
  }, [])

  // Fetch teeth data from API
  useEffect(() => {
    const fetchTeeth = async () => {
      setIsLoading(true)
      try {
        // Get patient ID from localStorage
        const storedPatientData = localStorage.getItem("patientData")
        if (!storedPatientData) {
          console.warn("Patient data not found in localStorage")
          return
        }

        const { patient_id } = JSON.parse(storedPatientData)
        if (!patient_id) {
          throw new Error("Patient ID not found in patientData")
        }

        // Fetch teeth data from the API
        const response = await fetch(`http://localhost:8000/tooth/patients/${patient_id}/teeth`)
        if (!response.ok) {
          throw new Error("Failed to fetch teeth data")
        }

        const data = await response.json()
        setTeeth(data)
      } catch (error) {
        console.error("Error fetching teeth data:", error)
        // Fallback to sample data for demo purposes
        setTeeth([
          { id: 1, tooth_code: "11", tooth_name: "Upper Right Central Incisor", note: "" },
          { id: 2, tooth_code: "12", tooth_name: "Upper Right Lateral Incisor", note: "" },
          // ... other teeth data
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeeth()
  }, [])

  // Handle tooth click
  const handleToothClick = (toothCode: string) => {
    setSelectedToothCode(toothCode)
  }

  // Close note editor
  const handleCloseNote = () => {
    setSelectedToothCode(null)
  }

  // Save note
  const handleSaveNote = async (note: string) => {
    if (!selectedToothCode) return

    const selectedTooth = teeth.find((tooth) => tooth.tooth_code === selectedToothCode)
    if (!selectedTooth) return

    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:8000/tooth/teeth/${selectedTooth.id}/note`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      })

      if (!response.ok) {
        throw new Error("Failed to update note")
      }

      // Update local state
      setTeeth((prevTeeth) => prevTeeth.map((tooth) => (tooth.id === selectedTooth.id ? { ...tooth, note } : tooth)))

      // Close the note editor
      setSelectedToothCode(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Get the selected tooth
  const selectedTooth = selectedToothCode ? teeth.find((tooth) => tooth.tooth_code === selectedToothCode) || null : null

  // Handle back button click
  const handleBackClick = () => {
    router.back()
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow flex items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Dental Chart</h1>
              <p className="mt-2 text-white/80">View and manage patient dental records</p>
            </div>
          </div>

          <div className="p-6">
            {/* Patient Info */}
            <div className="flex items-center p-2 mb-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {patientLoading ? "..." : `${patientData?.prenom?.[0] || ""}${patientData?.nom?.[0] || ""}`}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {patientLoading
                      ? "Loading patient data..."
                      : `${patientData?.prenom || ""} ${patientData?.nom || ""}`}
                  </div>
                  <div className="text-xs text-gray-500">Patient ID: {patientData?.id || "N/A"}</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-4 py-2 mb-4 border-b bg-white">
              <button className="text-gray-500 hover:text-gray-700" onClick={handleBackClick}>
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-6">
                <button className="text-gray-500 hover:text-gray-700">
                  <Users size={20} />
                </button>
                <button className="flex items-center gap-2 text-cyan-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c-4.97 0-9-2.582-9-7v-.5C3 10 7.03 6 12 6s9 4 9 8.5v.5c0 4.418-4.03 7-9 7z" />
                    <path d="M12 6v16" />
                    <path d="M3 14h18" />
                    <path d="M15 18h.01" />
                    <path d="M9 18h.01" />
                  </svg>
                  <span className="text-sm font-medium">Dental Notes</span>
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Calendar size={20} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Grid2X2 size={20} />
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cyan-600"></div>
              </div>
            )}

            {/* Tooth Chart */}
            {!isLoading && (
              <div
                className="flex items-center justify-center p-4 bg-white border rounded-lg shadow-sm mb-6 relative"
                ref={chartRef}
              >
                <DentalChartSVG
                  teeth={teeth}
                  onToothClick={handleToothClick}
                  showPermanent={showPermanent}
                  selectedToothCode={selectedToothCode}
                />

                {/* Note Editor */}
                {selectedTooth && (
                  <NoteEditor
                    tooth={selectedTooth}
                    onClose={handleCloseNote}
                    onSave={handleSaveNote}
                    showPermanent={showPermanent}
                  />
                )}
              </div>
            )}

            {/* Toggle Options */}
            <div className="flex justify-between p-4 bg-white border rounded-lg shadow-sm mb-6">
              <label className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showPermanent}
                    onChange={() => setShowPermanent(true)}
                  />
                  <div
                    className={`w-5 h-5 border rounded flex items-center justify-center ${
                      showPermanent ? "bg-cyan-500 border-cyan-500" : "border-gray-300"
                    }`}
                  >
                    {showPermanent && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm">Show Permanent</span>
              </label>
              <label className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!showPermanent}
                    onChange={() => setShowPermanent(false)}
                  />
                  <div
                    className={`w-5 h-5 border rounded flex items-center justify-center ${
                      !showPermanent ? "bg-cyan-500 border-cyan-500" : "border-gray-300"
                    }`}
                  >
                    {!showPermanent && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm">Show Primary</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <span className="text-sm font-medium">Archive Patient</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                disabled={isSaving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save"}</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
                onClick={handleBackClick}
              >
                <X size={16} />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
