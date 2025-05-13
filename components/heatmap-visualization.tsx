"use client"

import { useRef, useEffect, useState } from "react"
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

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

// Create a custom CanvasHeatmapLayer component
const CanvasHeatmapLayer = ({ data, maxIntensity = 10 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const map = useMap()
  
  useEffect(() => {
    if (!data || data.length === 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    // Function to update canvas on map move or zoom
    const updateCanvas = () => {
      if (!canvas || !ctx) return
      
      // Get current map bounds
      const mapSize = map.getSize()
      
      // Set canvas dimensions to match map
      canvas.width = mapSize.x
      canvas.height = mapSize.y
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw heatmap points
      data.forEach((item: { latitude: any; location: { latitude: any; longitude: any }; longitude: any; severity: number; detection: { highestSeverity: { toString: () => string }; totalDetections: number }; totalDetections: number }) => {
        // Check for location data in both direct and nested formats
        const latitude = item.latitude || item.location?.latitude
        const longitude = item.longitude || item.location?.longitude
        
        // Skip invalid location data
        if (!latitude || !longitude) return
        
        // Convert lat/lng to pixel coordinates
        const pixelPoint = map.latLngToContainerPoint([latitude, longitude])
        
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
        
        // Determine radius based on severity and zoom level
        const zoomFactor = Math.max(1, map.getZoom() / 10)
        const radius = (severity >= 7 ? 30 : severity >= 4 ? 25 : 20) * zoomFactor
        
        // Set color based on severity
        let color
        if (severity >= 7) {
          color = "#FF424F" // High - Red
        } else if (severity >= 4) {
          color = "#FF9E0D" // Medium - Orange
        } else {
          color = "#FFCD1C" // Low - Yellow
        }
        
        // Create and draw radial gradient
        const gradient = ctx.createRadialGradient(pixelPoint.x, pixelPoint.y, 0, pixelPoint.x, pixelPoint.y, radius)
        gradient.addColorStop(0, color.replace(')', ', 0.8)').replace('rgb', 'rgba'))
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(pixelPoint.x, pixelPoint.y, radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    
    // Initial render
    updateCanvas()
    
    // Add event listeners for map movements
    map.on('move', updateCanvas)
    map.on('zoom', updateCanvas)
    map.on('resize', updateCanvas)
    
    return () => {
      // Clean up event listeners
      map.off('move', updateCanvas)
      map.off('zoom', updateCanvas)
      map.off('resize', updateCanvas)
    }
  }, [map, data, maxIntensity])
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 z-10 pointer-events-none"
      style={{ 
        width: '100%',
        height: '100%'
      }}
    />
  )
}

const Legend = () => {
  return (
    <div className="absolute bottom-8 left-4 z-20 bg-black bg-opacity-70 p-3 rounded-md">
      <div className="text-white text-xs mb-1">Detection Severity</div>
      <div className="flex h-6 w-40">
        <div className="flex-1 h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500" />
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
  showMarkers?: boolean
  debug?: boolean
}

export function HeatmapVisualization({ 
  data = [], 
  center = [51.505, -0.09],
  zoom = 13,
  showMarkers = true,
  debug = false
}: HeatmapVisualizationProps) {

    console.log("data is  : ",data);


  // Initialize Leaflet map
  const [mapReady, setMapReady] = useState(false)
  const [processedData, setProcessedData] = useState([])
  
  // Process and normalize the data
  useEffect(() => {
    // Check if data is nested within a response object
    let dataToProcess = data
    
    // Some APIs wrap the data in a 'data' property
    if (typeof data === 'object' && !Array.isArray(data) && data?.data && Array.isArray(data.data)) {
      dataToProcess = data.data
    }
    
    // Normalize the data to a standard format
    const normalized = dataToProcess.map(item => {
      // Extract coordinates from possible locations in the structure
      const latitude = item.latitude || item.location?.latitude || 
                      (item.detection?.location?.latitude) || 
                      (item.location && parseFloat(item.location.latitude))
      
      const longitude = item.longitude || item.location?.longitude || 
                       (item.detection?.location?.longitude) || 
                       (item.location && parseFloat(item.location.longitude))
      
      // If we can't find valid coordinates, skip this item
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        return null
      }
      
      return {
        ...item,
        // Ensure a standard format with these key properties
        normalized: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          // Try to extract severity from different possible locations
          severity: item.severity || 
                   (item.detection?.highestSeverity ? 
                     (item.detection.highestSeverity.toString().toUpperCase() === "HIGH" ? 8 :
                      item.detection.highestSeverity.toString().toUpperCase() === "MEDIUM" ? 5 : 
                      item.detection.highestSeverity.toString().toUpperCase() === "LOW" ? 2 : 1) : 
                     (item.detection?.totalDetections || item.totalDetections || 1))
        }
      }
    }).filter(Boolean) // Remove null entries
    
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
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    } catch (e) {
      console.error("Error initializing Leaflet:", e)
    }
  }, [])
  
  // Calculate dynamic center point if data exists
  const mapCenter = (() => {
    if (processedData && processedData.length > 0) {
      // Use average lat/lng from valid data
      const latSum = processedData.reduce((sum, point) => 
        sum + point.normalized.latitude, 0)
      const lngSum = processedData.reduce((sum, point) => 
        sum + point.normalized.longitude, 0)
      
      return [latSum / processedData.length, lngSum / processedData.length] as [number, number]
    }
    return center
  })()
  
  const getSeverityColor = (severityValue) => {
    // Handle different formats of severity
    if (!severityValue) return "#808080"
    
    if (typeof severityValue === 'string') {
      const severity = severityValue.toString().toUpperCase();
      if (severity === "HIGH") return "#FF424F";
      if (severity === "MEDIUM") return "#FF9E0D";
      if (severity === "LOW") return "#FFCD1C";
      return "#808080";
    } else if (typeof severityValue === 'number') {
      if (severityValue >= 7) return "#FF424F";
      if (severityValue >= 4) return "#FF9E0D";
      return "#FFCD1C";
    }
    
    return "#808080";
  }
  
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
        <p>Raw data items: {data?.length || (data?.data?.length) || 0}</p>
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
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapResizer />
        
        {/* Canvas-based heatmap layer */}
        <CanvasHeatmapLayer data={processedData} />
        
        {/* Optional circle markers */}
        {showMarkers && processedData.map((point, index) => (
          <Circle
            key={point.id || `point-${index}`}
            center={[point.normalized.latitude, point.normalized.longitude]}
            radius={point.location?.accuracy || point.accuracyMeters || 10}
            pathOptions={{
              color: getSeverityColor(point.normalized.severity),
              fillColor: getSeverityColor(point.normalized.severity),
              fillOpacity: 0.3
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <strong>ID:</strong> {point.id || `Point ${index + 1}`}<br />
                <strong>User:</strong> {point.metadata?.username || point.username || "Unknown"}<br />
                <strong>Detections:</strong> {point.detection?.totalDetections || point.totalDetections || 0}<br />
                <strong>Severity:</strong> {point.detection?.highestSeverity || point.highestSeverity || "Unknown"}<br />
                <strong>Date:</strong> {(point.metadata?.createdAt || point.createdAt) ? 
                  new Date(point.metadata?.createdAt || point.createdAt).toLocaleDateString() : "Unknown"}
              </div>
            </Tooltip>
          </Circle>
        ))}
        
        <Legend />
      </MapContainer>
    </div>
  )
}
