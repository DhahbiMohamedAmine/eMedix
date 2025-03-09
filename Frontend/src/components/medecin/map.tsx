"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"


// Extend the MapOptions type to include fullscreenControl
declare module "leaflet" {
  interface MapOptions {
    fullscreenControl?: boolean
    fullscreenControlOptions?: FullscreenOptions
  }
}

interface FullscreenOptions {
  position?: L.ControlPosition
}

interface MapProps {
  onMapClick: (lat: number, lng: number) => void
  currentLat: number
  currentLng: number
}

const Map: React.FC<MapProps> = ({ onMapClick, currentLat, currentLng }) => {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: "topleft",
        },
      }).setView([currentLat || 51.505, currentLng || -0.09], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current)

      // Create a custom icon using SVG
      const customIcon = L.divIcon({
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2DD4BF" width="36px" height="36px">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      markerRef.current = L.marker([currentLat || 51.505, currentLng || -0.09], { icon: customIcon }).addTo(
        mapRef.current,
      )

      mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        onMapClick(lat, lng)
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [onMapClick, currentLat, currentLng])

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([currentLat, currentLng])
      mapRef.current.setView([currentLat, currentLng], mapRef.current.getZoom())
    }
  }, [currentLat, currentLng])

  return <div id="map" style={{ height: "100%", width: "100%" }} />
}

export default Map

