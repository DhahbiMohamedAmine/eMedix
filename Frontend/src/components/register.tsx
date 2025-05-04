"use client"

import "../../public/tailwind.css"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Register() {
  const [role, setRole] = useState<"patient" | "medecin" | "admin">("patient")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    password: "",
    photo: "" as string | File,
    // Patient specific fields
    date_naissance: "",
    // Medecin specific fields
    adresse: "",
    diplome: "",
    grade: "",
    ville: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleChange = (selectedRole: "patient" | "medecin" | "admin") => {
    setRole(selectedRole)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()

      // Add all text fields
      formDataToSend.append("nom", formData.nom)
      formDataToSend.append("prenom", formData.prenom)
      formDataToSend.append("telephone", formData.telephone)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("role", role)
      formDataToSend.append("isverified", "false")

      // Add photo if it exists and is a File
      if (formData.photo) {
        if (formData.photo instanceof File) {
          formDataToSend.append("photo", formData.photo)
        } else if (typeof formData.photo === "string" && formData.photo.trim() !== "") {
          formDataToSend.append("photo", formData.photo)
        }
      }

      // Add role-specific fields
      if (role === "patient") {
        if (!formData.date_naissance) {
          setError("Date of birth is required for patients")
          setIsSubmitting(false)
          return
        }
        formDataToSend.append("date_naissance", formData.date_naissance)
      } else if (role === "medecin") {
        if (!formData.adresse || !formData.diplome || !formData.grade || !formData.ville) {
          setError("All medical details are required for doctors")
          setIsSubmitting(false)
          return
        }
        formDataToSend.append("adresse", formData.adresse)
        formDataToSend.append("diplome", formData.diplome)
        formDataToSend.append("grade", formData.grade)
        formDataToSend.append("ville", formData.ville)
      }

      // Make API call to backend
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        body: formDataToSend, // Send FormData instead of JSON
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Registration failed")
      }

      await response.json()
      setSuccess("Registration successful! Please check your email for verification.")

      // Reset form after successful submission
      setFormData({
        nom: "",
        prenom: "",
        telephone: "",
        email: "",
        password: "",
        photo: "",
        date_naissance: "",
        adresse: "",
        diplome: "",
        grade: "",
        ville: "",
      })
    } catch (error) {
      console.error("Registration error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="w-full min-h-screen bg-gray-100">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left side - Image */}
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

        {/* Right side - Registration form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 overflow-auto">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Your Account</h2>

            {/* Success and error messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
            )}
            {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

            {/* Role selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">I am registering as a:</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange("patient")}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    role === "patient"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("medecin")}
                  className={`flex-1 py-2 px-4 rounded-md ${
                    role === "medecin"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common fields for all users */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Telephone
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Profile Photo (optional)
                </label>
                <div className="mt-1 flex items-center gap-4">
                  {formData.photo ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-300">
                      <Image
                        src={typeof formData.photo === "string" ? formData.photo : URL.createObjectURL(formData.photo)}
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
                    Browse...
                    <input
                      id="photo-upload"
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormData((prev) => ({
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

              {/* Role-specific fields */}
              {role === "patient" && (
                <div>
                  <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="date_naissance"
                    name="date_naissance"
                    value={formData.date_naissance}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}

              {role === "medecin" && (
                <>
                  <div>
                    <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      id="adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="diplome" className="block text-sm font-medium text-gray-700">
                      Diploma
                    </label>
                    <input
                      type="text"
                      id="diplome"
                      name="diplome"
                      value={formData.diplome}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                      Grade/Rank
                    </label>
                    <input
                      type="text"
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ville" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <select
                      id="ville"
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a city</option>
                      <option value="Tunis">Tunis</option>
                      <option value="Sfax">Sfax</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Kairouan">Kairouan</option>
                      <option value="Bizerte">Bizerte</option>
                      <option value="Gabès">Gabès</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Gafsa">Gafsa</option>
                      <option value="Monastir">Monastir</option>
                      <option value="Ben Arous">Ben Arous</option>
                      <option value="Kasserine">Kasserine</option>
                      <option value="Médenine">Médenine</option>
                      <option value="Nabeul">Nabeul</option>
                      <option value="Tataouine">Tataouine</option>
                      <option value="Béja">Béja</option>
                      <option value="Jendouba">Jendouba</option>
                      <option value="Kef">Kef</option>
                      <option value="Mahdia">Mahdia</option>
                      <option value="Sidi Bouzid">Sidi Bouzid</option>
                      <option value="Tozeur">Tozeur</option>
                      <option value="Zaghouan">Zaghouan</option>
                      <option value="Kebili">Kebili</option>
                      <option value="Siliana">Siliana</option>
                      <option value="Manouba">Manouba</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}