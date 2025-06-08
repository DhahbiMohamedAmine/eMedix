"use client"

import "../../public/tailwind.css"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"

interface UserData {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  role: string
  photo: string
  access_token: string
  patient_id?: number
  date_naissance?: string
  medecin_id?: number
  adresse?: string
  diplome?: string
  grade?: string
  annee_experience?: number
  admin_id?: number
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted")

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const userData: UserData = await response.json()
        console.log("User Data:", userData)

        // Store all user data in localStorage
        localStorage.setItem("user", JSON.stringify(userData))

        // Store role-specific data and update individual IDs
        switch (userData.role) {
          case "patient":
            if (userData.patient_id && userData.date_naissance) {
              // Store patient data object
              localStorage.setItem(
                "patientData",
                JSON.stringify({
                  patient_id: userData.patient_id,
                  date_naissance: userData.date_naissance,
                }),
              )
              // Update the standalone patientId
              localStorage.setItem("patientId", userData.patient_id.toString())
            }
            router.push("/patient/doctorlist")
            break
          case "medecin":
            if (userData.medecin_id) {
              // Store medecin data object
              localStorage.setItem(
                "medecinData",
                JSON.stringify({
                  medecin_id: userData.medecin_id,
                  adresse: userData.adresse,
                  diplome: userData.diplome,
                  grade: userData.grade,
                  annee_experience: userData.annee_experience,
                }),
              )
              // Update the standalone doctorId
              localStorage.setItem("doctorId", userData.medecin_id.toString())
            }
            router.push("/medecin/Calendar")
            break
          case "admin":
            if (userData.admin_id) {
              localStorage.setItem(
                "adminData",
                JSON.stringify({
                  admin_id: userData.admin_id,
                }),
              )
            }
            router.push("/admin/dashboard")
            break
          default:
            setError("Unknown user role")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "An error occurred while logging in.")
      }
    } catch (err) {
      console.error("Connection error:", err)
      setError("An error occurred while connecting to the server.")
    }
  }

  return (
    <main className="w-full min-h-screen bg-gray-100">
      <div className="flex flex-col md:flex-row h-screen">
        <div className="w-full md:w-1/2 relative">
          <Image
            src="/images/banner.png"
            alt="eMedix Healthcare"
            layout="fill"
            objectFit="cover"
            className="opacity-80"
          />
          <div className="absolute inset-0 bg-blue-500 opacity-60"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Link href="/" className="text-white font-bold text-4xl">
              eMedix
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Login to Your Account</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <div className="text-red-500 mb-4">{error}</div>}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="text-sm">
                <Link href="/request-reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Sign in
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Don t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
