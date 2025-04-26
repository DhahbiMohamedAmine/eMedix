"use client"

import { useEffect, useRef, useState } from "react"
import { Download, ChevronDown, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chart } from "chart.js/auto"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/admin/dictionary-provider"

interface DoctorYearlyData {
  doctor: string
  monthly_counts: number[]
}

// Array of colors for the chart lines
const CHART_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#8b5cf6", // purple
  "#f43f5e", // red
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#d946ef", // fuchsia
  "#0ea5e9", // sky
  "#64748b", // slate
  "#10b981", // emerald
]

export function YearlyAppointmentsPerDoctor() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [data, setData] = useState<DoctorYearlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(2024)

  const dictionary = useDictionary()

  // Get current year for dropdown options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:8000/stats/appointments/per-doctor-yearly?year=${selectedYear}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const yearlyData = await response.json()
        setData(yearlyData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch yearly appointment data:", err)
        setError("Failed to load appointment data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedYear])

  useEffect(() => {
    if (!chartRef.current || loading || error || data.length === 0) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Sort doctors by total appointments (descending) and take top 10
    const topDoctors = [...data]
      .map((doctor) => ({
        ...doctor,
        total: doctor.monthly_counts.reduce((sum, count) => sum + count, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: topDoctors.map((doctor, index) => ({
          label: doctor.doctor,
          data: doctor.monthly_counts,
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: "circle",
            },
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
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              precision: 0,
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

  const handleExport = () => {
    if (!chartInstance.current) return

    // Create a temporary link element
    const link = document.createElement("a")
    link.download = `doctor-appointments-${selectedYear}.csv`

    // Create CSV content
    const headers = [
      "Doctor",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Total",
    ]
    const csvContent = [
      headers.join(","),
      ...data.map((doctor) => {
        const total = doctor.monthly_counts.reduce((sum, count) => sum + count, 0)
        return [doctor.doctor, ...doctor.monthly_counts, total].join(",")
      }),
    ].join("\n")

    // Create a Blob and generate a URL
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    // Set the URL to the link and trigger download
    link.href = url
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">{dictionary.dashboard.yearlyAppointments.title}</CardTitle>
          <p className="text-sm text-gray-500">{dictionary.dashboard.yearlyAppointments.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {selectedYear}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {yearOptions.map((year) => (
                <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)}>
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleExport}
            disabled={loading || error !== null || data.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>{dictionary.dashboard.yearlyAppointments.export}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {dictionary.dashboard.yearlyAppointments.noData} {selectedYear}
              </p>
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
