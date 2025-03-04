interface VerificationPopupProps {
  isOpen: boolean
  appointmentId: number | null
  appointmentName: string
  onConfirm: (appointmentId: number) => void
  onCancel: () => void
}

export default function VerificationPopup({
  isOpen,
  appointmentId,
  onConfirm,
  onCancel,
}: VerificationPopupProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    if (appointmentId !== null) {
      onConfirm(appointmentId) // Trigger the cancellation logic passed down from parent
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Confirm Cancellation</h3>
        <p className="mb-6 text-gray-700">
          Are you sure you want to cancel this appointment?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2"
          >
            No, Keep It
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

  
  