/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import type React from "react"

interface Tooth {
  id?: number
  tooth_code: string
  tooth_name: string
  note: string
  status?: string
}

export function DentalChartSVG({
  teeth,
  onToothClick,
  showPermanent,
  selectedToothCode,
}: {
  teeth: Tooth[]
  onToothClick: (toothCode: string) => void
  showPermanent: boolean
  selectedToothCode: string | null
}) {
  // Map to quickly look up tooth data by code
  const toothMap = teeth.reduce(
    (map, tooth) => {
      map[tooth.tooth_code] = tooth
      return map
    },
    {} as Record<string, Tooth>,
  )

  const handleToothClick = (e: React.MouseEvent<SVGGElement>, toothCode: string) => {
    e.stopPropagation() // Prevent event bubbling
    e.preventDefault()
    onToothClick(toothCode)
  }

  // Healthy tooth color (default)
  const healthyColor = "#4ade80" // green-500 from Tailwind

  // Function to get color based on tooth status
  const getToothColor = (toothCode: string): string => {
    const tooth = toothMap[toothCode]
    if (!tooth || !tooth.status) return healthyColor // Default to healthy color

    switch (tooth.status) {
      case "Healthy":
        return "#4ade80" // green-500
      case "Needs Attention":
        return "#eab308" // yellow-500
      case "Requires Treatment":
        return "#ef4444" // red-500
      case "Treatment Completed":
        return "#3b82f6" // blue-500
      default:
        return healthyColor
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <svg
        viewBox="0 0 500 650"
        width="100%"
        height="auto"
        xmlns="http://www.w3.org/2000/svg"
        onClick={() => console.log("SVG background clicked")}
      >
        {/* Upper Right (Quadrant 1) */}
        {/* Central Incisor (11) - SWAPPED POSITION WITH LATERAL INCISOR */}
        <g
          transform="translate(220, 75)"
          onClick={(e) => handleToothClick(e, "11")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "11" ? "#ff6b00" : getToothColor("11")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "11" ? "#ff6b00" : getToothColor("11")}
            strokeWidth="2"
          />
        </g>

        {/* Lateral Incisor (12) - SWAPPED POSITION WITH CENTRAL INCISOR */}
        <g
          transform="translate(170, 80)"
          onClick={(e) => handleToothClick(e, "12")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "12" ? "#ff6b00" : getToothColor("12")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "12" ? "#ff6b00" : getToothColor("12")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Canine (13) */}
        <g
          transform="translate(125, 90)"
          onClick={(e) => handleToothClick(e, "13")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "13" ? "#ff6b00" : getToothColor("13")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "13" ? "#ff6b00" : getToothColor("13")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left (Quadrant 2) */}
        {/* Lateral Incisor (22) - SWAPPED POSITION WITH CENTRAL INCISOR */}
        <g
          transform="translate(324, 80)"
          onClick={(e) => handleToothClick(e, "22")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "22" ? "#ff6b00" : getToothColor("22")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "22" ? "#ff6b00" : getToothColor("22")}
            strokeWidth="2"
          />
        </g>

        {/* Central Incisor (21) - SWAPPED POSITION WITH LATERAL INCISOR */}
        <g
          transform="translate(276, 75)"
          onClick={(e) => handleToothClick(e, "21")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "21" ? "#ff6b00" : getToothColor("21")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "21" ? "#ff6b00" : getToothColor("21")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Canine (23) */}
        <g
          transform="translate(370, 95)"
          onClick={(e) => handleToothClick(e, "23")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "23" ? "#ff6b00" : getToothColor("23")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="white"
            stroke={selectedToothCode === "23" ? "#ff6b00" : getToothColor("23")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right First Premolar (14) */}
        <g
          transform="translate(90, 120)"
          onClick={(e) => handleToothClick(e, "14")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "14" ? "#ff6b00" : getToothColor("14")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "14" ? "#ff6b00" : getToothColor("14")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left First Premolar (24) */}
        <g
          transform="translate(410, 120)"
          onClick={(e) => handleToothClick(e, "24")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "24" ? "#ff6b00" : getToothColor("24")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "24" ? "#ff6b00" : getToothColor("24")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Second Premolar (15) */}
        <g
          transform="translate(65, 158)"
          onClick={(e) => handleToothClick(e, "15")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "15" ? "#ff6b00" : getToothColor("15")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "15" ? "#ff6b00" : getToothColor("15")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Second Premolar (25) */}
        <g
          transform="translate(435, 158)"
          onClick={(e) => handleToothClick(e, "25")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "25" ? "#ff6b00" : getToothColor("25")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "25" ? "#ff6b00" : getToothColor("25")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right First Molar (16) */}
        <g
          transform="translate(50, 200)"
          onClick={(e) => handleToothClick(e, "16")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "16" ? "#ff6b00" : getToothColor("16")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "16" ? "#ff6b00" : getToothColor("16")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left First Molar (26) */}
        <g
          transform="translate(450, 200)"
          onClick={(e) => handleToothClick(e, "26")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "26" ? "#ff6b00" : getToothColor("26")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "26" ? "#ff6b00" : getToothColor("26")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Second Molar (17) */}
        <g
          transform="translate(45, 245)"
          onClick={(e) => handleToothClick(e, "17")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "17" ? "#ff6b00" : getToothColor("17")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "17" ? "#ff6b00" : getToothColor("17")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Second Molar (27) */}
        <g
          transform="translate(455, 245)"
          onClick={(e) => handleToothClick(e, "27")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "27" ? "#ff6b00" : getToothColor("27")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "27" ? "#ff6b00" : getToothColor("27")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Third Molar (18) */}
        <g
          transform="translate(45, 290)"
          onClick={(e) => handleToothClick(e, "18")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "18" ? "#ff6b00" : getToothColor("18")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "18" ? "#ff6b00" : getToothColor("18")}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Third Molar (28) */}
        <g
          transform="translate(455, 290)"
          onClick={(e) => handleToothClick(e, "28")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "28" ? "#ff6b00" : getToothColor("28")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "28" ? "#ff6b00" : getToothColor("28")}
            strokeWidth="2"
          />
        </g>

        {/* Labels */}
        <text x="30" y="333" fontSize="16" fontWeight="500" fill="#000">
          Right
        </text>
        <text x="440" y="333" fontSize="16" fontWeight="500" fill="#000">
          Left
        </text>

        {/* Lower Right (Quadrant 4) */}
        {/* Lower Right Third Molar (48) */}
        <g
          transform="translate(45, 370)"
          onClick={(e) => handleToothClick(e, "48")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "48" ? "#ff6b00" : getToothColor("48")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "48" ? "#ff6b00" : getToothColor("48")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Second Molar (47) */}
        <g
          transform="translate(45, 415)"
          onClick={(e) => handleToothClick(e, "47")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "47" ? "#ff6b00" : getToothColor("47")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "47" ? "#ff6b00" : getToothColor("47")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right First Molar (46) */}
        <g
          transform="translate(50, 460)"
          onClick={(e) => handleToothClick(e, "46")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "46" ? "#ff6b00" : getToothColor("46")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "46" ? "#ff6b00" : getToothColor("46")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Second Premolar (45) */}
        <g
          transform="translate(65, 502)"
          onClick={(e) => handleToothClick(e, "45")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "45" ? "#ff6b00" : getToothColor("45")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "45" ? "#ff6b00" : getToothColor("45")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right First Premolar (44) */}
        <g
          transform="translate(90, 540)"
          onClick={(e) => handleToothClick(e, "44")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "44" ? "#ff6b00" : getToothColor("44")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "44" ? "#ff6b00" : getToothColor("44")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Canine (43) */}
        <g
          transform="translate(125, 568)"
          onClick={(e) => handleToothClick(e, "43")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "43" ? "#ff6b00" : getToothColor("43")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "43" ? "#ff6b00" : getToothColor("43")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Lateral Incisor (42) */}
        <g
          transform="translate(170, 580)"
          onClick={(e) => handleToothClick(e, "42")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "42" ? "#ff6b00" : getToothColor("42")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "42" ? "#ff6b00" : getToothColor("42")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Central Incisor (41) */}
        <g
          transform="translate(220, 585)"
          onClick={(e) => handleToothClick(e, "41")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "41" ? "#ff6b00" : getToothColor("41")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "41" ? "#ff6b00" : getToothColor("41")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Central Incisor (31) */}
        <g
          transform="translate(280, 585)"
          onClick={(e) => handleToothClick(e, "31")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "31" ? "#ff6b00" : getToothColor("31")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "31" ? "#ff6b00" : getToothColor("31")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Lateral Incisor (32) */}
        <g
          transform="translate(330, 580)"
          onClick={(e) => handleToothClick(e, "32")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "32" ? "#ff6b00" : getToothColor("32")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "32" ? "#ff6b00" : getToothColor("32")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Canine (33) */}
        <g
          transform="translate(375, 568)"
          onClick={(e) => handleToothClick(e, "33")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "33" ? "#ff6b00" : getToothColor("33")}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="white"
            stroke={selectedToothCode === "33" ? "#ff6b00" : getToothColor("33")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left First Premolar (34) */}
        <g
          transform="translate(410, 540)"
          onClick={(e) => handleToothClick(e, "34")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "34" ? "#ff6b00" : getToothColor("34")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "34" ? "#ff6b00" : getToothColor("34")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Second Premolar (35) */}
        <g
          transform="translate(435, 502)"
          onClick={(e) => handleToothClick(e, "35")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "35" ? "#ff6b00" : getToothColor("35")}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "35" ? "#ff6b00" : getToothColor("35")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left First Molar (36) */}
        <g
          transform="translate(450, 460)"
          onClick={(e) => handleToothClick(e, "36")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "36" ? "#ff6b00" : getToothColor("36")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "36" ? "#ff6b00" : getToothColor("36")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Second Molar (37) */}
        <g
          transform="translate(455, 415)"
          onClick={(e) => handleToothClick(e, "37")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "37" ? "#ff6b00" : getToothColor("37")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "37" ? "#ff6b00" : getToothColor("37")}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Third Molar (38) */}
        <g
          transform="translate(455, 370)"
          onClick={(e) => handleToothClick(e, "38")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill="white"
            stroke={selectedToothCode === "38" ? "#ff6b00" : getToothColor("38")}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "38" ? "#ff6b00" : getToothColor("38")}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}
