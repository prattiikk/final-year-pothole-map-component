"use client"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

import { useRef, useEffect, useState } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Dynamically import leaflet.heat on client side only
const loadHeatLayer = async () => {
  // Dynamic import for client-side only code
  if (typeof window !== "undefined") {
    await import("leaflet.heat")
    return true
  }
  return false
}

// Force the Leaflet map to properly render in Next.js
const MapResizer = () => {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 0)
  }, [map])
  return null
}

// Custom React wrapper for Leaflet.heat
const HeatLayer = ({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  max = 10,
  gradient = null,
}: {
  points: Array<[number, number, number]>; // [lat, lng, intensity]
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  gradient?: Record<number, string> | null;
}) => {
  const map = useMap()
  const layerRef = useRef<L.HeatLayer | null>(null)
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
      gradient: gradient || {
        0.1: "blue",
        0.3: "cyan",
        0.5: "lime",
        0.7: "yellow",
        0.9: "red",
      },

    }






    // Ensure points are in the correct format for Leaflet.heat
    const formattedPoints = points.map((point) => {
      // Handle different possible data formats
      if (Array.isArray(point)) {
        return point // Already in [lat, lng, intensity] format
      } else if (point.lat !== undefined && point.lng !== undefined) {
        return [point.lat, point.lng, point.intensity || 1]
      } else if (point.latitude !== undefined && point.longitude !== undefined) {
        return [point.latitude, point.longitude, point.severity || 1]
      }
      return point
    })

    layerRef.current = L.heatLayer(formattedPoints, options).addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, points, radius, blur, maxZoom, max, gradient, isHeatLayerLoaded])

  return null
}







