"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Mail, MapPin, Phone, Award, GraduationCap, Building } from "lucide-react"

interface DoctorDetails {
  id: number
  user_id: number
  nom: string
  prenom: string
  telephone: string
  email: string
  isverified: boolean
  photo: string | null
  role: string
  date_naissance: string
  adresse: string
  diplome: string
  grade: string
  ville: string
}

interface DoctorDetailsProps {
  doctorId?: string | number
  showHeader?: boolean
  showFooter?: boolean
  showBackButton?: boolean
}

export default function DoctorDetails({ doctorId, showBackButton = true }: DoctorDetailsProps) {
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) {
        setError("No doctor ID provided")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`http://localhost:8000/users/medecin/${doctorId}`)
        if (!response.ok) {
          throw new Error(`Failed to load doctor details (Status: ${response.status})`)
        }
        const data = await response.json()
        setDoctorDetails(data)
      } catch (err) {
        console.error("Error fetching doctor details:", err)
        setError("Failed to load doctor details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctorDetails()
  }, [doctorId])

  const getImageUrl = (photoPath: string | null) => {
    if (!photoPath) return "/images/doctor-placeholder.jpg"

    try {
      // If it's already a full URL, return it
      if (photoPath.startsWith("http")) return photoPath

      // Make sure the path starts with a slash
      const formattedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`
      return `http://localhost:8000${formattedPath}`
    } catch (error) {
      console.error("Error formatting image URL:", error)
      return "/images/doctor-placeholder.jpg"
    }
  }

  const handleBookAppointment = () => {
    if (doctorDetails) {
      router.push(`/patient/appointment?doctor=${doctorDetails.id}`)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGetDirections = () => {
    if (doctorDetails?.adresse) {
      // Get the user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const userLocation = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = encodeURIComponent(doctorDetails.adresse);
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation}&destination=${destination}`;

          // Open Google Maps with the directions
          window.open(directionsUrl, "_blank");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }, (error) => {
          alert("Unable to retrieve your location. Please enable location services.");
        });
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    } else {
      alert("Doctor's address is unavailable.");
    }
  };

  return (
    <>
      {showBackButton && (
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center text-gray-600 hover:text-[#2DD4BF] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctors
        </button>
      )}

      {isLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-[#2DD4BF]"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="mt-4 rounded-md bg-[#2DD4BF] px-4 py-2 text-white hover:bg-[#20B8A2]"
            >
              Go Back
            </button>
          )}
        </div>
      ) : doctorDetails ? (
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Profile Image and Contact */}
          <div className="md:col-span-1">
            <div className="overflow-hidden rounded-xl bg-white shadow-md">
              <div className="h-40 bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6]"></div>
              <div className="relative px-6 pb-6">
                <div className="absolute -top-56 left-1/2 -translate-x-1/2 transform ">
                  {doctorDetails.photo ? (
                    <Image
                      src={getImageUrl(doctorDetails.photo) || "/placeholder.svg"}
                      alt={`Dr. ${doctorDetails.prenom} ${doctorDetails.nom}`}
                      width={120}
                      height={120}
                      unoptimized
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-3xl font-bold text-gray-600 shadow-lg">
                      {doctorDetails.prenom.charAt(0)}
                      {doctorDetails.nom.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-20 text-center">
                  <h1 className="text-2xl font-bold text-gray-800">{`Dr. ${doctorDetails.prenom} ${doctorDetails.nom}`}</h1>
                  <p className="text-[#2DD4BF]">{doctorDetails.grade}</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <Phone className="mr-3 h-5 w-5 text-[#2DD4BF]" />
                    <span>{doctorDetails.telephone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-3 h-5 w-5 text-[#2DD4BF]" />
                    <span className="truncate">{doctorDetails.email}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-5 w-5 shrink-0 text-[#2DD4BF]" />
                    <span>{doctorDetails.adresse}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="mr-3 h-5 w-5 text-[#2DD4BF]" />
                    <span>{doctorDetails.ville}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleBookAppointment}
                    className="w-full rounded-md bg-[#2DD4BF] py-3 text-center font-medium text-white shadow-md hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                  >
                    <Calendar className="mr-2 inline-block h-5 w-5" />
                    Book Appointment
                  </button>
                  <button
                    onClick={handleGetDirections}
                    className="mt-4 w-full rounded-md bg-[#2DD4BF] py-3 text-center font-medium text-white shadow-md hover:bg-[#20B8A2] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Professional Details */}
          <div className="md:col-span-2">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Professional Information</h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center">
                      <GraduationCap className="mr-3 h-5 w-5 text-[#2DD4BF]" />
                      <h3 className="text-lg font-medium text-gray-700">Education & Diploma</h3>
                    </div>
                    <p className="mt-2 pl-8 text-gray-600">{doctorDetails.diplome}</p>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <Award className="mr-3 h-5 w-5 text-[#2DD4BF]" />
                      <h3 className="text-lg font-medium text-gray-700">Grade & Specialization</h3>
                    </div>
                    <p className="mt-2 pl-8 text-gray-600">{doctorDetails.grade}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">About Doctor</h2>
                <p className="text-gray-600">
                  Dr. {doctorDetails.prenom} {doctorDetails.nom} is a highly qualified healthcare professional
                  specializing in {doctorDetails.grade}. With extensive education and training from prestigious
                  institutions, Dr. {doctorDetails.nom} is committed to providing exceptional patient care.
                </p>
                <p className="mt-4 text-gray-600">
                  Based in {doctorDetails.ville}, Dr. {doctorDetails.nom} has established a reputation for excellence in
                  the medical community. Patients appreciate their thorough approach, clear communication, and
                  dedication to achieving the best possible health outcomes.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Working Hours</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Monday - Friday</h3>
                    <p className="text-gray-600">9:00 AM - 5:00 PM</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Saturday</h3>
                    <p className="text-gray-600">9:00 AM - 1:00 PM</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Sunday</h3>
                    <p className="text-gray-600">Closed</p>
                  </div>
                </div>
                <p className="mt-4 text-sm italic text-gray-500">
                  * Working hours may vary. Please book an appointment to confirm availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-yellow-50 p-6 text-center">
          <p className="text-yellow-600">No doctor information available.</p>
          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="mt-4 rounded-md bg-[#2DD4BF] px-4 py-2 text-white hover:bg-[#20B8A2]"
            >
              Go Back
            </button>
          )}
        </div>
      )}
    </>
  )
}
