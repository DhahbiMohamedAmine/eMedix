"use client"
import { X, CheckCircle, AlertCircle } from "lucide-react"

interface AppointmentNotificationProps {
  type: "approved" | "modified"
  appointmentDate: string
  doctorName: string
  onDismiss: () => void
}

export function AppointmentNotification({
  type,
  appointmentDate,
  doctorName,
  onDismiss,
}: AppointmentNotificationProps) {
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
    if (type === "approved") {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        title: "Success",
        description: `Your appointment with ${doctorName} on ${formatDate(appointmentDate)} has been confirmed.`,
        bgColor: "bg-green-50",
        borderColor: "border-green-100",
        textColor: "text-green-800",
      }
    } else {
      return {
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        title: "Update",
        description: `Your appointment with ${doctorName} has been modified to ${formatDate(appointmentDate)}.`,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
        textColor: "text-amber-800",
      }
    }
  }

  const styles = getNotificationStyles()

  return (
    <div className={`rounded-md ${styles.bgColor} p-4 border ${styles.borderColor} shadow-sm relative`}>
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

