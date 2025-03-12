"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { LogOut, User } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface UserData {
  photo?: string
  prenom: string
  nom: string
}

export default function HeaderComponent() {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const storedUserData = localStorage.getItem("user")
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData)
        setUserData(parsedData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("medecinData")
    router.push("/login")
    setShowDropdown(false)
  }

  const getPhotoUrl = () => {
    if (!userData || !userData.photo) return null
    return userData.photo.startsWith("http") ? userData.photo : `http://localhost:8000${userData.photo}`
  }

  return (
    <header className="bg-blue-500 text-white px-4 py-4">
      <div className="container mx-auto flex items-center">
        {/* Logo - Left aligned with some right margin */}
        <Link href="/home" className="text-white font-bold text-2xl mr-auto">
          eMedix
        </Link>

        {/* Navigation Links - Right aligned but before the profile */}
        <div className="flex space-x-6 mr-6">
          <Link href="/home" className="text-white hover:text-blue-200">
            Home
          </Link>
          <Link href="/medicament" className="text-white hover:text-blue-200">
            Medicaments
          </Link>
          <Link href="/appointmentlist" className="text-white hover:text-blue-200">
            My appointments
          </Link>
          <Link href="/patient/appointment" className="text-white hover:text-blue-200">
            All doctors
          </Link>
        </div>

        {/* User Profile - Far right */}
        <div className="relative">
          <button className="flex items-center focus:outline-none" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-blue-400">
              {userData && userData.photo ? (
                <Image
                  src={getPhotoUrl() || "/placeholder.svg"}
                  alt={`${userData.prenom} ${userData.nom}`}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <Link
                href="/medcine/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

