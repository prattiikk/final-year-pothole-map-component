"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, CircleMarker, useMapEvents, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type L from "leaflet"
import { debounce } from "lodash"
import { Navigation, MapPin, Calendar, AlertTriangle, X, ChevronUp, ChevronDown, Search } from "lucide-react"

interface Pothole {
  id: string
  latitude: number
  longitude: number
  severity: number
  reportedBy: string
  img: string
  dateReported: string
}

const PotholeMap = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [potholes, setPotholes] = useState<Pothole[]>([])
  const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]) // Default to India
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [isLegendOpen, setIsLegendOpen] = useState(true)
  const [locationName, setLocationName] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [lastFetchedCoords, setLastFetchedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MIN_FETCH_INTERVAL = 15000 // Minimum 15 seconds between API calls
  const SIGNIFICANT_MOVE_DISTANCE = 0.02 // Approximately 2km
  const locationInitializedRef = useRef(false)

  // Get user location once when component mounts
  useEffect(() => {
    if (navigator.geolocation && !locationInitializedRef.current) {
      locationInitializedRef.current = true
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(userLocation)
          setMapCenter([userLocation.lat, userLocation.lng])
          fetchLocationName(userLocation.lat, userLocation.lng)
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting initial location:", error)
          setError("Failed to get your location. Using default map view.")
          setIsLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    }

    // Cleanup on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await response.json()
      setLocationName(data.display_name)
    } catch (error) {
      console.error("Error fetching location name:", error)
      setLocationName("Unknown Location")
    }
  }

  // Search for a location by name
  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const firstResult = data[0]
        const lat = Number.parseFloat(firstResult.lat)
        const lng = Number.parseFloat(firstResult.lon)

        // Update the map view
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15)
          // Clear search field after successful search
          setSearchQuery("")
        }
      } else {
        setError("No locations found. Try a different search term.")
        setTimeout(() => setError(null), 3000)
      }
    } catch (error) {
      console.error("Error searching for location:", error)
      setError("Error searching for location. Please try again.")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSearching(false)
    }
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  // Check if we've moved significantly from the last fetch location
  const hasMovedSignificantly = (lat: number, lng: number) => {
    if (!lastFetchedCoords) return true

    const distance = calculateDistance(lat, lng, lastFetchedCoords.lat, lastFetchedCoords.lng)

    return distance > SIGNIFICANT_MOVE_DISTANCE
  }

  // Function to get color based on severity
  const getSeverityColor = (severity?: number) => {
    if (severity === undefined) return "#276EF1" // Uber blue (default)

    if (severity >= 7) return "#FF424F" // High - Uber red
    if (severity >= 4) return "#FF9E0D" // Medium - Orange
    return "#FFCD1C" // Low - Yellow
  }

  const getSeverityRadius = (severity?: number) => {
    if (severity === undefined) return 8 // Default

    if (severity >= 7) return 10 // High
    if (severity >= 4) return 8 // Medium
    return 6 // Low
  }

  // Get severity label from number
  const getSeverityLabel = (severity?: number) => {
    if (severity === undefined) return "Unknown"
    if (severity >= 7) return "High"
    if (severity >= 4) return "Medium"
    return "Low"
  }

  // Generate mock pothole data for testing when API is unavailable
  const generateMockPotholes = (lat: number, lng: number): Pothole[] => {
    return [
      {
        id: "1",
        latitude: lat + 0.002,
        longitude: lng + 0.003,
        img: "https://www.thestructuralengineer.info/images/news/Large-Pothole.jpeg",
        severity: 8,
        reportedBy: "user123",
        dateReported: new Date().toISOString(),
      },
      {
        id: "2",
        latitude: lat - 0.001,
        longitude: lng + 0.001,
        img: "https://images.theconversation.com/files/442675/original/file-20220126-19-1i2t7mk.jpg",
        severity: 5,
        reportedBy: "user456",
        dateReported: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: "3",
        latitude: lat + 0.0015,
        longitude: lng - 0.002,
        img: "https://www.tcsinc.org/wp-content/uploads/2021/08/pothole-road.jpg",
        severity: 3,
        reportedBy: "user789",
        dateReported: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        id: "4",
        latitude: lat - 0.0025,
        longitude: lng - 0.001,
        img: "https://media.istockphoto.com/id/1307113302/photo/deep-and-wide-water-filled-pot-holes-hampering-safe-transport-along-local-community-access.jpg",
        severity: 9,
        reportedBy: "user101",
        dateReported: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      },
      {
        id: "5",
        latitude: lat + 0.003,
        longitude: lng - 0.003,
        img: "https://www.fox29.com/wp-content/uploads/2022/04/Pothole-City-Ave.jpg",
        severity: 6,
        reportedBy: "user202",
        dateReported: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      },
    ]
  }

  // Function to fetch potholes data
  const fetchPotholes = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now()

      // Check if we've moved significantly from the last fetch location
      if (!hasMovedSignificantly(lat, lng) && lastFetchedCoords) {
        console.log("Not moved significantly, skipping fetch")
        return
      }

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
      setLastFetchedCoords({ lat, lng })

      // Try to fetch from API, fallback to mock data in case of issues
      fetch(`/api/pothole?lat=${lat}&lng=${lng}&radius=10000`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          console.log("API data received:", data.data)
          let fetched_data = data.data

          // If we still have no valid data, use mock data
          if (fetched_data.length === 0) {
            console.log("No potholes in API response, using mock data")
            fetched_data = generateMockPotholes(lat, lng)
            setError("Using test data: No real potholes found")
          } else {
            setError(null)
          }

          console.log("Processed potholes:", fetched_data)
          setPotholes(fetched_data)
        })
        .catch((err) => {
          console.error("Error fetching potholes:", err)
          // Use mock data when API fails
          console.log("Using mock data due to API error")
          const mockData = generateMockPotholes(lat, lng)
          setPotholes(mockData)
          setError("Using test data: API unavailable")
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [lastFetchTime, lastFetchedCoords, hasMovedSignificantly],
  ) // Dependencies

  // Create a debounced version of fetchPotholes that persists across renders
  const debouncedFetchPotholes = useRef(
    debounce((lat: number, lng: number) => {
      fetchPotholes(lat, lng)
    }, 1000),
  ).current

  // Fetch potholes when map center changes
  const updateMapData = useCallback(
    (lat: number, lng: number) => {
      debouncedFetchPotholes(lat, lng)
      fetchLocationName(lat, lng)
    },
    [debouncedFetchPotholes],
  )

  // LocationMarker component for handling map events and displaying user location
  const LocationMarker = () => {
    const map = useMapEvents({
      moveend() {
        if (!isLoading) {
          const center = map.getCenter()
          updateMapData(center.lat, center.lng)
        }
      },
      load() {
        mapRef.current = map
        // Center map on user location if available
        if (location) {
          map.setView([location.lat, location.lng], 15, { animate: false })
          updateMapData(location.lat, location.lng)
        }
      },
    })

    // Set map reference once available
    useEffect(() => {
      if (map && !mapRef.current) {
        mapRef.current = map
      }
    }, [map])

    // Center map when location changes (only on first location set)
    useEffect(() => {
      if (mapRef.current && location && !locationInitializedRef.current) {
        locationInitializedRef.current = true
        mapRef.current.setView([location.lat, location.lng], 15, { animate: false })
        updateMapData(location.lat, location.lng)
      }
    }, [location])

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
    try {
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
    } catch (e) {
      return "Unknown date" + e
    }
  }

  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      if (debouncedFetchPotholes && typeof debouncedFetchPotholes.cancel === "function") {
        debouncedFetchPotholes.cancel()
      }
    }
  }, [debouncedFetchPotholes])

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocation(searchQuery)
  }

  // Ensure potholes is always an array to avoid mapping errors
  const safePotholes = Array.isArray(potholes) ? potholes : []

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 z-20 p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold">Pothole Map</h1>
            <p className="text-sm text-gray-400">Current Location: {locationName}</p>
            <p className="text-sm text-gray-400">Showing {safePotholes.length} potholes in your area</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a location..."
                  className="bg-gray-900 text-white border border-gray-700 rounded-lg py-2 px-4 pr-10 w-full focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  disabled={isSearching}
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Current location button */}
            {location && (
              <button
                className="bg-white text-black rounded-lg px-3 py-2 flex items-center"
                onClick={() => {
                  if (mapRef.current && location) {
                    mapRef.current.setView([location.lat, location.lng], 15, {
                      animate: true,
                      duration: 0.5,
                    })
                  }
                }}
              >
                <Navigation size={16} className="mr-1" />
                <span>My Location</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map area */}
        <div className="absolute inset-0 z-0">
          <MapContainer center={mapCenter} zoom={15} className="h-full w-full" zoomControl={false} preferCanvas={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <LocationMarker />
            {safePotholes.map((pothole) => (
              <CircleMarker
                key={pothole.id}
                center={[pothole.latitude, pothole.longitude]}
                radius={getSeverityRadius(pothole.severity)}
                pathOptions={{
                  color: getSeverityColor(pothole.severity),
                  fillColor: getSeverityColor(pothole.severity),
                  fillOpacity: 0.6,
                  weight: 1,
                }}
                eventHandlers={{
                  click: () => setSelectedPothole(pothole),
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-semibold">Pothole #{pothole.id}</p>
                      <p className="text-xs">Severity: {getSeverityLabel(pothole.severity)}</p>
                      <p className="text-xs">Reported: {formatDate(pothole.dateReported)}</p>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* UI Elements */}
        {/* Legend */}
        <div
          className={`absolute bottom-4 right-4 z-30 bg-black bg-opacity-80 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${isLegendOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          <button
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-black bg-opacity-80 px-4 py-2 rounded-t-lg z-30"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            {isLegendOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-2">Severity Legend</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FF424F" }}></div>
                <span className="text-sm">High (7-10)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FF9E0D" }}></div>
                <span className="text-sm">Medium (4-6)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: "#FFCD1C" }}></div>
                <span className="text-sm">Low (1-3)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile current location button (only shown on smaller screens) */}
        <div className="md:hidden">
          {location && (
            <button
              className="absolute bottom-24 right-4 z-30 bg-white text-black rounded-full p-3 shadow-lg"
              onClick={() => {
                if (mapRef.current && location) {
                  mapRef.current.setView([location.lat, location.lng], 15, {
                    animate: true,
                    duration: 0.5,
                  })
                }
              }}
            >
              <Navigation size={20} />
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-2 right-2 z-30 bg-black bg-opacity-70 text-white px-3 py-2 text-xs rounded-lg">
            Loading...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-2 right-2 z-30 bg-red-500 text-white px-3 py-2 text-xs rounded-lg">{error}</div>
        )}

        {/* Pothole details panel */}
        {selectedPothole && (
          <div className="absolute top-0 right-0 bottom-0 z-40 bg-black bg-opacity-90 shadow-lg w-full md:w-96 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">Pothole #{selectedPothole.id}</h2>
                  <div className="flex items-center">
                    <MapPin size={14} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-400">
                      {selectedPothole.latitude.toFixed(6)}, {selectedPothole.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-800" onClick={() => setSelectedPothole(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Image takes most of the area */}
              <div className="relative w-full p-6 aspect-video">
                <img
                  src={`data:image/jpeg;base64,${selectedPothole.img}`}
                  alt="Pothole"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback image on error
                    ;(e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image"
                  }}
                />
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg flex items-center">
                    <AlertTriangle
                      size={16}
                      className="mr-2"
                      style={{ color: getSeverityColor(selectedPothole.severity) }}
                    />
                    <div>
                      <div className="text-xs text-gray-400">Severity</div>
                      <div className="font-medium" style={{ color: getSeverityColor(selectedPothole.severity) }}>
                        {getSeverityLabel(selectedPothole.severity)} ({selectedPothole.severity})
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Reported</div>
                      <div className="font-medium">{formatDate(selectedPothole.dateReported)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Reported By</h3>
                  <p className="text-gray-300">{selectedPothole.reportedBy}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <button
                className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([selectedPothole.latitude, selectedPothole.longitude], 17, {
                      animate: true,
                      duration: 0.5,
                    })
                  }
                }}
              >
                Navigate to Pothole
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PotholeMap

