"use client"

import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, AlertCircle } from "lucide-react"

import Header from "../medecin/header"
import Footer from "../footer"

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState({
    id: "",
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    photo: "" as string | File,
    adresse: "",
    diplome: "",
    grade: "",
    annee_experience: 0,
  })

  const [doctorId, setDoctorId] = useState(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

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

  // Fetch Doctor Data when doctorId is set
  useEffect(() => {
    if (!doctorId) return

    const fetchDoctor = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/users/medecin/${doctorId}`)
        const data = response.data

        setDoctor({
          id: data.id || "",
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          password: data.password || "",
          telephone: data.telephone || "",
          photo: data.photo || "",
          adresse: data.adresse || "",
          diplome: data.diplome || "",
          grade: data.grade || "",
          annee_experience: data.annee_experience || 0,
        })
      } catch (error) {
        console.error("Error fetching doctor data:", error)
      }
    }

    fetchDoctor()
  }, [doctorId])

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDoctor({ ...doctor, [e.target.id]: e.target.value })
  }

  // Handle Form Submission (Update Doctor)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append("nom", doctor.nom)
      formData.append("prenom", doctor.prenom)
      formData.append("telephone", doctor.telephone)
      formData.append("email", doctor.email)
      formData.append("adresse", doctor.adresse || "")
      formData.append("diplome", doctor.diplome || "")
      formData.append("grade", doctor.grade || "")
      formData.append("annee_experience", doctor.annee_experience.toString())

      if (doctor.photo instanceof File) {
        formData.append("photo", doctor.photo)
      }

      const response = await axios.put(`http://localhost:8000/users/updatemedecin/${doctorId}`, formData, {
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
      console.error("Error updating doctor profile:", error)
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
              <span className="text-lg font-semibold">Doctor Profile</span>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Left side - Image */}
              <div className="relative flex flex-col items-center justify-center w-full h-full bg-[#2DD4BF] p-8 py-16">
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-2xl font-semibold text-white mb-4">Profile Photo</h2>
                  {doctor.photo ? (
                    <div className="relative w-[280px] h-[280px] rounded-[150px] border-4 border-white bg-white overflow-hidden">
                      <Image
                        src={
                          typeof doctor.photo === "string"
                            ? doctor.photo.startsWith("http")
                              ? doctor.photo
                              : `http://localhost:8000${doctor.photo}`
                            : URL.createObjectURL(doctor.photo)
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
                        setDoctor((prev) => ({
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
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Doctor Profile</h1>
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
                        value={doctor.prenom}
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
                        value={doctor.nom}
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
                      value={doctor.email}
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
                      value={doctor.telephone}
                      onChange={handleChange}
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      id="adresse"
                      value={doctor.adresse || ""}
                      onChange={handleChange}
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="diplome" className="block text-sm font-medium text-gray-700">
                        Diploma
                      </label>
                      <input
                        type="text"
                        id="diplome"
                        value={doctor.diplome || ""}
                        disabled
                        className="w-full bg-gray-100 rounded-md border px-4 py-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                        Grade/Rank
                      </label>
                      <input
                        type="text"
                        id="grade"
                        value={doctor.grade || ""}
                        disabled
                        className="w-full bg-gray-100 rounded-md border px-4 py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="annee_experience" className="block text-sm font-medium text-gray-700">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="annee_experience"
                      value={doctor.annee_experience || 0}
                      disabled
                      min="0"
                      className="w-full bg-gray-100 rounded-md border px-4 py-3"
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

