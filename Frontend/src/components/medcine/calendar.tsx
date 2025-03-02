"use client"

import { SetStateAction, useState } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import AppointmentDetailsPopup from "@/components/medcine/appointmentDetails"

// Sample appointment data
const appointments = [
  { id: 1, name: "John Doe", date: "2023-06-15", time: "10:00", reason: "Check-up" },
  { id: 2, name: "Jane Smith", date: "2023-06-15", time: "14:30", reason: "Dental cleaning" },
  { id: 3, name: "Alice Johnson", date: "2023-06-17", time: "11:15", reason: "Eye exam" },
  { id: 4, name: "Bob Brown", date: "2023-06-18", time: "09:45", reason: "Physical therapy" },
  { id: 5, name: "Emma Wilson", date: "2023-06-19", time: "16:00", reason: "Vaccination" },
]

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "year">("month")
  const [editingAppointment, setEditingAppointment] = useState<number | null>(null)
  const [editTime, setEditTime] = useState<string>("")
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: number
    name: string
    date: string
    time: string
    reason: string
  } | null>(null)

  // Get appointments for a specific date
  const getAppointmentsForDate = (dateString: string) => {
    return appointments.filter((appointment) => appointment.date === dateString)
  }

  // Get appointment count for a specific date
  const getAppointmentCountForDate = (dateString: string) => {
    return appointments.filter((appointment) => appointment.date === dateString).length
  }

  // Get appointment count for a specific month
  const getAppointmentCountForMonth = (year: number, month: number) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      return appointmentDate.getFullYear() === year && appointmentDate.getMonth() === month
    }).length
  }

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, date: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]
      const hasAppointments = appointments.some((appointment) => appointment.date === dateString)

      days.push({
        day,
        date: dateString,
        hasAppointments,
      })
    }

    return days
  }

  // Navigate to previous month/year
  const prevPeriod = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - (viewMode === "month" ? 1 : 12), 1))
    setSelectedDate(null)
  }

  // Navigate to next month/year
  const nextPeriod = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (viewMode === "month" ? 1 : 12), 1))
    setSelectedDate(null)
  }

  // Jump to today's date
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date().toISOString().split("T")[0])
  }

  // Jump to a specific month and year
  const jumpToMonthYear = (month: number, year: number) => {
    setCurrentDate(new Date(year, month))
    setSelectedDate(null)
  }

  // Format month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  // Calendar days
  const calendarDays = generateCalendarDays()

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  // Render mini month for year view
  const renderMiniMonth = (monthIndex: number) => {
    const year = currentDate.getFullYear()
    const monthDate = new Date(year, monthIndex)
    const monthName = monthDate.toLocaleString("default", { month: "short" })

    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const miniCalendarDays = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      miniCalendarDays.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      miniCalendarDays.push(day)
    }

    const appointmentCount = getAppointmentCountForMonth(year, monthIndex)

    return (
      <div
        className="p-2 border rounded-lg hover:border-[#2DD4BF] cursor-pointer relative"
        onClick={() => {
          jumpToMonthYear(monthIndex, year)
          setViewMode("month")
        }}
      >
        <div className="text-center font-medium mb-1 text-gray-700">{monthName}</div>
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs text-gray-400">
              {day}
            </div>
          ))}
          {miniCalendarDays.map((day, i) => (
            <div key={i} className="text-center text-xs">
              {day || ""}
            </div>
          ))}
        </div>
        {appointmentCount > 0 && (
          <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-[#2DD4BF] flex items-center justify-center">
            <span className="text-xs text-white font-medium">{appointmentCount}</span>
          </div>
        )}
      </div>
    )
  }

  // Handle appointment time edit
  const handleEditTime = (id: number) => {
    const appointment = appointments.find((a) => a.id === id)
    if (appointment) {
      setEditingAppointment(id)
      setEditTime(appointment.time)
    }
  }

  // Save edited appointment time
  const saveEditedTime = (id: number) => {
    const appointmentIndex = appointments.findIndex((a) => a.id === id)
    if (appointmentIndex !== -1) {
      appointments[appointmentIndex].time = editTime
      setEditingAppointment(null)
    }
  }

  // Show appointment details
  const showAppointmentDetails = (appointment: SetStateAction<{ id: number; name: string; date: string; time: string; reason: string } | null>) => {
    setSelectedAppointment(appointment)
  }

  // Close appointment details popup
  const closeAppointmentDetails = () => {
    setSelectedAppointment(null)
  }

  return (
    <main className="w-full bg-gray-100 min-h-screen">
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-12 py-2 text-white shadow-md">
            <span className="text-lg font-semibold">Appointments</span>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left side - Image */}
            <div className="w-full md:w-1/3 h-64 md:h-auto relative">
              <Image
                src="/images/cap1.png"
                alt="Medical appointment illustration"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>

            {/* Right side - Calendar */}
            <div className="w-full md:w-2/3 p-8">
              <h1 className="mb-6 text-3xl font-bold text-gray-900">Calendrier des rendez-vous</h1>

              {/* Calendar navigation */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <button
                      onClick={prevPeriod}
                      className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
                      aria-label={`Previous ${viewMode}`}
                    ></button>
                    <h2 className="text-xl font-semibold text-gray-800 mx-2">
                      {viewMode === "month" ? formatMonthYear(currentDate) : currentDate.getFullYear()}
                    </h2>
                    <button
                      onClick={nextPeriod}
                      className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
                      aria-label={`Next ${viewMode}`}
                    ></button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={goToToday}
                      className="px-3 py-1 text-sm bg-[#2DD4BF] text-white rounded-md hover:bg-[#25B3A3] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
                    >
                      Today
                    </button>
                    <select
                      value={currentDate.getMonth()}
                      onChange={(e) => jumpToMonthYear(Number(e.target.value), currentDate.getFullYear())}
                      className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={currentDate.getFullYear()}
                      onChange={(e) => jumpToMonthYear(currentDate.getMonth(), Number(e.target.value))}
                      className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - 5 + i}>
                          {new Date().getFullYear() - 5 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Year at a glance - mini months */}
                {viewMode === "month" && (
                  <div className="hidden md:flex overflow-x-auto pb-2 mb-4 space-x-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(currentDate.getFullYear(), i)
                      const isCurrentViewMonth = i === currentDate.getMonth()
                      return (
                        <button
                          key={i}
                          onClick={() => jumpToMonthYear(i, currentDate.getFullYear())}
                          className={`flex-shrink-0 px-3 py-1 rounded-md text-sm ${
                            isCurrentViewMonth ? "bg-[#2DD4BF] text-white" : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {monthDate.toLocaleString("default", { month: "short" })}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex justify-end mb-4">
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1 text-sm ${viewMode === "month" ? "bg-[#2DD4BF] text-white" : "bg-white text-gray-700"}`}
                    onClick={() => setViewMode("month")}
                  >
                    Month
                  </button>
                  <button
                    className={`px-3 py-1 text-sm ${viewMode === "year" ? "bg-[#2DD4BF] text-white" : "bg-white text-gray-700"}`}
                    onClick={() => setViewMode("year")}
                  >
                    Year
                  </button>
                </div>
              </div>

              {/* Conditional rendering based on view mode */}
              {viewMode === "month" ? (
                <>
                  {/* Day names */}
                  <div className="grid grid-cols-7 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                      <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const appointmentCount = day.date ? getAppointmentCountForDate(day.date) : 0
                      return (
                        <div
                          key={index}
                          className={`
                            aspect-square p-1 border rounded-md relative
                            ${!day.day ? "bg-gray-50 border-gray-100" : "border-gray-200 hover:border-[#2DD4BF] cursor-pointer"}
                            ${selectedDate === day.date ? "border-[#2DD4BF] bg-[#E6FFFC]" : ""}
                          `}
                          onClick={() => day.date && setSelectedDate(day.date)}
                        >
                          {day.day && (
                            <>
                              <span className="text-sm font-medium">{day.day}</span>
                              {appointmentCount > 0 && (
                                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-[#2DD4BF] flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">{appointmentCount}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                // Year view
                <div className="grid grid-cols-3 gap-4">{Array.from({ length: 12 }, (_, i) => renderMiniMonth(i))}</div>
              )}

              {/* Selected day appointments */}
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    Appointments for{" "}
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>

                  {selectedDateAppointments.length === 0 ? (
                    <p className="text-gray-500 italic">No appointments scheduled for this day.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateAppointments.map((appointment) => (
                        <div key={appointment.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center mb-1">
                                <span className="font-medium text-gray-900">{appointment.name}</span>
                              </div>
                              <div className="flex items-center mb-1">
                                {editingAppointment === appointment.id ? (
                                  <input
                                    type="time"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className="text-sm text-gray-600 border rounded px-1"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-600">{appointment.time}</span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600">{appointment.reason}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {editingAppointment === appointment.id ? (
                                <button
                                  onClick={() => saveEditedTime(appointment.id)}
                                  className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                  Save
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditTime(appointment.id)}
                                    className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => showAppointmentDetails(appointment)}
                                    className="rounded-full bg-[#2DD4BF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#25B3A3] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
                                  >
                                    Details
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details Popup */}
      {selectedAppointment && (
        <AppointmentDetailsPopup appointment={selectedAppointment} onClose={closeAppointmentDetails} />
      )}

      <Footer />
    </main>
  )
}

