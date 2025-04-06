/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import "../../../public/tailwind.css"
import { useState } from "react"
import { X, ChevronLeft, ChevronRight, Users, Calendar, Grid2X2 } from "lucide-react"
import { DentalChartSVG } from "@/pages/patient/dental-chart-svg"

export default function DentalApp() {
  const [showPermanent, setShowPermanent] = useState(true)
  const [selectedTooth, setSelectedTooth] = useState("Permanent Upper Right Lateral Incisor")

  return (
    <div className="max-w-md mx-auto bg-gray-50 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center p-2 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
            <button className="text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
            </button>
          </div>
          <div className="flex-1">
            <div className="font-medium">Amanda Smith</div>
            <div className="text-xs text-gray-500">Patient</div>
          </div>
        </div>
        <button className="ml-auto p-2">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <button>
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-6">
          <button>
            <Users size={20} className="text-gray-500" />
          </button>
          <button className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-900"
            >
              <path d="M12 22c-4.97 0-9-2.582-9-7v-.5C3 10 7.03 6 12 6s9 4 9 8.5v.5c0 4.418-4.03 7-9 7z" />
              <path d="M12 6v16" />
              <path d="M3 14h18" />
              <path d="M15 18h.01" />
              <path d="M9 18h.01" />
            </svg>
            <span className="text-sm font-medium">Dental Notes</span>
          </button>
          <button>
            <Calendar size={20} className="text-gray-500" />
          </button>
          <button>
            <Grid2X2 size={20} className="text-gray-500" />
          </button>
        </div>
        <button>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Selected Tooth Title */}
      <div className="py-2 px-4 bg-white border-b">
        <h2 className="text-sm font-medium text-gray-800">{selectedTooth}</h2>
      </div>

      {/* Tooth Chart */}
      <div className="flex-1 flex items-center justify-center p-4 bg-white">
        <DentalChartSVG />
      </div>

      {/* Toggle Options */}
      <div className="flex justify-between p-4 bg-white border-t">
        <label className="flex items-center gap-2">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={showPermanent}
              onChange={() => setShowPermanent(true)}
            />
            <div
              className={`w-5 h-5 border rounded flex items-center justify-center ${showPermanent ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
            >
              {showPermanent && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm">Show Permanent</span>
        </label>
        <label className="flex items-center gap-2">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={!showPermanent}
              onChange={() => setShowPermanent(false)}
            />
            <div
              className={`w-5 h-5 border rounded ${!showPermanent ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
            >
              {!showPermanent && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm">Show Primary</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-gray-200">
        <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          <span className="text-sm">Archive Patient</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-gray-400 text-white py-2 rounded">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="text-sm">Save</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded">
          <X size={16} />
          <span className="text-sm">Close</span>
        </button>
      </div>
    </div>
  )
}

