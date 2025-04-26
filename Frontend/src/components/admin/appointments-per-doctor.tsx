"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "chart.js/auto"
import { Loader2 } from "lucide-react"
import { useDictionary } from "@/components/admin/dictionary-provider"

interface DoctorAppointment {
  doctor: string
  count: number
}

export function AppointmentsPerDoctor() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [data, setData] = useState<DoctorAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dictionary = useDictionary()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:8000/stats/appointments/count-by-doctors")

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const appointmentData = await response.json()
        setData(appointmentData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch appointment data:", err)
        setError("Failed to load appointment data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!chartRef.current || loading || error) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((item) => item.doctor),
        datasets: [
          {
            label: "Appointments",
            data: data.map((item) => item.count),
            backgroundColor: "#8b5cf6",
            borderRadius: 4,
            barThickness: 12,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            cornerRadius: 4,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              precision: 0,
              stepSize: 1,
            },
            suggestedMax: Math.max(...data.map((item) => item.count)) + 1,
          },
          y: {
            grid: {
              display: false,
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, loading, error])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{dictionary.dashboard.appointmentsPerDoctor}</CardTitle>
        <p className="text-sm text-gray-500">{dictionary.dashboard.lastMonthDistribution}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : (
            <canvas ref={chartRef}></canvas>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-500">{dictionary.dashboard.updatedToday}</span>
        </div>
      </CardContent>
    </Card>
  )
}
