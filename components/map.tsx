"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { MapContainer, TileLayer, CircleMarker, useMapEvents, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type L from "leaflet"
import { debounce } from "lodash"
import { Navigation, MapPin, Calendar, AlertTriangle, X, ChevronUp, ChevronDown } from "lucide-react"

interface Pothole {
  id: string; // MongoDB ObjectId is a string
  latitude: number;
  longitude: number;
  severity: number; // Prisma uses Int, so it should be number
  reportedBy: string;
  img: string; // Match the field name in Prisma
  dateReported: string; // Keeping it as string (ISO format) for consistency
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
    const [mapReady, setMapReady] = useState(false)
    const [initialLocationSet, setInitialLocationSet] = useState(false)
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
                    fetchLocationName(userLocation.lat, userLocation.lng)
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

    // Function to get color based on severity (now using number instead of string)
    const getSeverityColor = (severity?: number) => {
        if (severity === undefined) return "#276EF1" // Uber blue (default)
        
        // Convert number to severity level
        if (severity >= 7) return "#FF424F" // High - Uber red
        if (severity >= 4) return "#FF9E0D" // Medium - Orange
        return "#FFCD1C" // Low - Yellow
    }

    const getSeverityRadius = (severity?: number) => {
        if (severity === undefined) return 8 // Default
        
        // Convert number to size
        if (severity >= 7) return 10 // High
        if (severity >= 4) return 8  // Medium
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
    const fetchPotholes = useCallback((lat: number, lng: number) => {
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
        fetch(`/api/pothole?lat=${lat}&lng=${lng}&radius=10000`)
            .then((res) => {
                if (!res.ok) {
                    // If API returns 404, generate mock data for testing instead of failing
                    if (res.status === 404) {
                        console.log("API endpoint not found. Using mock data instead.")
                        return { potholes: generateMockPotholes(lat, lng) }
                    }
                    throw new Error(`API error: ${res.status}`)
                }
                return res.json()
            })
            .then((data) => {
                console.log("result : ", data);
                
                // Check if data is an array or has a potholes property
                let potholeData: Pothole[] = [];
                
                if (Array.isArray(data)) {
                    potholeData = data;
                } else if (data && Array.isArray(data.potholes)) {
                    potholeData = data.potholes;
                } else if (data) {
                    // In case API returns an object with different structure
                    potholeData = generateMockPotholes(lat, lng);
                    console.warn("Unexpected data format from API, using mock data");
                }
                
                console.log("processed potholes : ", potholeData);
                setPotholes(potholeData)
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
    }, [lastFetchTime]) // Only re-create when lastFetchTime changes

    // Create a debounced version of fetchPotholes
    const debouncedFetchPotholes = useRef(
        debounce((lat: number, lng: number) => {
            fetchPotholes(lat, lng)
        }, 1000)
    ).current

    // Fetch potholes when location is set
    useEffect(() => {
        if (location && mapReady) {
            debouncedFetchPotholes(location.lat, location.lng)
        }
    }, [location, debouncedFetchPotholes, mapReady, fetchPotholes])

    // Set initial location on map once both map is ready and location is available
    useEffect(() => {
        if (mapRef.current && location && mapReady && !initialLocationSet) {
            // Set map center immediately without animation
            mapRef.current.setView([location.lat, location.lng], 15, {
                animate: false,
                duration: 0
            });
            setInitialLocationSet(true);
        }
    }, [location, mapReady, initialLocationSet]);

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            if (debouncedFetchPotholes && typeof debouncedFetchPotholes.cancel === 'function') {
                debouncedFetchPotholes.cancel();
            }
        };
    }, [debouncedFetchPotholes]);

    const LocationMarker = () => {
        const map = useMapEvents({
            moveend() {
                // Only fetch new data if we aren't already loading
                if (!isLoading) {
                    const center = map.getCenter()
                    // Use debounced fetch to prevent excessive calls
                    debouncedFetchPotholes(center.lat, center.lng)
                    fetchLocationName(center.lat, center.lng)
                }
            },
            load() {
                // This is the first place where mapReady is set
                setMapReady(true)
                mapRef.current = map
            }
        })

        useEffect(() => {
            // Watch position for location marker updates, but DON'T auto-center
            const geoOptions = { enableHighAccuracy: true };

            const geoSuccess = (position: GeolocationPosition) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setLocation(newLocation);
                // Note: We intentionally do NOT recenter the map here
            };

            const geoError = (error: GeolocationPositionError) => {
                console.error("Error getting location:", error);
            };

            const watcher = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);

            return () => {
                navigator.geolocation.clearWatch(watcher);
            };
        }, []); // Empty deps array is correct here - this only runs on mount

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

    // Ensure potholes is always an array to avoid mapping errors
    const safePotholes = Array.isArray(potholes) ? potholes : [];

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header - Fixed position and height */}
            <header className="bg-black border-b border-gray-800 z-20 p-4">
                <h1 className="text-lg font-semibold">Pothole Map</h1>
                <p className="text-sm text-gray-400">Current Location: {locationName}</p>
                <p className="text-sm text-gray-400">Showing {safePotholes.length} potholes in your area</p>
            </header>

            {/* Main content area - With proper z-index layering */}
            <div className="flex-1 relative overflow-hidden">
                {/* Map area - Lower z-index to stay below UI elements */}
                <div className="absolute inset-0 z-0">
                    <MapContainer
                        center={mapCenter}
                        zoom={15}
                        className="h-full w-full"
                        zoomControl={false}
                        whenReady={() => setMapReady(true)}
                        preferCanvas={true} // Improve performance for many markers
                    >
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

                {/* UI Elements with higher z-index */}
                {/* Legend - Higher z-index to appear above map */}
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

                {location && (
                    <button
                        className="absolute bottom-24 right-4 z-30 bg-white text-black rounded-full p-3 shadow-lg"
                        onClick={() => {
                            if (mapRef.current && location) {
                                // Set view instantly to user location when button clicked
                                mapRef.current.setView([location.lat, location.lng], 15, {
                                    animate: true,
                                    duration: 0.5
                                });
                            }
                        }}
                    >
                        <Navigation size={20} />
                    </button>
                )}

                {isLoading && (
                    <div className="absolute top-2 right-2 z-30 bg-black bg-opacity-70 text-white px-3 py-2 text-xs rounded-lg">
                        Loading...
                    </div>
                )}

                {error && (
                    <div className="absolute top-2 right-2 z-30 bg-red-500 text-white px-3 py-2 text-xs rounded-lg">{error}</div>
                )}

                {/* Footer for pothole details - Highest z-index to appear above everything */}
                {selectedPothole && (
                    <div className="absolute bottom-0 left-0 right-0 z-40 bg-black bg-opacity-90 rounded-t-lg shadow-lg p-4">
                        <div className="flex justify-between items-start mb-4">
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

                        <div className="flex space-x-4 mb-4">
                            <img
                                src={selectedPothole.img || "/placeholder.svg"}
                                alt="Pothole"
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1 grid grid-cols-2 gap-4">
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
                                        <div className="font-medium">
                                            {formatDate(selectedPothole.dateReported)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            onClick={() => {
                                if (mapRef.current) {
                                    // Fast navigation to pothole
                                    mapRef.current.setView(
                                        [selectedPothole.latitude, selectedPothole.longitude],
                                        17,
                                        { animate: true, duration: 0.5 }
                                    );
                                    setSelectedPothole(null);
                                }
                            }}
                        >
                            Navigate to Pothole
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PotholeMap