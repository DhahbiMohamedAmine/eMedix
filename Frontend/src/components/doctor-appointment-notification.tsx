"use client"

import { X, CheckCircle, Calendar, XCircle, PlusCircle } from "lucide-react"

interface DoctorAppointmentNotificationProps {
  type: "confirmed" | "modified" | "cancelled" | "new"
  appointmentDate: string
  patientName: string
  onDismiss: () => void
}

export function DoctorAppointmentNotification({
  type,
  appointmentDate,
  patientName,
  onDismiss,
}: DoctorAppointmentNotificationProps) {
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Get the appropriate icon and colors based on notification type
  const getNotificationStyles = () => {
    if (type === "confirmed") {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        title: "Appointment Confirmed",
        description: `${patientName} has confirmed their appointment on ${formatDate(appointmentDate)}.`,
        bgColor: "bg-green-50",
        borderColor: "border-l-4 border-green-500",
        textColor: "text-green-800",
      }
    } else if (type === "modified") {
      return {
        icon: <Calendar className="h-5 w-5 text-amber-500" />,
        title: "Appointment Modified",
        description: `${patientName} has requested a change to their appointment for ${formatDate(appointmentDate)}.`,
        bgColor: "bg-amber-50",
        borderColor: "border-l-4 border-amber-500",
        textColor: "text-amber-800",
      }
    } else if (type === "new") {
      return {
        icon: <PlusCircle className="h-5 w-5 text-primary-500" />,
        title: "New Appointment Request",
        description: `${patientName} has requested a new appointment for ${formatDate(appointmentDate)}.`,
        bgColor: "bg-primary-50",
        borderColor: "border-l-4 border-primary-500",
        textColor: "text-primary-800",
      }
    } else {
      return {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        title: "Appointment Cancelled",
        description: `${patientName} has cancelled their appointment scheduled for ${formatDate(appointmentDate)}.`,
        bgColor: "bg-red-50",
        borderColor: "border-l-4 border-red-500",
        textColor: "text-red-800",
      }
    }
  }

  const styles = getNotificationStyles()

  return (
    <div className={`rounded-md ${styles.bgColor} ${styles.borderColor} p-4 shadow-sm relative`}>
      <div className="flex">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-800">{styles.title}</h3>
          <div className="mt-1 text-sm text-gray-700">{styles.description}</div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 inline-flex h-8 w-8 items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
