"use client"

import { useRef, useEffect, useState } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

// Dynamically import leaflet.heat
const loadHeatLayer = async () => {
  if (typeof window !== "undefined") {
    await import("leaflet.heat")
    return true
  }
  return false
}

interface HeatLayerProps {
  points:
    | Array<[number, number, number?]>
    | Array<{ lat: number; lng: number; intensity?: number }>
    | Array<{ latitude: number; longitude: number; severity?: number }>
  radius?: number
  blur?: number
  maxZoom?: number
  max?: number
  gradient?: Record<string, string>
}

export function HeatLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  max = 2,
  gradient = {
    0.1: "blue",
    0.3: "cyan",
    0.5: "lime",
    0.7: "yellow",
    0.9: "red",
  },
}: HeatLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.Layer | null>(null)
  const [isHeatLayerLoaded, setIsHeatLayerLoaded] = useState(false)

  // Load the heat library
  useEffect(() => {
    loadHeatLayer().then((result) => {
      setIsHeatLayerLoaded(result)
    })
  }, [])

  // Add the heat layer once library and points are available
  useEffect(() => {
    if (!isHeatLayerLoaded || !points || points.length === 0) return

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const options = {
      radius,
      blur,
      maxZoom,
      max,
      gradient,
    }

    // Format points for leaflet.heat
    const formattedPoints = points.map((point) => {
      // Handle different possible data formats
      if (Array.isArray(point)) {
        return point // Already in [lat, lng, intensity] format
      } else if ("lat" in point && "lng" in point) {
        return [point.lat, point.lng, point.intensity || 1]
      } else if ("latitude" in point && "longitude" in point) {
        return [point.latitude, point.longitude, point.severity || 1]
      }
      return [0, 0, 0] // fallback, should never happen
    })

    // Create and add the heat layer
    layerRef.current = (L as any).heatLayer(formattedPoints, options).addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, points, radius, blur, maxZoom, max, gradient, isHeatLayerLoaded])

  return null
}

// Add a Legend component that can be used with the heat layer
export function HeatmapLegend() {
  return (
    <div className="absolute bottom-6 right-4 z-40 bg-black bg-opacity-70 p-3 rounded-md">
      <div className="text-white text-xs mb-2 font-semibold">Pothole Intensity</div>
      <div className="flex h-6 w-48">
        <div className="flex-1 h-full bg-gradient-to-r from-blue-500 via-cyan-400 via-green-400 via-yellow-300 to-red-500" />
      </div>
      <div className="flex justify-between text-white text-xs mt-1">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  )
}
