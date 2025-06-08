/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useRef } from "react"
import { User, FileText, Calendar, Clock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import Header from "@/components/medecin/header"
import Footer from "@/components/footer"
import { DentalChartSVG } from "@/components/medecin/dental-chart-svg"
import { NoteEditor } from "@/components/medecin/note-editor"
import ToothStatusPopup from "@/components/medecin/tooth-status-popup"
import { TEETH_LIST } from "@/components/medecin/teeth-constants"

interface Tooth {
  id?: number
  tooth_code: string
  tooth_name: string
  note: string
  status?: string
}

interface PatientData {
  id: number
  nom: string
  prenom: string
  date_naissance?: string
  email?: string
  telephone?: string
  photo?: string
}

export default function DentalApp() {
  const [teeth, setTeeth] = useState<Tooth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [patientLoading, setPatientLoading] = useState(true)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [showPermanent, setShowPermanent] = useState(true)
  const [selectedToothCode, setSelectedToothCode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"chart" | "history">("chart")
  const [showStatusPopup, setShowStatusPopup] = useState(false)
  const [changedTeeth, setChangedTeeth] = useState<Set<string>>(new Set())
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

  // Fetch teeth data from API and initialize default teeth
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

        // Initialize all teeth as healthy
        const defaultTeeth = TEETH_LIST.map((tooth) => ({
          tooth_code: tooth.tooth_code,
          tooth_name: tooth.tooth_name,
          note: "",
          status: "Healthy",
        }))

        // If we have teeth data in the database, update our default teeth
        if (response.ok) {
          const savedTeeth = await response.json()

          // Create a map of saved teeth by tooth_code for quick lookup
          const savedTeethMap = savedTeeth.reduce((map: Record<string, Tooth>, tooth: Tooth) => {
            map[tooth.tooth_code] = tooth
            return map
          }, {})

          // Update default teeth with saved data
          defaultTeeth.forEach((tooth, index) => {
            if (savedTeethMap[tooth.tooth_code]) {
              defaultTeeth[index] = savedTeethMap[tooth.tooth_code]
              // Mark this tooth as already changed
              setChangedTeeth((prev) => new Set(prev).add(tooth.tooth_code))
            }
          })
        }

        setTeeth(defaultTeeth)
      } catch (error) {
        console.error("Error fetching teeth data:", error)
        // Fallback to sample data for demo purposes
        const defaultTeeth = TEETH_LIST.map((tooth) => ({
          tooth_code: tooth.tooth_code,
          tooth_name: tooth.tooth_name,
          note: "",
          status: "Healthy",
        }))
        setTeeth(defaultTeeth)
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
      // Mark this tooth as changed
      setChangedTeeth((prev) => new Set(prev).add(selectedToothCode))

      // Update local state first
      setTeeth((prevTeeth) =>
        prevTeeth.map((tooth) => (tooth.tooth_code === selectedToothCode ? { ...tooth, note } : tooth)),
      )

      // Get patient ID
      const patientId = getPatientId()
      if (!patientId) throw new Error("Patient ID not found")

      // If the tooth already has an ID, update it
      if (selectedTooth.id) {
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
      }
      // If the tooth doesn't have an ID, create it
      else {
        const response = await fetch(`http://localhost:8000/tooth/patients/${patientId}/tooth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tooth_code: selectedTooth.tooth_code,
            tooth_name: selectedTooth.tooth_name,
            note: note,
            status: selectedTooth.status || "Healthy",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create tooth record")
        }

        // Get the created tooth with its ID
        const createdTooth = await response.json()

        // Update the teeth array with the new ID
        setTeeth((prevTeeth) =>
          prevTeeth.map((tooth) =>
            tooth.tooth_code === selectedToothCode ? { ...tooth, id: createdTooth.id } : tooth,
          ),
        )
      }

      // Close the note editor
      setSelectedToothCode(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Open status popup
  const handleOpenStatusPopup = () => {
    setShowStatusPopup(true)
  }

  // Handle status update
  const handleStatusUpdate = async (toothId: number | undefined, toothCode: string, newStatus: string) => {
    try {
      // Mark this tooth as changed
      setChangedTeeth((prev) => new Set(prev).add(toothCode))

      // Update local state first
      setTeeth((prevTeeth) =>
        prevTeeth.map((tooth) => (tooth.tooth_code === toothCode ? { ...tooth, status: newStatus } : tooth)),
      )

      // Get patient ID
      const patientId = getPatientId()
      if (!patientId) throw new Error("Patient ID not found")

      // If the tooth already has an ID, update it
      if (toothId) {
        const response = await fetch(
          `http://localhost:8000/tooth/status/${patientId}/teeth/${toothId}?status=${encodeURIComponent(newStatus)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to update status")
        }
      }
      // If the tooth doesn't have an ID, create it
      else {
        const selectedTooth = teeth.find((tooth) => tooth.tooth_code === toothCode)
        if (!selectedTooth) throw new Error("Tooth not found")

        const response = await fetch(`http://localhost:8000/tooth/patients/${patientId}/tooth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tooth_code: selectedTooth.tooth_code,
            tooth_name: selectedTooth.tooth_name,
            note: selectedTooth.note || "",
            status: newStatus,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create tooth record")
        }

        // Get the created tooth with its ID
        const createdTooth = await response.json()

        // Update the teeth array with the new ID
        setTeeth((prevTeeth) =>
          prevTeeth.map((tooth) => (tooth.tooth_code === toothCode ? { ...tooth, id: createdTooth.id } : tooth)),
        )
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status. Please try again.")
    } finally {
      setShowStatusPopup(false)
    }
  }

  // Get the selected tooth
  const selectedTooth = selectedToothCode ? teeth.find((tooth) => tooth.tooth_code === selectedToothCode) || null : null

  // Get patient ID
  const getPatientId = (): number => {
    try {
      const storedPatientData = localStorage.getItem("patientData")
      if (storedPatientData) {
        const { patient_id } = JSON.parse(storedPatientData)
        return patient_id
      }
    } catch (error) {
      console.error("Error getting patient ID:", error)
    }
    return 0
  }

  // Handle schedule appointment
  const handleScheduleAppointment = () => {
    const patientId = getPatientId()
    if (patientId) {
      router.push(`/medecin/appointment?patient=${patientId}`)
    } else {
      alert("Patient ID not found. Cannot schedule appointment.")
    }
  }

  // Handle close button click - navigate back to patient list
  const handleCloseClick = () => {
    router.push("/medecin/patientlist")
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // Calculate age from date of birth
  const calculateAge = (dateString?: string) => {
    if (!dateString) return "N/A"
    const birthDate = new Date(dateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Get patient photo URL
  const getPatientPhotoUrl = () => {
    if (!patientData?.photo) return null
    return patientData.photo.startsWith("http") ? patientData.photo : `http://localhost:8000${patientData.photo}`
  }

  return (
    <main className="w-full bg-slate-50 min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Top Bar with Patient Info */}
          <div className="relative bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
            <div className="absolute top-4 left-4">
              <button
                onClick={handleCloseClick}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Back to Patients</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-8">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                  {patientData?.photo ? (
                    <Image
                      src={getPatientPhotoUrl() || "/placeholder.svg"}
                      alt={`${patientData.prenom} ${patientData.nom}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <User size={32} className="text-white" />
                  )}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {patientLoading
                      ? "Loading patient data..."
                      : `${patientData?.prenom || ""} ${patientData?.nom || ""}`}
                  </h2>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>DOB: {formatDate(patientData?.date_naissance)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Age: {calculateAge(patientData?.date_naissance)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>ID: {patientData?.id || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
                  <FileText size={18} className="inline mr-2" />
                  Medical History
                </button>
                <button
                  onClick={handleScheduleAppointment}
                  className="bg-white text-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  <Calendar size={18} className="inline mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              <button
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === "chart"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("chart")}
              >
                Dental Chart
              </button>
              
            </div>
          </div>

          <div className="p-6">
            {activeTab === "chart" ? (
              <>
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                  </div>
                )}

                {/* Tooth Chart */}
                {!isLoading && (
                  <div
                    className="flex items-center justify-center p-6 bg-white border rounded-xl shadow-sm mb-6 relative"
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
                        onStatusClick={handleOpenStatusPopup}
                        showPermanent={showPermanent}
                      />
                    )}

                    {/* Status Popup */}
                    {selectedTooth && (
                      <ToothStatusPopup
                        isOpen={showStatusPopup}
                        tooth={selectedTooth}
                        patientId={getPatientId()}
                        onClose={() => setShowStatusPopup(false)}
                        onStatusUpdate={(toothId, newStatus) =>
                          handleStatusUpdate(toothId, selectedTooth.tooth_code, newStatus)
                        }
                      />
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-6 bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Chart Legend</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-600">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-slate-600">Needs Attention</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm text-slate-600">Requires Treatment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-600">Treatment Completed</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 text-sm text-slate-500 italic">
                  Click on any tooth to add or edit notes and status. Your changes will be saved automatically.
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Treatment History</h3>
                <p>No treatment records available for this patient.</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 p-6 flex justify-between items-center border-t">
            <button
              className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors"
              onClick={handleCloseClick}
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Patients</span>
            </button>

            <div className="flex gap-3">
              <button className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">
                <span className="text-sm font-medium">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
