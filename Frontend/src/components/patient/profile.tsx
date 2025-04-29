"use client"

import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, AlertCircle } from "lucide-react"

import Header from "./header"
import Footer from "../../components/footer"

export default function ProfilePage() {
  const [patient, setPatient] = useState({
    id: "",
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    photo: "" as string | File,
    date_naissance: "",
    adresse: "",
  })

  const [patientId, setPatientId] = useState(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  // Fetch patientId from localStorage
  useEffect(() => {
    const storedPatientData = localStorage.getItem("patientData")

    if (storedPatientData) {
      const parsedData = JSON.parse(storedPatientData)
      if (parsedData.patient_id) {
        setPatientId(parsedData.patient_id)
      }
    }
  }, [])

  // Fetch Patient Data when patientId is set
  useEffect(() => {
    if (!patientId) return

    const fetchPatient = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/users/patient/${patientId}`)
        const data = response.data

        setPatient({
          id: data.id || "",
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          password: data.email,
          telephone: data.telephone || "",
          photo: data.photo || "",
          date_naissance: data.date_naissance || "",
          adresse: data.adresse || "",
        })
      } catch (error) {
        console.error("Error fetching patient data:", error)
      }
    }

    fetchPatient()
  }, [patientId])

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: "" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatient({ ...patient, [e.target.id]: e.target.value })
  }

  // Handle Form Submission (Update Patient)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append("nom", patient.nom)
      formData.append("prenom", patient.prenom)
      formData.append("telephone", patient.telephone)
      formData.append("email", patient.email)
      if (patient.photo instanceof File) {
        formData.append("photo", patient.photo)
      }

      const response = await axios.put(`http://localhost:8000/users/updatepatient/${patientId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.status === 200) {
        // Show success notification instead of alert
        setNotification({
          type: "success",
          message: "Profile updated successfully!",
        })

        // Scroll to top to show notification
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch (error) {
      console.error("Error updating patient profile:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to update profile. Please check your information."
        setNotification({
          type: "error",
          message: errorMessage,
        })
      } else {
        setNotification({
          type: "error",
          message: "An unexpected error occurred. Please try again.",
        })
      }
      // Scroll to top to show notification
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />

      {/* Notification */}
      {notification.type && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}>
                {notification.type === "success" ? "Success" : "Error"}
              </h3>
              <p className={`text-sm ${notification.type === "success" ? "text-green-700" : "text-red-700"}`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification({ type: null, message: "" })}
              className="ml-auto -mt-1 -mr-1 h-6 w-6 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
            {/* Banner */}
            <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
              <span className="text-lg font-semibold">Profile</span>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Left side - Image */}
              <div className="relative flex flex-col items-center justify-center w-full h-full bg-[#2DD4BF] p-8 py-16">
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-2xl font-semibold text-white mb-4">Profile Photo</h2>
                  {patient.photo ? (
                    <div className="relative w-[280px] h-[280px] rounded-[150px] border-4 border-white bg-white overflow-hidden">
                      <Image
                        src={
                          typeof patient.photo === "string"
                            ? patient.photo.startsWith("http")
                              ? patient.photo
                              : `http://localhost:8000${patient.photo}`
                            : URL.createObjectURL(patient.photo)
                        }
                        alt="Profile preview"
                        width={180}
                        height={180}
                        unoptimized
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-[280px] h-[280px] rounded-[100px] border-4 border-white bg-white flex items-center justify-center">
                      <span className="text-gray-400">No photo</span>
                    </div>
                  )}

                  <button
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    className="bg-white text-[#2DD4BF] px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all"
                  >
                    Change Photo
                  </button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPatient((prev) => ({
                          ...prev,
                          photo: e.target.files![0],
                        }))
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Patient Profile</h1>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Name fields side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="prenom"
                        value={patient.prenom}
                        disabled
                        className="w-full bg-gray-100 rounded-md border px-4 py-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="nom"
                        value={patient.nom}
                        disabled
                        className="w-full bg-gray-100 rounded-md border px-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={patient.email}
                      disabled
                      className="w-full bg-gray-100 rounded-md border px-4 py-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="date_naissance"
                      value={patient.date_naissance}
                      disabled
                      className="w-full bg-gray-100 rounded-md border px-4 py-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="telephone"
                      value={patient.telephone}
                      onChange={handleChange}
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/request-reset-password"
                      className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 font-medium text-sm flex items-center"
                    >
                      Need to reset your password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:ring-2 focus:ring-[#2DD4BF]/20 shadow-md hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

