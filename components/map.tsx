"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type L from "leaflet"
import { debounce } from "lodash"
import { Navigation, MapPin, Calendar, AlertTriangle } from "lucide-react"

interface Pothole {
  id: number
  latitude: number
  longitude: number
  image_url: string
  severity?: string
  reported_at?: string
}

const PotholeMap = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [potholes, setPotholes] = useState<Pothole[]>([])
  const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]) // Default to India
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const mapRef = useRef<L.Map | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MIN_FETCH_INTERVAL = 15000 // Minimum 15 seconds between API calls

  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(userLocation)
          setMapCenter([userLocation.lat, userLocation.lng])
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting initial location:", error)
          setError("Failed to get your location. Using default map view.")
          setIsLoading(false)
        },
        { enableHighAccuracy: true },
      )
    }
  }, [])

  // Function to get color based on severity
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "#FF424F" // Uber red
      case "medium":
        return "#FF9E0D" // Orange
      case "low":
        return "#FFCD1C" // Yellow
      default:
        return "#276EF1" // Uber blue
    }
  }

  const getSeverityRadius = (severity?: string) => {
    switch (severity) {
      case "high":
        return 10
      case "medium":
        return 8
      case "low":
        return 6
      default:
        return 8
    }
  }

  // Function to fetch potholes data
  const fetchPotholes = (lat: number, lng: number) => {
    const now = Date.now()
    // If we've fetched too recently, schedule a future fetch and return
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }

      fetchTimeoutRef.current = setTimeout(
        () => {
          fetchPotholes(lat, lng)
        },
        MIN_FETCH_INTERVAL - (now - lastFetchTime),
      )

      return
    }

    setIsLoading(true)
    setLastFetchTime(now)

    // API call
    fetch(`/api/pothole?lat=${lat}&lng=${lng}`)
      .then((res) => {
        if (!res.ok) {
          // If API returns 404, generate mock data for testing instead of failing
          if (res.status === 404) {
            console.log("API endpoint not found. Using mock data instead.")
            return generateMockPotholes(lat, lng)
          }
          throw new Error(`API error: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setPotholes(data)
        setIsLoading(false)
        setError(null)
      })
      .catch((err) => {
        console.error("Error fetching potholes:", err)

        // If fetch completely fails, still provide mock data for testing
        const mockData = generateMockPotholes(lat, lng)
        setPotholes(mockData)

        setError("Using test data: API unavailable")
        setIsLoading(false)
      })
  }

  // Generate mock pothole data for testing when API is unavailable
  const generateMockPotholes = (lat: number, lng: number): Pothole[] => {
    return [
      {
        id: 1,
        latitude: lat + 0.002,
        longitude: lng + 0.003,
        image_url: "https://www.thestructuralengineer.info/images/news/Large-Pothole.jpeg",
        severity: "high",
        reported_at: new Date().toISOString(),
      },
      {
        id: 2,
        latitude: lat - 0.001,
        longitude: lng + 0.001,
        image_url: "https://images.theconversation.com/files/442675/original/file-20220126-19-1i2t7mk.jpg",
        severity: "medium",
        reported_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: 3,
        latitude: lat + 0.0015,
        longitude: lng - 0.002,
        image_url: "https://www.tcsinc.org/wp-content/uploads/2021/08/pothole-road.jpg",
        severity: "low",
        reported_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        id: 4,
        latitude: lat - 0.0025,
        longitude: lng - 0.001,
        image_url:
          "https://media.istockphoto.com/id/1307113302/photo/deep-and-wide-water-filled-pot-holes-hampering-safe-transport-along-local-community-access.jpg",
        severity: "high",
        reported_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      },
      {
        id: 5,
        latitude: lat + 0.003,
        longitude: lng - 0.003,
        image_url: "https://www.fox29.com/wp-content/uploads/2022/04/Pothole-City-Ave.jpg",
        severity: "medium",
        reported_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      },
    ]
  }

  // Create a debounced version of fetchPotholes
  const debouncedFetchPotholes = useRef(
    debounce((lat: number, lng: number) => {
      fetchPotholes(lat, lng)
    }, 1000),
  ).current

  // Fetch potholes when location is set
  useEffect(() => {
    if (location) {
      debouncedFetchPotholes(location.lat, location.lng)
    }

    // Cleanup function to cancel any pending timeouts
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [location, debouncedFetchPotholes])

  const LocationMarker = () => {
    const lastUpdateTime = useRef(0)
    const updateInterval = 15000 // 15 seconds

    const map = useMapEvents({
      locationfound(e) {
        const now = Date.now()
        if (now - lastUpdateTime.current > updateInterval) {
          lastUpdateTime.current = now
          setLocation(e.latlng)
        }
      },
      moveend() {
        // Only fetch new data if we aren't already loading
        if (!isLoading) {
          const center = map.getCenter()

          // Use debounced fetch to prevent excessive calls
          debouncedFetchPotholes(center.lat, center.lng)
        }
      },
    })

    useEffect(() => {
      mapRef.current = map

      interface GeoPosition {
        coords: {
          latitude: number
          longitude: number
        }
      }

      const geoSuccess = (position: GeoPosition) => {
        const now = Date.now()
        if (now - lastUpdateTime.current > updateInterval) {
          lastUpdateTime.current = now
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(newLocation)
          map.flyTo(newLocation, map.getZoom())
        }
      }

      const geoError = (error: GeolocationPositionError) => {
        console.error("Error getting location:", error)
      }

      const geoOptions = { enableHighAccuracy: true }

      const watcher = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions)

      return () => navigator.geolocation.clearWatch(watcher)
    }, [map])

    // Return blue circle for current location
    return location ? (
      <CircleMarker
        center={location}
        radius={6}
        pathOptions={{ color: "#276EF1", fillColor: "#276EF1", fillOpacity: 1 }}
      />
    ) : null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else {
      return `${diffDays} days ago`
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md z-10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-800">Pothole Map</h1>
          <p className="text-sm text-gray-500">Showing {potholes.length} potholes in your area</p>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar for legend */}
        <aside className="w-48 bg-white shadow-md z-10 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Severity Legend</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FF424F" }}></div>
                <span className="text-sm text-gray-700">High</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FF9E0D" }}></div>
                <span className="text-sm text-gray-700">Medium</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FFCD1C" }}></div>
                <span className="text-sm text-gray-700">Low</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Map area */}
        <main className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-70 text-white px-3 py-2 text-xs rounded-lg">
              Loading...
            </div>
          )}

          {error && (
            <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-3 py-2 text-xs rounded-lg">
              {error}
            </div>
          )}

          <MapContainer center={mapCenter} zoom={15} className="h-full w-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <LocationMarker />
            {potholes.map((pothole) => (
              <CircleMarker
                key={pothole.id}
                center={[pothole.latitude, pothole.longitude]}
                radius={getSeverityRadius(pothole.severity)}
                pathOptions={{
                  color: getSeverityColor(pothole.severity),
                  fillColor: getSeverityColor(pothole.severity),
                  fillOpacity: 0.8,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setSelectedPothole(pothole),
                }}
              />
            ))}
          </MapContainer>

          {location && (
            <button
              className="absolute bottom-4 right-4 z-10 bg-white rounded-full p-3 shadow-lg"
              onClick={() => {
                if (mapRef.current && location) {
                  mapRef.current.flyTo([location.lat, location.lng], 15)
                }
              }}
            >
              <Navigation size={20} className="text-gray-700" />
            </button>
          )}
        </main>
      </div>

      {/* Footer for pothole details */}
      <footer className="bg-white shadow-md z-10">
        {selectedPothole ? (
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Pothole #{selectedPothole.id}</h2>
                <div className="flex items-center">
                  <MapPin size={14} className="text-gray-500 mr-1" />
                  <span className="text-sm text-gray-500">
                    {selectedPothole.latitude.toFixed(6)}, {selectedPothole.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setSelectedPothole(null)}>
                <span className="text-xl font-medium text-gray-700">×</span>
              </button>
            </div>

            <div className="flex space-x-4 mb-4">
              <img
                src={selectedPothole.image_url || "/placeholder.svg"}
                alt="Pothole"
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                  <AlertTriangle
                    size={16}
                    className="mr-2"
                    style={{ color: getSeverityColor(selectedPothole.severity) }}
                  />
                  <div>
                    <div className="text-xs text-gray-500">Severity</div>
                    <div className="font-medium" style={{ color: getSeverityColor(selectedPothole.severity) }}>
                      {selectedPothole.severity
                        ? selectedPothole.severity.charAt(0).toUpperCase() + selectedPothole.severity.slice(1)
                        : "Unknown"}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Reported</div>
                    <div className="font-medium text-gray-800">
                      {selectedPothole.reported_at ? formatDate(selectedPothole.reported_at) : "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="w-full bg-black text-white py-2 rounded-lg font-medium"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo([selectedPothole.latitude, selectedPothole.longitude], 17)
                  setSelectedPothole(null)
                }
              }}
            >
              Navigate to Pothole
            </button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-700">
              {potholes.length > 0 ? "Tap on a pothole marker to see details" : "No potholes found in this area"}
            </p>
          </div>
        )}
      </footer>
    </div>
  )
}

export default PotholeMap

