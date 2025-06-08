"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { Search, MapPin, Phone, Calendar, ChevronRight, X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
  isverified: boolean // Added isverified field
}

export default function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const router = useRouter()

  const handleViewDoctorDetails = (doctorId: number) => {
    console.log("Navigating to doctor details with ID:", doctorId)
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
        // Filter to only include verified doctors
        const verifiedDoctors = data.filter((doctor: Doctor) => doctor.isverified === true)
        setDoctors(verifiedDoctors)
      } catch (error) {
        console.error("Error fetching doctors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  const handleBookAppointment = (event: React.MouseEvent, doctorId: number) => {
    event.stopPropagation()
    router.push(`/patient/appointment?doctor=${doctorId}`)
  }

  const cities = Array.from(new Set(doctors.map((doctor) => doctor.ville)))
    .filter(Boolean)
    .sort()

  const filteredDoctors = doctors.filter((doctor) => {
    const fullName = `${doctor.nom} ${doctor.prenom}`.toLowerCase()
    const nameMatch = fullName.includes(searchTerm.toLowerCase())
    const cityMatch = selectedCity === "" || doctor.ville === selectedCity
    // Since we already filtered for verified doctors in useEffect, we don't need to check again here
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
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-neutral-100">
      <Header />

      {/* Hero Section with Colorful Background */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-32 right-12 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-12 left-1/3 w-48 h-48 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Find Your Perfect Doctor</h1>
            <p className="text-primary-100 max-w-2xl mx-auto text-lg">
              Browse our network of verified healthcare professionals and book your appointment today
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10 -mt-12 border border-primary-100 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-2">
              <label htmlFor="search" className="text-sm font-medium text-neutral-700">
                Doctor Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  className="pl-9 border-neutral-300 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-2">
              <label htmlFor="city-filter" className="text-sm font-medium text-neutral-700">
                Location
              </label>
              <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value === "all" ? "" : value)}>
                <SelectTrigger id="city-filter" className="border-neutral-300 focus:ring-primary-500 bg-white">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent
                  className="bg-white border border-gray-200 shadow-lg z-50"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  avoidCollisions={false}
                  position="popper"
                  style={{ transform: "translateY(0px)" }}
                >
                  <SelectItem value="all" className="bg-white hover:bg-gray-100 focus:bg-gray-100">
                    All Cities
                  </SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="bg-white hover:bg-gray-100 focus:bg-gray-100">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              {searchTerm || selectedCity ? (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              ) : (
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden border border-primary-100">
                <div className="h-48 bg-primary-50">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer group border border-primary-100"
                    onClick={() => handleViewDoctorDetails(doctor.id)}
                  >
                    <div className="relative h-56 w-full overflow-hidden">
                      {doctor.photo ? (
                        <Image
                          src={getImageUrl(doctor.photo) || "/placeholder.svg"}
                          alt={`Dr. ${doctor.prenom} ${doctor.nom}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/images/doctor-placeholder.jpg"
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-3xl font-bold">
                          <span>
                            {doctor.prenom[0]}
                            {doctor.nom[0]}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-0 left-0 w-full p-4 flex justify-between">
                        <Badge className="bg-secondary-500 hover:bg-secondary-600">{doctor.grade}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-white/80 text-neutral-700 hover:text-primary-500 hover:bg-white"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-neutral-800 group-hover:text-primary-600 transition-colors">
                          Dr. {doctor.prenom} {doctor.nom}
                        </h3>
                        <p className="text-sm text-primary-600 font-medium mt-1">{doctor.diplome}</p>
                      </div>

                      <div className="space-y-2 mb-6 bg-neutral-50 p-3 rounded-lg">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-neutral-600">
                            {doctor.adresse}, <span className="font-medium text-primary-700">{doctor.ville}</span>
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />
                          <p className="text-sm text-neutral-600">{doctor.telephone}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-600 hover:text-primary-600 p-0 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDoctorDetails(doctor.id)
                          }}
                        >
                          View Profile
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>

                        <Button
                          onClick={(e) => handleBookAppointment(e, doctor.id)}
                          className="bg-primary-500 hover:bg-primary-600 text-white"
                          size="sm"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow border border-primary-100">
                <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-medium text-neutral-800 mb-2">No verified doctors found</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  We couldnt find any verified doctors matching your search criteria. Please try different filters.
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}
