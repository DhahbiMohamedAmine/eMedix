"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Users, UserRound, Clock } from "lucide-react"
import { useDictionary } from "@/components/admin/dictionary-provider"

export function MedicalStatsCards() {
  const [appointmentsCount, setAppointmentsCount] = useState<string>("...")
  const [patientsCount, setPatientsCount] = useState<string>("...")
  const [doctorsCount, setDoctorsCount] = useState<string>("...")

  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [patientsError, setPatientsError] = useState<string | null>(null)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)

  const dictionary = useDictionary()

  useEffect(() => {
    // Fetch appointments count
    async function fetchAppointmentsCount() {
      try {
        setAppointmentsLoading(true)
        const response = await fetch("http://localhost:8000/stats/appointments/count")

        if (!response.ok) {
          throw new Error(`Error fetching appointments count: ${response.status}`)
        }

        const data = await response.json()
        setAppointmentsCount(new Intl.NumberFormat().format(data.count || 0))
        setAppointmentsError(null)
      } catch (err) {
        console.error("Failed to fetch appointments count:", err)
        setAppointmentsError("Failed to load appointments count")
        setAppointmentsCount("1,248") // Fallback value
      } finally {
        setAppointmentsLoading(false)
      }
    }

    // Fetch patients count
    async function fetchPatientsCount() {
      try {
        setPatientsLoading(true)
        const response = await fetch("http://localhost:8000/stats/patients/count")

        if (!response.ok) {
          throw new Error(`Error fetching patients count: ${response.status}`)
        }

        const data = await response.json()
        setPatientsCount(new Intl.NumberFormat().format(data.count || 0))
        setPatientsError(null)
      } catch (err) {
        console.error("Failed to fetch patients count:", err)
        setPatientsError("Failed to load patients count")
        setPatientsCount("5,430") // Fallback value
      } finally {
        setPatientsLoading(false)
      }
    }

    // Fetch doctors count
    async function fetchDoctorsCount() {
      try {
        setDoctorsLoading(true)
        const response = await fetch("http://localhost:8000/stats/medecins/count")

        if (!response.ok) {
          throw new Error(`Error fetching doctors count: ${response.status}`)
        }

        const data = await response.json()
        setDoctorsCount(new Intl.NumberFormat().format(data.count || 0))
        setDoctorsError(null)
      } catch (err) {
        console.error("Failed to fetch doctors count:", err)
        setDoctorsError("Failed to load doctors count")
        setDoctorsCount("24") // Fallback value
      } finally {
        setDoctorsLoading(false)
      }
    }

    // Fetch all data
    fetchAppointmentsCount()
    fetchPatientsCount()
    fetchDoctorsCount()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        title={dictionary.dashboard.stats.totalAppointments}
        value={appointmentsCount}
        icon={<Calendar className="h-6 w-6 text-white" />}
        iconBg="bg-blue-500"
        change="+12%"
        period={dictionary.dashboard.stats.thanLastMonth}
        changeColor="text-green-500"
        isLoading={appointmentsLoading}
        error={appointmentsError}
        dictionary={dictionary}
      />

      <StatCard
        title={dictionary.dashboard.stats.totalPatients}
        value={patientsCount}
        icon={<Users className="h-6 w-6 text-white" />}
        iconBg="bg-green-500"
        change="+5%"
        period={dictionary.dashboard.stats.thanLastMonth}
        changeColor="text-green-500"
        isLoading={patientsLoading}
        error={patientsError}
        dictionary={dictionary}
      />

      <StatCard
        title={dictionary.dashboard.stats.activeDoctors}
        value={doctorsCount}
        icon={<UserRound className="h-6 w-6 text-white" />}
        iconBg="bg-purple-500"
        change="+2"
        period={dictionary.dashboard.stats.newThisMonth}
        changeColor="text-green-500"
        isLoading={doctorsLoading}
        error={doctorsError}
        dictionary={dictionary}
      />

      <StatCard
        title={dictionary.dashboard.stats.avgWaitTime}
        value={`18 ${dictionary.dashboard.stats.min}`}
        icon={<Clock className="h-6 w-6 text-white" />}
        iconBg="bg-pink-500"
        change={`-3 ${dictionary.dashboard.stats.min}`}
        period={dictionary.dashboard.stats.thanLastMonth}
        changeColor="text-green-500"
        dictionary={dictionary}
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  iconBg: string
  change: string
  period: string
  changeColor: string
  isLoading?: boolean
  error?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  change,
  period,
  changeColor,
  isLoading,
  error,
  dictionary,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {isLoading ? (
            <div className="h-8 mt-1 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : error ? (
            <div className="text-sm text-red-500 mt-1">{dictionary.dashboard.stats.errorLoadingData}</div>
          ) : (
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          )}
          <div className={`mt-2 text-sm ${changeColor} flex items-center`}>
            <span>{change}</span>
            {period && <span className="text-gray-500 ml-1">{period}</span>}
          </div>
        </div>
        <div className={`${iconBg} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
