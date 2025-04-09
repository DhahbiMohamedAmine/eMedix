/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import Header from "@/components/patient/header"
import Footer from "@/components/footer"
import { X, ChevronLeft, ChevronRight, Users, Calendar, Grid2X2 } from "lucide-react"

interface Tooth {
  id: number
  tooth_code: string
  tooth_name: string
  note: string
}

interface ToothNoteUpdate {
  note: string
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

  return (
    <div className="w-full max-w-md mx-auto bg-white">
      <svg
        viewBox="0 0 500 600"
        width="100%"
        height="auto"
        xmlns="http://www.w3.org/2000/svg"
        onClick={() => console.log("SVG background clicked")}
      >
        {/* Upper Right (Quadrant 1) */}
        {/* Central Incisor (11) */}
        <g
          transform="translate(170, 80)"
          onClick={(e) => handleToothClick(e, "11")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "11" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "11" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "11" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lateral Incisor (12) */}
        <g
          transform="translate(220, 75)"
          onClick={(e) => handleToothClick(e, "12")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "12" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "12" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "12" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left (Quadrant 2) */}
        {/* Lateral Incisor (22) */}
        <g
          transform="translate(280, 75)"
          onClick={(e) => handleToothClick(e, "22")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "22" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "22" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "22" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Central Incisor (21) */}
        <g
          transform="translate(330, 80)"
          onClick={(e) => handleToothClick(e, "21")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "21" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "21" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "21" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Canine (13) */}
        <g
          transform="translate(125, 95)"
          onClick={(e) => handleToothClick(e, "13")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "13" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "13" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "13" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Canine (23) */}
        <g
          transform="translate(375, 95)"
          onClick={(e) => handleToothClick(e, "23")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "23" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "23" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,-12 10,-12 12,0 L6,12 C0,16 -6,12 -12,0"
            fill="none"
            stroke={selectedToothCode === "23" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "14" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "14" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "14" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "24" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "24" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "24" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Second Premolar (15) */}
        <g
          transform="translate(65, 150)"
          onClick={(e) => handleToothClick(e, "15")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "15" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "15" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "15" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Second Premolar (25) */}
        <g
          transform="translate(435, 150)"
          onClick={(e) => handleToothClick(e, "25")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "25" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "25" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "25" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right First Molar (16) */}
        <g
          transform="translate(50, 190)"
          onClick={(e) => handleToothClick(e, "16")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "16" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "16" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "16" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left First Molar (26) */}
        <g
          transform="translate(450, 190)"
          onClick={(e) => handleToothClick(e, "26")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "26" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "26" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "26" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Second Molar (17) */}
        <g
          transform="translate(45, 235)"
          onClick={(e) => handleToothClick(e, "17")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "17" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "17" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "17" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Second Molar (27) */}
        <g
          transform="translate(455, 235)"
          onClick={(e) => handleToothClick(e, "27")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "27" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "27" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "27" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Right Third Molar (18) */}
        <g
          transform="translate(45, 280)"
          onClick={(e) => handleToothClick(e, "18")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "18" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "18" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "18" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Upper Left Third Molar (28) */}
        <g
          transform="translate(455, 280)"
          onClick={(e) => handleToothClick(e, "28")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "28" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "28" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "28" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Labels */}
        <text x="45" y="330" fontSize="16" fontWeight="500" fill="#000">
          Right
        </text>
        <text x="425" y="330" fontSize="16" fontWeight="500" fill="#000">
          Left
        </text>

        {/* Lower Right (Quadrant 4) */}
        {/* Lower Right Third Molar (48) */}
        <g
          transform="translate(45, 380)"
          onClick={(e) => handleToothClick(e, "48")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "48" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "48" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "48" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Second Molar (47) */}
        <g
          transform="translate(45, 425)"
          onClick={(e) => handleToothClick(e, "47")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "47" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "47" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "47" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right First Molar (46) */}
        <g
          transform="translate(50, 470)"
          onClick={(e) => handleToothClick(e, "46")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "46" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "46" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "46" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Second Premolar (45) */}
        <g
          transform="translate(65, 510)"
          onClick={(e) => handleToothClick(e, "45")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "45" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "45" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "45" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "44" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "44" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "44" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Right Canine (43) */}
        <g
          transform="translate(125, 565)"
          onClick={(e) => handleToothClick(e, "43")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "43" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "43" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "43" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "42" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "42" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "42" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "41" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "41" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "41" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "31" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "31" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "31" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "32" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "32" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "32" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Canine (33) */}
        <g
          transform="translate(375, 565)"
          onClick={(e) => handleToothClick(e, "33")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "33" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "33" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,0 C-10,12 10,12 12,0 L6,-12 C0,-16 -6,-12 -12,0"
            fill="none"
            stroke={selectedToothCode === "33" ? "#ff6b00" : "#999"}
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
            fill={selectedToothCode === "34" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "34" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "34" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Second Premolar (35) */}
        <g
          transform="translate(435, 510)"
          onClick={(e) => handleToothClick(e, "35")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "35" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "35" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M-12,-12 L12,12 M-12,12 L12,-12"
            fill="none"
            stroke={selectedToothCode === "35" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left First Molar (36) */}
        <g
          transform="translate(450, 470)"
          onClick={(e) => handleToothClick(e, "36")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "36" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "36" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "36" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Second Molar (37) */}
        <g
          transform="translate(455, 425)"
          onClick={(e) => handleToothClick(e, "37")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "37" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "37" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "37" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>

        {/* Lower Left Third Molar (38) */}
        <g
          transform="translate(455, 380)"
          onClick={(e) => handleToothClick(e, "38")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Larger transparent clickable area */}
          <circle cx="0" cy="0" r="25" fill="transparent" />
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={selectedToothCode === "38" ? "#ff6b00" : "none"}
            stroke={selectedToothCode === "38" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
          <path
            d="M0,-12 L0,12 M-12,0 L12,0 M-8,-8 L8,8 M-8,8 L8,-8"
            fill="none"
            stroke={selectedToothCode === "38" ? "#ff6b00" : "#999"}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

// Note Editor Component
function NoteEditor({
  tooth,
  onClose,
  onSave,
  showPermanent,
}: {
  tooth: Tooth | null
  onClose: () => void
  onSave: (note: string) => void
  showPermanent: boolean
}) {
  const [note, setNote] = useState(tooth?.note || "")

  if (!tooth) return null

  const toothName = showPermanent ? `Permanent ${tooth.tooth_name}` : tooth.tooth_name

  return (
    <div className="absolute bg-white rounded-md shadow-lg p-4 z-20 w-80 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-800">{toothName}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write notes here..."
        className="w-full border border-gray-300 rounded p-2 mb-3"
        autoFocus
      />
      <button
        onClick={() => onSave(note)}
        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
      >
        Save
      </button>
    </div>
  )
}

export default function DentalApp() {
  const [teeth, setTeeth] = useState<Tooth[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPermanent, setShowPermanent] = useState(true)
  const [selectedToothCode, setSelectedToothCode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const svgRef = useRef<SVGSVGElement>(null)

  // Fetch teeth data from API
  useEffect(() => {
    const fetchTeeth = async () => {
      setIsLoading(true)
      try {
        // Get patient ID from localStorage
        const patientData = localStorage.getItem("patientData")
        if (!patientData) {
          // For demo purposes, use a default patient ID
          console.warn("Patient data not found in localStorage, using default")
          const response = await fetch(`http://localhost:8000/tooth/patients/1/teeth`)
          if (!response.ok) {
            throw new Error("Failed to fetch teeth data")
          }

          const data = await response.json()
          setTeeth(data)
          return
        }

        const { patient_id } = JSON.parse(patientData)
        if (!patient_id) {
          throw new Error("Patient ID not found in patientData")
        }

        // Fetch teeth data from the API
        const response = await fetch(`http://localhost:8000/tooth/patients/${patient_id}/teeth`)
        if (!response.ok) {
          throw new Error("Failed to fetch teeth data")
        }

        const data = await response.json()
        setTeeth(data)
      } catch (error) {
        console.error("Error fetching teeth data:", error)
        // Fallback to sample data for demo purposes
        setTeeth([
          { id: 1, tooth_code: "11", tooth_name: "Upper Right Central Incisor", note: "" },
          { id: 2, tooth_code: "12", tooth_name: "Upper Right Lateral Incisor", note: "" },
          { id: 3, tooth_code: "13", tooth_name: "Upper Right Canine", note: "" },
          { id: 4, tooth_code: "14", tooth_name: "Upper Right First Premolar", note: "" },
          { id: 5, tooth_code: "15", tooth_name: "Upper Right Second Premolar", note: "" },
          { id: 6, tooth_code: "16", tooth_name: "Upper Right First Molar", note: "" },
          { id: 7, tooth_code: "17", tooth_name: "Upper Right Second Molar", note: "" },
          { id: 8, tooth_code: "18", tooth_name: "Upper Right Third Molar", note: "" },
          { id: 9, tooth_code: "21", tooth_name: "Upper Left Central Incisor", note: "" },
          { id: 10, tooth_code: "22", tooth_name: "Upper Left Lateral Incisor", note: "" },
          { id: 11, tooth_code: "23", tooth_name: "Upper Left Canine", note: "" },
          { id: 12, tooth_code: "24", tooth_name: "Upper Left First Premolar", note: "" },
          { id: 13, tooth_code: "25", tooth_name: "Upper Left Second Premolar", note: "" },
          { id: 14, tooth_code: "26", tooth_name: "Upper Left First Molar", note: "" },
          { id: 15, tooth_code: "27", tooth_name: "Upper Left Second Molar", note: "" },
          { id: 16, tooth_code: "28", tooth_name: "Upper Left Third Molar", note: "" },
          { id: 17, tooth_code: "31", tooth_name: "Lower Left Central Incisor", note: "" },
          { id: 18, tooth_code: "32", tooth_name: "Lower Left Lateral Incisor", note: "" },
          { id: 19, tooth_code: "33", tooth_name: "Lower Left Canine", note: "" },
          { id: 20, tooth_code: "34", tooth_name: "Lower Left First Premolar", note: "" },
          { id: 21, tooth_code: "35", tooth_name: "Lower Left Second Premolar", note: "" },
          { id: 22, tooth_code: "36", tooth_name: "Lower Left First Molar", note: "" },
          { id: 23, tooth_code: "37", tooth_name: "Lower Left Second Molar", note: "" },
          { id: 24, tooth_code: "38", tooth_name: "Lower Left Third Molar", note: "" },
          { id: 25, tooth_code: "41", tooth_name: "Lower Right Central Incisor", note: "" },
          { id: 26, tooth_code: "42", tooth_name: "Lower Right Lateral Incisor", note: "" },
          { id: 27, tooth_code: "43", tooth_name: "Lower Right Canine", note: "" },
          { id: 28, tooth_code: "44", tooth_name: "Lower Right First Premolar", note: "" },
          { id: 29, tooth_code: "45", tooth_name: "Lower Right Second Premolar", note: "" },
          { id: 30, tooth_code: "46", tooth_name: "Lower Right First Molar", note: "" },
          { id: 31, tooth_code: "47", tooth_name: "Lower Right Second Molar", note: "" },
          { id: 32, tooth_code: "48", tooth_name: "Lower Right Third Molar", note: "" },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeeth()
  }, [])

  // Handle tooth click
  const handleToothClick = (toothCode: string) => {
    setSelectedToothCode(toothCode)
  }

  // Close note editor
  const handleCloseNote = () => {
    setSelectedToothCode(null)
  }

  // Save note
  const handleSaveNote = async (note: string) => {
    if (!selectedToothCode) return

    const selectedTooth = teeth.find((tooth) => tooth.tooth_code === selectedToothCode)
    if (!selectedTooth) return

    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:8000/tooth/teeth/${selectedTooth.id}/note`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      })

      if (!response.ok) {
        throw new Error("Failed to update note")
      }

      // Update local state
      setTeeth((prevTeeth) => prevTeeth.map((tooth) => (tooth.id === selectedTooth.id ? { ...tooth, note } : tooth)))

      // Close the note editor
      setSelectedToothCode(null)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Get the selected tooth
  const selectedTooth = selectedToothCode ? teeth.find((tooth) => tooth.tooth_code === selectedToothCode) || null : null

  return (
    <main className="w-full bg-gray-100 min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow flex items-center justify-center bg-gray-100 p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              {/* You can add an image here if needed */}
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Dental Chart</h1>
              <p className="mt-2 text-white/80">View and manage patient dental records</p>
            </div>
          </div>

          <div className="p-6">
            {/* Patient Info */}
            <div className="flex items-center p-2 mb-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold">AS</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Amanda Smith</div>
                  <div className="text-xs text-gray-500">Patient</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-4 py-2 mb-4 border-b bg-white">
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-6">
                <button className="text-gray-500 hover:text-gray-700">
                  <Users size={20} />
                </button>
                <button className="flex items-center gap-2 text-cyan-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c-4.97 0-9-2.582-9-7v-.5C3 10 7.03 6 12 6s9 4 9 8.5v.5c0 4.418-4.03 7-9 7z" />
                    <path d="M12 6v16" />
                    <path d="M3 14h18" />
                    <path d="M15 18h.01" />
                    <path d="M9 18h.01" />
                  </svg>
                  <span className="text-sm font-medium">Dental Notes</span>
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Calendar size={20} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <Grid2X2 size={20} />
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cyan-600"></div>
              </div>
            )}

            {/* Tooth Chart */}
            {!isLoading && (
              <div
                className="flex items-center justify-center p-4 bg-white border rounded-lg shadow-sm mb-6 relative"
                ref={chartRef}
              >
                <DentalChartSVG
                  teeth={teeth}
                  onToothClick={handleToothClick}
                  showPermanent={showPermanent}
                  selectedToothCode={selectedToothCode}
                />

                {/* Note Editor */}
                {selectedTooth && (
                  <NoteEditor
                    tooth={selectedTooth}
                    onClose={handleCloseNote}
                    onSave={handleSaveNote}
                    showPermanent={showPermanent}
                  />
                )}
              </div>
            )}

            {/* Toggle Options */}
            <div className="flex justify-between p-4 bg-white border rounded-lg shadow-sm mb-6">
              <label className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showPermanent}
                    onChange={() => setShowPermanent(true)}
                  />
                  <div
                    className={`w-5 h-5 border rounded flex items-center justify-center ${
                      showPermanent ? "bg-cyan-500 border-cyan-500" : "border-gray-300"
                    }`}
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
                    className={`w-5 h-5 border rounded flex items-center justify-center ${
                      !showPermanent ? "bg-cyan-500 border-cyan-500" : "border-gray-300"
                    }`}
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
            <div className="grid grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <span className="text-sm font-medium">Archive Patient</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                disabled={isSaving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="text-sm font-medium">{isSaving ? "Saving..." : "Save"}</span>
              </button>
              <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors">
                <X size={16} />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

