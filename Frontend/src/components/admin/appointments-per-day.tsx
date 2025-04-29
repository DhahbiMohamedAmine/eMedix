"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart } from "chart.js/auto"
import { useDictionary } from "@/components/admin/dictionary-provider"
import { useLanguage } from "@/contexts/language-context"

export function AppointmentsPerDay() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [appointmentsData, setAppointmentsData] = useState<number[]>([])

  const dictionary = useDictionary()
  const { language } = useLanguage()

  const days = {
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    fr: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    ar: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("http://localhost:8000/stats/appointments/count-by-weekday")
        const data = await response.json()

        // Transform backend data into the format we need
        const countsPerDay: { [key: string]: number } = {
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
          Sunday: 0,
        }

        data.forEach((item: { day: string; count: number }) => {
          countsPerDay[item.day] = item.count
        })

        const orderedData = [
          countsPerDay["Monday"],
          countsPerDay["Tuesday"],
          countsPerDay["Wednesday"],
          countsPerDay["Thursday"],
          countsPerDay["Friday"],
          countsPerDay["Saturday"],
          countsPerDay["Sunday"],
        ]

        setAppointmentsData(orderedData)
      } catch (error) {
        console.error("Failed to fetch appointments count:", error)
      }
    }

    fetchAppointments()
  }, [])

  useEffect(() => {
    if (!chartRef.current || appointmentsData.length === 0) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days[language as keyof typeof days],
        datasets: [
          {
            label: "Appointments",
            data: appointmentsData,
            backgroundColor: "#3b82f6",
            borderRadius: 4,
            barThickness: 12,
          },
        ],
      },
      options: {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentsData, language])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{dictionary.dashboard.appointmentsPerDay}</CardTitle>
        <p className="text-sm text-gray-500">{dictionary.dashboard.basedOnActualData}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <canvas ref={chartRef}></canvas>
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-xs text-gray-500">{dictionary.dashboard.updatedToday}</span>
        </div>
      </CardContent>
    </Card>
  )
}
