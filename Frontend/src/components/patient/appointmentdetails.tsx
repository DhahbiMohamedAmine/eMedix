import Image from "next/image"


interface Appointment {
  id: number
  name: string
  date: string
  time: string
  reason: string
}

interface AppointmentDetailsPopupProps {
  isOpen: boolean
  appointment: Appointment | null
  onClose: () => void
}

export default function AppointmentDetailsPopup({ isOpen, appointment, onClose }: AppointmentDetailsPopupProps) {
  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl overflow-hidden">
        <button onClick={onClose} className="rounded-full px-3 py-1 bg-red-500 absolute left-4 top-4 text-black-400 hover:text-gray-600 z-10">  
        X
        </button>

        {/* Partie 5 Banner */}
        <div className="absolute -right-2 -top-2 z-10 rotate-12 transform bg-[#2DD4BF] px-8 py-2 text-white shadow-md">
          <span className="text-lg font-semibold">Details</span>
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

          {/* Right side - Appointment Details */}
          <div className="w-full md:w-2/3 p-8">
            <h3 className="mb-6 text-3xl font-bold text-gray-900">Appointment Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-medium text-gray-900">{appointment.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-lg font-medium text-gray-900">{appointment.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-lg font-medium text-gray-900">{appointment.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="text-lg font-medium text-gray-900">{appointment.reason}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

