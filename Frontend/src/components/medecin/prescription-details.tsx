/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, FileText, AlertCircle, Printer } from "lucide-react"
import axios from "axios"
import "./prescription-print.css" // Import the print stylesheet

interface Medication {
  id: number
  name: string
  description: string | null
  price: number | null
  dosage: string
  duration: string
}

interface MedicamentItem {
  id: number
  dosage: string
  duration: string
}

interface Patient {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  date_naissance?: string
  code?: string
}

interface Doctor {
  id: number
  nom: string
  prenom: string
  specialite: string
  email?: string
  phone?: string
}

interface Prescription {
  id: number
  appointment_id: number
  content: string
  created_at?: string
  medicaments: MedicamentItem[] // Updated to match the exact API response
  patient_id?: number
  medecin_id?: number
}

interface PrescriptionDetailsProps {
  prescriptionId?: number | null
  appointmentId?: number | null
  onClose: () => void
}

export default function PrescriptionDetails({ prescriptionId, appointmentId, onClose }: PrescriptionDetailsProps) {
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [currentDate] = useState(new Date()) // Store today's date
  const printFrameRef = useRef<HTMLIFrameElement>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionDetails(prescriptionId)
    } else if (appointmentId) {
      fetchPrescriptionByAppointment(appointmentId)
    }
  }, [prescriptionId, appointmentId])

  const fetchPrescriptionByAppointment = async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const appointmentResponse = await axios.get(`http://localhost:8000/appointments/appointment/${id}`)
      const appointmentData = appointmentResponse.data

      if (appointmentData.patient_id) {
        fetchPatientInfo(appointmentData.patient_id)
      }

      if (appointmentData.medecin_id) {
        fetchDoctorInfo(appointmentData.medecin_id)
      }

      const response = await axios.get(`http://localhost:8000/prescriptions/${id}`)
      const prescriptionData = response.data
      setPrescription(prescriptionData)
      console.log("Prescription data:", prescriptionData)

      if (prescriptionData.medicaments && prescriptionData.medicaments.length > 0) {
        console.log("Found medicaments:", prescriptionData.medicaments)
        fetchMedicationDetails(prescriptionData.medicaments)
      } else {
        console.log("No medicaments found in prescription data")
        setMedications([])
      }

      if (!prescriptionData.patient_id && appointmentData.patient_id) {
        fetchPatientInfo(appointmentData.patient_id)
      }

      if (!prescriptionData.medecin_id && appointmentData.medecin_id) {
        fetchDoctorInfo(appointmentData.medecin_id)
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error)
      setError("Failed to load prescription details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrescriptionDetails = async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(`http://localhost:8000/prescriptions/${id}`)
      const prescriptionData = response.data
      setPrescription(prescriptionData)
      console.log("Prescription data:", prescriptionData)

      if (prescriptionData.medicaments && prescriptionData.medicaments.length > 0) {
        console.log("Found medicaments:", prescriptionData.medicaments)
        fetchMedicationDetails(prescriptionData.medicaments)
      } else {
        console.log("No medicaments found in prescription data")
        setMedications([])
      }

      if (prescriptionData.appointment_id) {
        try {
          const appointmentResponse = await axios.get(
            `http://localhost:8000/appointments/appointment/${prescriptionData.appointment_id}`,
          )
          const appointmentData = appointmentResponse.data

          if (appointmentData.patient_id) {
            fetchPatientInfo(appointmentData.patient_id)
          } else if (prescriptionData.patient_id) {
            fetchPatientInfo(prescriptionData.patient_id)
          }

          if (appointmentData.medecin_id) {
            fetchDoctorInfo(appointmentData.medecin_id)
          } else if (prescriptionData.medecin_id) {
            fetchDoctorInfo(prescriptionData.medecin_id)
          }
        } catch (appointmentError) {
          console.error("Error fetching appointment details:", appointmentError)
          if (prescriptionData.patient_id) {
            fetchPatientInfo(prescriptionData.patient_id)
          }
          if (prescriptionData.medecin_id) {
            fetchDoctorInfo(prescriptionData.medecin_id)
          }
        }
      } else {
        if (prescriptionData.patient_id) {
          fetchPatientInfo(prescriptionData.patient_id)
        }
        if (prescriptionData.medecin_id) {
          fetchDoctorInfo(prescriptionData.medecin_id)
        }
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error)
      setError("Failed to load prescription details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatientInfo = async (patientId: number) => {
    try {
      const patientResponse = await axios.get(`http://localhost:8000/users/patient/${patientId}`)
      setPatient(patientResponse.data)
    } catch (error) {
      console.error("Error fetching patient info:", error)
      setError("Failed to load patient information.")
    }
  }

  const fetchDoctorInfo = async (doctorId: number) => {
    try {
      const doctorResponse = await axios.get(`http://localhost:8000/users/medecin/${doctorId}`)
      setDoctor(doctorResponse.data)
    } catch (error) {
      console.error("Error fetching doctor info:", error)
      setError("Failed to load doctor information.")
    }
  }

  const fetchMedicationDetails = async (medicamentItems: MedicamentItem[]) => {
    try {
      console.log("Fetching medication details for:", medicamentItems)

      // Create an array to store the medication data
      const medicationData: Medication[] = []

      // Process each medicament item one by one
      for (const item of medicamentItems) {
        try {
          const response = await axios.get(`http://localhost:8000/medicaments/${item.id}`)
          const medicament = response.data

          // Combine the medication data with the dosage and duration from medicamentItems
          medicationData.push({
            ...medicament,
            dosage: item.dosage,
            duration: item.duration,
          })
        } catch (err) {
          console.error(`Error fetching medicament ${item.id}:`, err)
          // Add a placeholder for failed medicament fetches
          medicationData.push({
            id: item.id,
            name: `Medicament #${item.id}`,
            description: "Failed to load details",
            price: null,
            dosage: item.dosage,
            duration: item.duration,
          })
        }
      }

      console.log("Processed medications:", medicationData)
      setMedications(medicationData)
    } catch (error) {
      console.error("Error fetching medication details:", error)
      setError("Failed to load medication information.")
    }
  }

  // Updated formatDate function to use today's date as fallback
  const formatDate = (dateString?: string) => {
    try {
      // If dateString is provided and valid, use it
      if (dateString) {
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        }
      }

      // Otherwise use today's date
      return currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (e) {
      // If any error occurs, still return today's date
      return currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    }
  }

  const handlePrint = () => {
    if (!prescription || !doctor) return

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Prescription</title>
        <style>
          @page {
            margin: 0;
            size: A4 portrait;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .header {
            background-color: #1a4db2;
            color: white;
            padding: 20px;
            text-align: left;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0;
            font-size: 14px;
          }
          .content {
            padding: 20px;
          }
          .doctor-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .document-info {
            border: 1px solid #333;
            padding: 10px;
            width: 250px;
          }
          .patient-info {
            margin-bottom: 20px;
            display: flex;
          }
          .patient-info div {
            width: 50%;
          }
          .prescription-title {
            border: 1px solid #333;
            text-align: center;
            padding: 10px 0;
            margin-bottom: 20px;
          }
          .prescription-title h2 {
            margin: 0;
            font-size: 18px;
          }
          .prescription-content {
            margin-bottom: 20px;
            min-height: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
          }
          .signature {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .signature-box {
            width: 200px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 10px;
          }
          .contact {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            margin-top: 30px;
          }
          .footer {
            border-top: 1px solid #ddd;
            padding: 15px 20px;
            text-align: center;
            font-size: 12px;
          }
          .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .value {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MEDICAL PRESCRIPTION</h1>
          <p>Dr. ${doctor.prenom} ${doctor.nom}</p>
        </div>
        
        <div class="content">
          <div class="doctor-info">
            <div>
              <h2>Dr. ${doctor.prenom} ${doctor.nom}</h2>
              ${doctor.email ? `<p>${doctor.email}</p>` : ""}
            </div>
            
            <div class="document-info">
              <div>
                <p class="label">Date</p>
                <p>${formatDate(prescription.created_at)}</p>
              </div>
              ${
                patient
                  ? `
              <div>
                <p class="label">Patient</p>
                <p>${patient.prenom} ${patient.nom}</p>
              </div>
              `
                  : ""
              }
            </div>
          </div>

          
          <div class="prescription-title">
            <h2>PRESCRIPTION</h2>
          </div>
          
          <div class="prescription-content">
            <p>${prescription.content.replace(/\n/g, "<br>")}</p>
          </div>
          
          ${
            medications && medications.length > 0
              ? `
          <div>
            <h3>Prescribed Medications</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dosage</th>
                  <th>Duration</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${medications
                  .map(
                    (med) => `
                <tr>
                  <td>${med.name}</td>
                  <td>${med.dosage}</td>
                  <td>${med.duration}</td>
                  <td>${med.description || "-"}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }
          
          <div class="signature">
            <div class="signature-box">
              <p class="label">Signature and Stamp</p>
              <div class="signature-line">
                <p>Dr. ${doctor.prenom} ${doctor.nom}</p>
              </div>
            </div>
          </div>
          
          <div class="contact">
            <h3>CONTACT</h3>
            <p>123 Clinic Lane, Suite 1000, Tunis</p>
            <p>© 2025 Medica. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create a hidden iframe for printing
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"

    document.body.appendChild(iframe)

    // Write the content to the iframe
    const iframeDoc = iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(printContent)
      iframeDoc.close()

      // Wait for content to load then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()

          // Remove the iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }, 500)
      }
    }
  }

  if (!prescriptionId && !appointmentId) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 print-container">
      {/* Floating Print Button - Always visible */}
      {!isLoading && !error && prescription && (
        <button
          onClick={handlePrint}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-md flex items-center no-print"
          aria-label="Print prescription"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
      )}

      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in duration-300 prescription-document">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center p-16 no-print">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading prescription details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center no-print">
            <div className="inline-flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-full mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Error</h3>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Back
            </button>
          </div>
        ) : prescription ? (
          <>
            {/* Calendar view - will be hidden in print */}
            {/* Debug Info - Remove in production */}
            {/* {debugInfo && (
              <div className="bg-gray-100 p-4 border-b border-gray-300 text-xs font-mono overflow-auto max-h-40">
                <h3 className="font-bold mb-2">Debug Info (API Response):</h3>
                <pre>{debugInfo}</pre>
              </div>
            )} */}

            {/* Calendar view - will be hidden in print */}
            <div className="calendar-view">
              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-bold">Appointment Calendar</h2>
                {/* Calendar content here */}
              </div>
            </div>

            {/* Prescription content - this will be the only thing that prints */}
            <div className="overflow-y-auto max-h-[90vh] prescription-content">
              {/* Professional Header */}
              <div className="bg-[#1a4db2] text-white header-section">
                <div className="container mx-auto px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 mr-4 prescription-icon" />
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">MEDICAL PRESCRIPTION</h1>
                      {doctor && (
                        <p className="text-sm font-medium opacity-90 mt-1">
                          Dr. {doctor.prenom} {doctor.nom} - {doctor.specialite}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Added Print Button in Header */}
                    <button
                      onClick={handlePrint}
                      className="bg-white text-blue-600 hover:bg-blue-50 rounded-md px-4 py-2 flex items-center transition-colors"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-md px-4 py-2 flex items-center transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Content */}
              <div className="bg-white main-content">
                <div className="container mx-auto p-8">
                  {/* Doctor and Document Info */}
                  <div className="flex flex-col md:flex-row gap-8 mb-8 doctor-info-section">
                    {/* Doctor Info */}
                    <div className="flex-1">
                      {doctor && (
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-gray-900">
                            Dr. {doctor.prenom} {doctor.nom}
                          </h2>
                          {doctor.email && <p className="text-gray-600 text-sm">{doctor.email}</p>}
                        </div>
                      )}
                    </div>

                    {/* Document Info */}
                    <div className="w-full md:w-72 border border-gray-300 p-4 document-info">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date</p>
                          <p className="text-gray-900">{formatDate(prescription.created_at)}</p>
                        </div>
                        {patient && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Patient</p>
                            <p className="text-gray-900">
                              {patient.prenom} {patient.nom}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prescription Title */}
                  <div className="prescription-title-section mb-4">
                    <div className="border border-gray-300">
                      <h2 className="text-xl font-bold text-center py-2 uppercase">PRESCRIPTION</h2>
                    </div>
                  </div>

                  {/* Prescription Content */}
                  <div className="mb-6 prescription-section">
                    <div className="bg-white prescription-text">
                      <p className="whitespace-pre-line text-gray-800 leading-relaxed">{prescription.content}</p>
                    </div>
                  </div>

                  {/* Medications */}
                  {medications && medications.length > 0 ? (
                    <div className="mb-8 medications-section">
                      <h3 className="font-bold mb-3">Prescribed Medications</h3>
                      <div className="overflow-hidden">
                        <table className="w-full border-collapse medications-table">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left border border-gray-300">Name</th>
                              <th className="px-4 py-2 text-left border border-gray-300">Dosage</th>
                              <th className="px-4 py-2 text-left border border-gray-300">Duration</th>
                              <th className="px-4 py-2 text-left border border-gray-300">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {medications.map((medication) => (
                              <tr key={medication.id}>
                                <td className="px-4 py-2 border border-gray-300">{medication.name}</td>
                                <td className="px-4 py-2 border border-gray-300">{medication.dosage}</td>
                                <td className="px-4 py-2 border border-gray-300">{medication.duration}</td>
                                <td className="px-4 py-2 border border-gray-300">{medication.description || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                      <p>No medications found in this prescription.</p>
                      {prescription.medicaments && (
                        <div className="mt-2 text-sm">
                          <p>Raw medicaments data:</p>
                          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
                            {JSON.stringify(prescription.medicaments, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signature */}
                  <div className="flex justify-end signature-section">
                    <div className="w-64">
                      <p className="text-center text-gray-500 mb-4">Signature and Stamp</p>
                      <div className="border-t border-gray-300 pt-2">
                        {doctor && (
                          <p className="text-center font-medium text-gray-900">
                            Dr. {doctor.prenom} {doctor.nom}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information - integrated into the main prescription page */}
                  <div className="contact-section mt-8 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold uppercase mb-2">CONTACT</h3>
                    <p className="text-sm text-gray-600">123 Clinic Lane, Suite 1000, Tunis</p>
                    <p className="text-sm text-gray-600">Tel: +216 555 555</p>
                    <div className="mt-2 text-xs text-gray-500">© 2025 eMedix. All Rights Reserved.</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-200 footer-section">
                <div className="container mx-auto px-8 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <p>Page 1/1</p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm flex items-center"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center no-print">
            <div className="inline-flex items-center justify-center p-2 bg-amber-50 text-amber-500 rounded-full mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescription Found</h3>
            <p className="mb-6 text-gray-600">No prescription data is available for this appointment.</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
