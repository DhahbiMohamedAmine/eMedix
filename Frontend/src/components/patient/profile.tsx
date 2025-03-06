"use client"

import type React from "react"

import { useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import { useRouter } from "next/router"
import Header from "../../components/header"
import Footer from "../../components/footer"

export default function ProfilePage() {
  const router = useRouter()
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
        const response = await axios.get(`http://localhost:8000/profile/patient/${patientId}`)
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

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatient({ ...patient, [e.target.id]: e.target.value })
  }

  // Handle Form Submission (Update Patient)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (patient.password && patient.password.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    try {
      const formData = new FormData()
      formData.append("nom", patient.nom)
      formData.append("prenom", patient.prenom)
      formData.append("telephone", patient.telephone)
      formData.append("email", patient.email)
      if (patient.password && patient.password !== patient.email) {
        formData.append("password", patient.password)
      }
      if (patient.photo instanceof File) {
        formData.append("photo", patient.photo)
      }

      const response = await axios.put(`http://localhost:8000/profile/updatepatient/${patientId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.status === 200) {
        alert("Profile updated successfully!")
      }
    } catch (error) {
      console.error("Error updating patient profile:", error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to update profile. Please check your information."
        alert(errorMessage)
      } else {
        alert("An unexpected error occurred. Please try again.")
      }
    }
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />

      {/* Profile Content */}
      <section className="px-4 sm:px-8 lg:px-16 xl:px-40 2xl:px-64 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
            {/* Banner */}
            <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
              <span className="text-lg font-semibold">Profile</span>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Left side - Image */}
              <div className="relative w-full h-full overflow-hidden rounded-l-lg bg-[#2DD4BF] p-8">
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                    Profile Photo
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    {patient.photo ? (
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-300">
                        <Image
                          src={typeof patient.photo === "string" ? patient.photo : URL.createObjectURL(patient.photo)}
                          alt="Profile preview"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-gray-400">No photo</span>
                      </div>
                    )}
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-gray-50 border border-gray-300"
                    >
                      Change Photo
                      <input
                        id="photo-upload"
                        name="photo"
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
                    </label>
                  </div>
                </div>
                <div className="absolute bottom-4 text-white text-sm text-center">
                  <p>Click on the image to change your profile picture</p>
                  <p className="text-xs mt-1">Recommended: Square image, max 5MB</p>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">User Profile</h1>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="nom"
                      value={`${patient.nom} ${patient.prenom}`}
                      disabled
                      className="w-full bg-gray-100 rounded-md border px-4 py-3"
                    />
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
                  <div className="space-y-2">
                    <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="date_naissance"
                      value={patient.date_naissance}
                      disabled
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      id="password"
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                    {patient.password && patient.password.length > 0 && patient.password.length < 6 && (
                      <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters long</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:ring-2 focus:ring-[#2DD4BF]/20"
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

