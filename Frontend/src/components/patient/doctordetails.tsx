"use client"
import Image from "next/image"
import { useState, useEffect } from "react"
import axios from "axios"

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
  annee_experience: number
}

interface DoctorDetailsPopupProps {
  isOpen: boolean
  doctorId: number | null
  onClose: () => void
}

export default function DoctorDetailsPopup({ isOpen, doctorId, onClose }: DoctorDetailsPopupProps) {
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchDoctorDetails(doctorId)
    }
  }, [isOpen, doctorId])

  const fetchDoctorDetails = async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(`http://localhost:8000/users/medecin/${id}`)
      setDoctorDetails(response.data)
    } catch (err) {
      console.error("Error fetching doctor details:", err)
      setError("Failed to load doctor details")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Doctor Details</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : doctorDetails ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                {doctorDetails.photo ? (
                 <Image
                 src={
                   doctorDetails.photo.startsWith("http")
                     ? doctorDetails.photo
                     : `http://localhost:8000${doctorDetails.photo}`
                 }
                 alt={`${doctorDetails.prenom} ${doctorDetails.nom}`}
                 width={120} // Ensure a fixed width
                 height={120} // Ensure a fixed height
                 unoptimized
                 className="w-28 h-28 rounded-full object-cover border-2 border-teal-500"
               />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-500 text-2xl font-bold">
                    {doctorDetails.prenom.charAt(0)}
                    {doctorDetails.nom.charAt(0)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium">{doctorDetails.prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium">{doctorDetails.nom}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium truncate" title={doctorDetails.email}>
                    {doctorDetails.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{doctorDetails.telephone}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{doctorDetails.adresse}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Diploma</p>
                  <p className="font-medium">{doctorDetails.diplome}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium">{doctorDetails.grade}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="font-medium">{doctorDetails.annee_experience} years</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic text-center">No doctor information available.</p>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
