"use client"
import "../../../public/tailwind.css"

import type React from "react"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "warning"
}

export default function PrescriptionList() {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

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

  // Fetch prescriptions for this doctor
  useEffect(() => {
    if (!doctorId) return

    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`http://localhost:8000/prescriptions/doctor/${doctorId}`)
        setPrescriptions(response.data)
        setError(null)
      } catch (error) {
        console.error("Error fetching prescriptions:", error)
        setError("Failed to load prescriptions. Please try again.")
        showToast("Failed to load prescriptions. Please try again.", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [doctorId])

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
    }
  }

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding/collapsing when clicking delete
    setDeleteConfirmation(id)
  }

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding/collapsing when clicking cancel
    setDeleteConfirmation(null)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expanding/collapsing when clicking confirm

    try {
      const response = await axios.delete(`http://localhost:8000/prescriptions/delete/${id}`)

      if (response.status === 200) {
        // Remove the deleted prescription from the state
        setPrescriptions(prescriptions.filter((p) => p.id !== id))
        showToast("Prescription deleted successfully", "success")
      }
    } catch (error) {
      console.error("Error deleting prescription:", error)
      showToast("Failed to delete prescription. Please try again.", "error")
    } finally {
      setDeleteConfirmation(null)
    }
  }
  const handleEditPrescription = (event: React.MouseEvent, prescriptionId: number) => {
    event.stopPropagation()
    console.log("Edit clicked!", prescriptionId) // ✅ Check this logs
    router.push(`/medecin/prescriptionedit?id=${prescriptionId}`)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleDownload = async (id: string) => {
    try {
      showToast("Downloading prescription...", "success")
      window.open(`http://localhost:8000/prescriptions/download/${id}`, "_blank")
    } catch (error) {
      console.error("Error downloading prescription:", error)
      showToast("Failed to download prescription. Please try again.", "error")
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl mx-auto rounded-lg bg-white shadow-xl overflow-hidden">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Prescriptions</span>
          </div>

          {/* Header */}
          <div className="bg-[#2DD4BF] p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Prescriptions</h1>
              <p className="text-white opacity-80">Manage your patient prescriptions</p>
            </div>
            <Link
              href="/prescriptions/new"
              className="bg-white text-[#2DD4BF] px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Prescription
            </Link>
          </div>

          {/* Prescription List */}
          <div className="p-6">
            {prescriptions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-xl font-medium text-gray-900">No prescriptions yet</h3>
                <p className="mt-2 text-base text-gray-500">Get started by creating a new prescription.</p>
                <div className="mt-8">
                  <Link
                    href="/prescriptions/new"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#2DD4BF] hover:bg-[#2DD4BF]/90"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Prescription
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpand(prescription.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-[#2DD4BF]" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {prescription.patient && prescription.patient.user
                              ? `${prescription.patient.user.prenom} ${prescription.patient.user.nom}`
                              : "Unknown Patient"}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(prescription.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {deleteConfirmation === prescription.id ? (
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm text-red-600">Confirm delete?</span>
                            <button
                              className="px-2 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
                              onClick={(e) => handleDelete(prescription.id, e)}
                            >
                              Yes
                            </button>
                            <button
                              className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs hover:bg-gray-300"
                              onClick={cancelDelete}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={(e) => handleEditPrescription(e, prescription.id)}>
  Edit
</button>
                            <button
                              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full"
                              onClick={(e) => confirmDelete(prescription.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </button>
                            <button className="text-gray-500 hover:text-gray-700 ml-1">
                              {expandedId === prescription.id ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {expandedId === prescription.id && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Prescription Content</h4>
                            <p className="mt-1">{prescription.content}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Medication</h4>
                            <div className="mt-2 bg-white p-3 rounded border border-gray-200">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-xs text-gray-500">Name</span>
                                  <p className="font-medium">{prescription.medicament?.name || "Not specified"}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Dosage</span>
                                  <p>{prescription.dosage || "Not specified"}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Duration</span>
                                  <p>{prescription.duration || "Not specified"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2DD4BF]"
                              onClick={() => handleDownload(prescription.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
