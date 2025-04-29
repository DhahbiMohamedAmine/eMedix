/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import "../../../public/tailwind.css"
import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import { AlertCircle, CheckCircle, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "warning"
}

export default function PrescriptionForm() {
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [medications, setMedications] = useState<any[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isRedirecting, setIsRedirecting] = useState(false)

  const [prescription, setPrescription] = useState({
    date: new Date().toISOString().split("T")[0],
    content: "",
    medicament_id: "",
    dosage: "",
    duration: "",
  })

  const showToast = (message: string, type: "success" | "error" | "warning") => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Fetch doctorId from localStorage
  useEffect(() => {
    const storedDoctorData = localStorage.getItem("user")

    if (storedDoctorData) {
      const parsedData = JSON.parse(storedDoctorData)
      if (parsedData.medecin_id) {
        setDoctorId(parsedData.medecin_id)
      }
    }
  }, [])

  // Fetch patients for this doctor
  useEffect(() => {
    if (!doctorId) return

    const fetchPatients = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/appointments/medecin/patients/${doctorId}`) 
        setPatients(response.data)
      } catch (error) {
        console.error("Error fetching patients:", error)
        showToast("Failed to load patients. Please try again.", "error")
      }
    }

    fetchPatients()
  }, [doctorId])

  // Add this useEffect to fetch medications
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/medicaments`)
        setMedications(response.data)
      } catch (error) {
        console.error("Error fetching medications:", error)
        showToast("Failed to load medications. Please try again.", "error")
      }
    }

    fetchMedications()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedPatient) {
      showToast("Please select a patient", "warning")
      return
    }

    if (!prescription.medicament_id) {
      showToast("Please select a medication", "warning")
      return
    }

    try {
      const prescriptionData = {
        medecin_id: doctorId,
        patient_id: selectedPatient,
        date: prescription.date,
        content: prescription.content,
        medicament_id: prescription.medicament_id,
        dosage: prescription.dosage,
        duration: prescription.duration,
      }

      const response = await axios.post("http://localhost:8000/prescriptions/addPrescription", prescriptionData)

      if (response.status === 201) {
        showToast("Prescription created successfully!", "success")
        setIsRedirecting(true)

        // Reset form
        setPrescription({
          date: new Date().toISOString().split("T")[0],
          content: "",
          medicament_id: "",
          dosage: "",
          duration: "",
        })
        setSelectedPatient("")

        // Redirect after a delay
        setTimeout(() => {
          window.location.href = "/prescriptions"
        }, 1500)
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      showToast("Failed to create prescription. Please try again.", "error")
    }
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Prescription</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative w-full h-full overflow-hidden rounded-l-lg">
              <Image
                src="/placeholder.svg?height=600&width=500"
                alt="Medical prescription illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            <div className="p-8 md:p-12">
              <h1 className="mb-8 text-3xl font-bold text-gray-900">Create Prescription</h1>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Patient Selection */}
                <div className="space-y-2">
                  <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
                    Select Patient
                  </label>
                  <select
                    id="patient"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    required
                  >
                    <option value="">-- Select a patient --</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={prescription.date}
                    onChange={(e) => setPrescription({ ...prescription, date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    required
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Prescription Content
                  </label>
                  <textarea
                    id="content"
                    value={prescription.content}
                    onChange={(e) => setPrescription({ ...prescription, content: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    rows={3}
                    placeholder="Enter diagnosis, instructions, and any additional notes"
                    required
                  />
                </div>

                {/* Medication */}
                <div className="space-y-2">
                  <label htmlFor="medicament_id" className="block text-sm font-medium text-gray-700">
                    Medication
                  </label>
                  <select
                    id="medicament_id"
                    value={prescription.medicament_id}
                    onChange={(e) => setPrescription({ ...prescription, medicament_id: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    required
                  >
                    <option value="">-- Select a medication --</option>
                    {medications.map((medication) => (
                      <option key={medication.id} value={medication.id}>
                        {medication.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
                      Dosage
                    </label>
                    <input
                      type="text"
                      id="dosage"
                      value={prescription.dosage}
                      onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
                      placeholder="e.g., 500mg twice daily"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <input
                      type="text"
                      id="duration"
                      value={prescription.duration}
                      onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
                      placeholder="e.g., 7 days"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 active:bg-[#2DD4BF]/80"
                  disabled={isRedirecting}
                >
                  {isRedirecting ? "Redirecting..." : "Create Prescription"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between rounded-lg p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-5 ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border-l-4 border-green-500"
                : toast.type === "error"
                  ? "bg-red-50 text-red-800 border-l-4 border-red-500"
                  : "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
            }`}
            style={{ minWidth: "320px", maxWidth: "420px" }}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : toast.type === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={() => dismissToast(toast.id)} className="ml-4 rounded-full p-1 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
