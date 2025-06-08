"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "chart.js/auto"
import { useDictionary } from "@/components/admin/dictionary-provider"

interface AgeBucket {
  category: string
  count: number
}

export function PatientsByAge() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [ageData, setAgeData] = useState<AgeBucket[]>([])
  const [error, setError] = useState<string | null>(null)

  const dictionary = useDictionary()

  // Fetch age-category counts
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8000/stats/patients/count-by-age-category")
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data: AgeBucket[] = await res.json()
        setAgeData(data)
      } catch (err) {
        console.error("Failed to load age data:", err)
        setError("Unable to load chart data.")
      }
    }
    fetchData()
  }, [])

  // Build or update chart whenever ageData changes
  useEffect(() => {
    if (!chartRef.current) return

    // Clean up old chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Only draw if we have data
    if (ageData.length === 0) return

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ageData.map((b) => b.category),
        datasets: [
          {
            data: ageData.map((b) => b.count),
            backgroundColor: [
                "#f59e0b", // Amber
                "#3b82f6",
                "#ef4444", // Red
                "#10b981", // Teal
                "#8b5cf6", // Purple
                "#ec4899", // Pink
                "#f97316", // Orange
                "#22d3ee", // Cyan
              ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 15,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            cornerRadius: 4,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw}`,
            },
          },
        },
      },
    })

    return () => {
      chartInstance.current?.destroy()
    }
  }, [ageData])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{dictionary.dashboard.patientsByAge.title}</CardTitle>
        <p className="text-sm text-gray-500">{dictionary.dashboard.patientsByAge.subtitle}</p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <div className="h-[200px]">
            <canvas ref={chartRef} />
          </div>
        )}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-500">{dictionary.dashboard.updatedToday}</span>
        </div>
      </CardContent>
    </Card>
  )
}
