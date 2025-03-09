import React from "react";

interface Appointment {
  id: number;
  name: string;
  date: string;
  time: string;
  reason: string;
}

interface AppointmentDetailsPopupProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export default function AppointmentDetailsPopup({ appointment, onClose }: AppointmentDetailsPopupProps) {
  if (!appointment) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Patient</p>
            <p className="font-medium">{appointment.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{new Date(appointment.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            })}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium">{appointment.time}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Reason</p>
            <p className="font-medium">{appointment.reason}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2 bg-[#2DD4BF] text-white rounded-md hover:bg-[#25B3A3] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}