/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"

interface Doctor {
  id: number
  user_id: number
  nom: string
  prenom: string
  email: string
  photo: string | null
  telephone: string
  adresse: string
  diplome: string
  grade: string
  ville: string
}

export default function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const router = useRouter()
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)

  // Add console logs to debug
  const handleViewDoctorDetails = (doctorId: number) => {
    console.log("Navigating to doctor details with ID:", doctorId)
    // Try using the router.push with a callback to catch errors
    try {
      router.push(`/patient/doctordetails/${doctorId}`)
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:8000/users/medecins")
        if (!response.ok) {
          throw new Error("Failed to fetch doctors")
        }
        const data = await response.json()
        setDoctors(data)
      } catch (error) {
        console.error("Error fetching doctors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  // Let's simplify and just use one function for navigation
  // Remove this function since we're using handleViewDoctorDetails
  // const handleDoctorClick = (doctorId: number) => {
  //   router.push(`/patient/doctordetails?id=${doctorId}`)
  // }

  const handleBookAppointment = (event: React.MouseEvent, doctorId: number) => {
    event.stopPropagation() // Prevent the card click event from firing
    router.push(`/patient/appointment?doctor=${doctorId}`)
  }

  // Rest of your component remains the same...
  const cities = Array.from(new Set(doctors.map((doctor) => doctor.ville)))
    .filter(Boolean)
    .sort()

  const filteredDoctors = doctors.filter((doctor) => {
    const fullName = `${doctor.nom} ${doctor.prenom}`.toLowerCase()
    const nameMatch = fullName.includes(searchTerm.toLowerCase())
    const cityMatch = selectedCity === "" || doctor.ville === selectedCity
    return nameMatch && cityMatch
  })

  const getImageUrl = (photoPath: string | null) => {
    if (!photoPath) return "/images/doctor-placeholder.jpg"

    try {
      if (photoPath.startsWith("http")) return photoPath
      const formattedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`
      return `http://localhost:8000${formattedPath}`
    } catch (error) {
      console.error("Error formatting image URL:", error)
      return "/images/doctor-placeholder.jpg"
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedCity("")
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gray-100 p-2 md:p-3 lg:p-4">
        <div className="relative w-full max-w-[95%] rounded-lg bg-white shadow-xl flex flex-col">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Our Doctors</span>
          </div>

          <div className="flex flex-col h-full">
            <div className="w-full p-4 md:p-6 flex flex-col">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Find a Doctor</h1>

              <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      Search by name
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Enter doctor name..."
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="md:w-1/3">
                    <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by city
                    </label>
                    <select
                      id="city-filter"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#2DD4BF]"
                    >
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(searchTerm || selectedCity) && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-[#2DD4BF] hover:text-[#20B8A2] focus:outline-none"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DD4BF]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          console.log("Doctor card clicked, ID:", doctor.id)
                          handleViewDoctorDetails(doctor.id)
                        }}
                      >
                        <div className="flex h-full flex-col">
                          <div className="relative h-48 w-full bg-gray-200">
                            {doctor.photo ? (
                              <Image
                                src={getImageUrl(doctor.photo) || "/placeholder.svg"}
                                alt={`${doctor.prenom} ${doctor.nom}`}
                                fill
                                unoptimized
                                style={{ objectFit: "cover" }}
                                onError={(e) => {
                                  console.error("Image failed to load:", doctor.photo)
                                  const target = e.target as HTMLImageElement
                                  target.src = "/images/doctor-placeholder.jpg"
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-gray-300 text-gray-600 text-2xl font-bold">
                                <span>
                                  {doctor.prenom[0]}
                                  {doctor.nom[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-grow p-4">
                            <h3 className="text-xl font-bold text-gray-900">{`Dr. ${doctor.nom} ${doctor.prenom}`}</h3>
                            <p className="text-sm text-[#2DD4BF] font-medium">{doctor.grade}</p>
                            <p className="mt-2 text-sm text-gray-600">{doctor.diplome}</p>
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">City:</span> {doctor.ville}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Address:</span> {doctor.adresse}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Contact:</span> {doctor.telephone}
                            </p>
                            <div className="mt-auto pt-4">
                              <button
                                onClick={(e) => handleBookAppointment(e, doctor.id)}
                                className="w-full rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-medium text-white hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                              >
                                Book Appointment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-gray-500">
                      No doctors found matching your search criteria. Please try different filters.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
