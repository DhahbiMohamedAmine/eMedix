"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation" // Import useSearchParams
import Image from "next/image"
import Header from "./header"
import Footer from "../../components/footer"

interface PatientData {
  patient_id: number
  date_naissance: string
}

export default function AppointmentForm() {
  const searchParams = useSearchParams()
const medecin_id = searchParams?.get("doctor")// Extract doctor ID from URL

  const [patientId, setPatientId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")

  useEffect(() => {
    // Get and parse patientData from localStorage
    const storedPatientData = localStorage.getItem("patientData")
    if (storedPatientData) {
      try {
        const data: PatientData = JSON.parse(storedPatientData)
        setPatientId(data.patient_id)
      } catch (error) {
        console.error("Error parsing patient data:", error)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!patientId) {
      alert("Patient ID not found. Please log in again.");
      return;
    }
  
    if (!selectedDate) {
      alert("Please select a date for your appointment.");
      return;
    }
  
    if (!medecin_id) {
      alert("Doctor ID is missing from the URL.");
      return;
    }
  
    const formattedDate = new Date(selectedDate).toISOString().split(".")[0];
  
    const appointmentData = {
      patient_id: patientId,
      date: formattedDate,
    };
  
    console.log("Sending appointment data:", appointmentData);
  
    try {
      const response = await fetch(`http://localhost:8000/appointments/addappointment/${medecin_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });
  
      console.log("Response status:", response.status);
      const responseData = await response.json().catch(() => null);
      console.log("Response data:", responseData);
  
      if (!response.ok) {
        throw new Error(responseData?.message || "Failed to schedule appointment.");
      }
  
      alert("Appointment scheduled successfully!");
      setSelectedDate("");
    } catch (error) {
      console.error("Error submitting appointment:", error);
      alert( "An error occurred. Please try again.");
    }
  };
  
  

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointment</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative w-full h-full overflow-hidden rounded-l-lg">
              <Image src="/images/cap1.png" alt="Medical appointment illustration" fill style={{ objectFit: "cover" }} priority />
            </div>

            <div className="p-8 md:p-12">
              <h1 className="mb-8 text-3xl font-bold text-gray-900">Prendre un rendez-vous</h1>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
                    Entrer l horaire souhaité
                  </label>
                  <input
                    id="datetime"
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-[#2DD4BF] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#2DD4BF]/90 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 active:bg-[#2DD4BF]/80"
                >
                  Soumettre
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}