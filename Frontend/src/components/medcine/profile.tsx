"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import Header from "../../components/header"
import Footer from "../../components/footer"
import { useRouter } from "next/router"
import axios from "axios"

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("../medcine/map"), { ssr: false })

export default function ProfilePage() {
  const [coordinates, setCoordinates] = useState({ lat: 51.505, lng: -0.09 })

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng })
  }
  const router = useRouter()
  const [medcine, setMedecin] = useState({
    id: "",
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    photo: "" as string | File,
    adresse: "",
    diplome:"",
    grade:"",
    annee_experience:""
  })

  const [medecinId, setMedecinId] = useState(null)

  // Fetch patientId from localStorage
  useEffect(() => {
    const storedMedecinData = localStorage.getItem("medecinData")

    if (storedMedecinData) {
      const parsedData = JSON.parse(storedMedecinData)
      if (parsedData.medecin_id) {
        setMedecinId(parsedData.medecin_id)
      }
    }
    
  }, [])

  // Fetch Patient Data when patientId is set
  useEffect(() => {
    console.log(medecinId)
    if (!medecinId) return

    const fetchMedecin = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/profile/medcine/${medecinId}`)
        const data = response.data

        setMedecin({
          id: data.id || "",
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          password: data.password,
          telephone: data.telephone || "",
          photo: data.photo || "",
          adresse: data.adresse || "",
          diplome: data.diplome||"",
          grade: data.grade||"",
          annee_experience: data.annee_experience||"" 
        })
  
      } catch (error) {
        console.error("Error fetching patient data:", error)
      }
    }

    fetchMedecin()
  }, [medecinId])

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMedecin({ ...medcine, [e.target.id]: e.target.value })
    console.log(medcine)
  }

  // Handle Form Submission (Update Patient)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (medcine.password && medcine.password.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    try {
      console.log(medcine)
      const formData = new FormData()
      formData.append("nom", medcine.nom)
      formData.append("prenom", medcine.prenom)
      formData.append("telephone", medcine.telephone)
      formData.append("email", medcine.email)
      if (medcine.password && medcine.password !== medcine.email) {
        formData.append("password", medcine.password)
      }
      if (medcine.photo instanceof File) {
        formData.append("photo", medcine.photo)
      }
      const response = await axios.put(`http://localhost:8000/profile/updatemedecin/${medecinId}`, formData, {
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
                                {medcine.photo ? (
                                  <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-300">
                                    <Image
                                      src={typeof medcine.photo === "string" ? medcine.photo : URL.createObjectURL(medcine.photo)}
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
                                        setMedecin((prev) => ({
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
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="nom"
                      value={`${medcine.nom} ${medcine.prenom}`}
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
                      value={medcine.email}
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
                      value={medcine.telephone}
                      onChange={handleChange}
                      className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
                    />
                  </div>
                  <div className="space-y-2">
  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
    Address
  </label>
  <div className="flex gap-4">
    <div className="w-1/2">
      <label htmlFor="addressx" className="block text-sm font-medium text-gray-700">
        X:
      </label>
      <input
        type="text"
        id="addressx"
        defaultValue={coordinates.lat.toFixed(4)}
        className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
      />
    </div>
    <div className="w-1/2">
      <label htmlFor="addressy" className="block text-sm font-medium text-gray-700">
        Y:
      </label>
      <input
        type="text"
        id="addressy"
        defaultValue={coordinates.lng.toFixed(4)}
        className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
      />
    </div>
  </div>
</div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location (Click on the map)</label>
                    <div className="h-64 w-full rounded-md overflow-hidden">
                      <Map onMapClick={handleMapClick} currentLat={coordinates.lat} currentLng={coordinates.lng} />
                    </div>
                    <p className="text-sm text-gray-500">
                      Coordinates: Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="space-y-2">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    New Password
  </label>
  <input
    type="password"
    id="password"
    onChange={handleChange}
    placeholder="Enter new password"
    className="w-full rounded-md border px-4 py-3 focus:border-[#2DD4BF] focus:ring-[#2DD4BF]/20"
  />
  <p className="text-sm text-gray-500">Leave blank to keep your current password.</p>
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
        </div>
      </section>

      <Footer />
    </main>
  )
}