// Legend component
const Legend = () => {
  return (
    <div className="absolute bottom-6 left-4 z-40 bg-black bg-opacity-70 p-3 rounded-md ">
      <div className="text-white text-xs mb-2 font-semibold">Detection Intensity</div>
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








interface HeatmapVisualizationProps {
  data: any[] // Using any to flexibly handle different data structures
  center?: [number, number]
  zoom?: number
  showPoints?: boolean
  debug?: boolean
  // Heatmap specific options
  radius?: number
  blur?: number
  maxZoom?: number
  interaction?: boolean
}




export function HeatmapVisualization({
  data = [],
  center = [51.505, -0.09],
  zoom = 13,
  // showPoints = false,
  debug = false,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  interaction = false,

}: HeatmapVisualizationProps) {
  // Initialize Leaflet map
  const [mapReady, setMapReady] = useState(false)
  const [processedData, setProcessedData] = useState([])

  // Process and normalize the data
  useEffect(() => {
    // Check if data is nested within a response object
    let dataToProcess = data

    // Some APIs wrap the data in a 'data' property
    if (data?.data && Array.isArray(data.data)) {
      dataToProcess = data.data
    }

    // Normalize the data to a standard format
    const normalized = dataToProcess
      .map((item) => {
        // Extract coordinates from possible locations in the structure
        const latitude =
          item.latitude ||
          item.location?.latitude ||
          item.detection?.location?.latitude ||
          (item.location && Number.parseFloat(item.location.latitude))

        const longitude =
          item.longitude ||
          item.location?.longitude ||
          item.detection?.location?.longitude ||
          (item.location && Number.parseFloat(item.location.longitude))

        // If we can't find valid coordinates, skip this item
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          return null
        }

        // Calculate severity - handle different possible structures
        let severity = 1

        // Check for severity in different possible locations in structure
        if (item.severity) {
          severity = item.severity
        } else if (item.detection?.highestSeverity) {
          const severityStr = item.detection.highestSeverity.toString().toUpperCase()
          if (severityStr === "HIGH") severity = 8
          else if (severityStr === "MEDIUM") severity = 5
          else if (severityStr === "LOW") severity = 2
        } else if (item.detection?.totalDetections) {
          severity = Math.min(10, Math.max(1, item.detection.totalDetections))
        } else if (item.totalDetections) {
          severity = Math.min(10, Math.max(1, item.totalDetections))
        }

        return {
          ...item,
          // Ensure a standard format with these key properties
          normalized: {
            latitude: Number.parseFloat(latitude),
            longitude: Number.parseFloat(longitude),
            severity: severity,
            // Keep original data for tooltip display
            tooltip: {
              id: item.id || "Unknown",
              username: item.metadata?.username || item.username || "Unknown",
              totalDetections: item.detection?.totalDetections || item.totalDetections || 0,
              highestSeverity: item.detection?.highestSeverity || item.highestSeverity || "Unknown",
              createdAt:
                item.metadata?.createdAt || item.createdAt
                  ? new Date(item.metadata?.createdAt || item.createdAt).toLocaleDateString()
                  : "Unknown",
            },
          },
        }
      })
      .filter(Boolean) // Remove null entries

    setProcessedData(normalized)

    if (debug) {
      console.log("Raw data:", data)
      console.log("Processed data:", normalized)
      console.log("Found valid points:", normalized.length)
    }
  }, [data, debug])

  useEffect(() => {
    // Ensure Leaflet is only used on the client side
    setMapReady(true)

    try {
      // Fix the Leaflet icon issue in Next.js
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })
    } catch (e) {
      console.error("Error initializing Leaflet:", e)
    }
  }, [])

  // Calculate dynamic center point if data exists
  const mapCenter = (() => {
    if (processedData && processedData.length > 0) {
      // Use average lat/lng from valid data
      const latSum = processedData.reduce((sum, point) => sum + point.normalized.latitude, 0)
      const lngSum = processedData.reduce((sum, point) => sum + point.normalized.longitude, 0)

      return [latSum / processedData.length, lngSum / processedData.length] as [number, number]
    }
    return center
  })()

  // Format data for leaflet.heat
  // Format: [[lat, lng, intensity], [lat, lng, intensity], ...]
  const heatmapPoints = processedData.map((point) => [
    point.normalized.latitude,
    point.normalized.longitude,
    point.normalized.severity, // The weight/intensity value
  ])

  // Show loading state while waiting for client-side rendering
  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Loading map visualization...</p>
      </div>
    )
  }

  // Show debug info if enabled
  if (debug) {
    return (
      <div className="w-full h-full flex flex-col bg-gray-900 text-white p-4 overflow-auto">
        <h3 className="text-lg mb-2">Debug Information</h3>
        <p>Raw data items: {data?.length || data?.data?.length || 0}</p>
        <p>Processed valid points: {processedData.length}</p>
        <p>First few points:</p>
        <pre className="bg-gray-800 p-2 overflow-auto max-h-96 text-xs">
          {JSON.stringify(processedData.slice(0, 2), null, 2)}
        </pre>
        <p className="mt-4">Raw data sample:</p>
        <pre className="bg-gray-800 p-2 overflow-auto max-h-96 text-xs">
          {JSON.stringify(Array.isArray(data) ? data.slice(0, 1) : data?.data?.slice(0, 1) || data, null, 2)}
        </pre>
      </div>
    )
  }

  // Show a message if no valid data points were found
  if (processedData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400">
        <p>No valid location data available for visualization</p>
        <p className="text-sm mt-2">Enable debug mode to see more information</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: "100%", width: "100%" }} className="z-0"
        scrollWheelZoom={!interaction}
        dragging={!interaction}
        doubleClickZoom={!interaction}
        zoomControl={!interaction}
        touchZoom={!interaction}
        keyboard={!interaction}
        attributionControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapResizer />

        {/* Heatmap layer using leaflet.heat */}
        <HeatLayer points={heatmapPoints} radius={radius} blur={blur} maxZoom={maxZoom} />
        <Legend />
      </MapContainer>
    </div>
  )
}
