"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { MapContainer, TileLayer, CircleMarker, useMapEvents, Tooltip, Marker, LayersControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type L from "leaflet"
import { debounce } from "lodash"
import { Navigation, Search, Filter, BarChart, X, ChevronRight, AlertTriangle } from "lucide-react"
import currentLocationIcon from "./StickFigure"

interface Pothole {
    id: string
    latitude: number
    longitude: number
    severity: number
    reportedBy: string
    img: string
    dateReported: string
}

interface MapLayerOption {
    name: string
    url: string
    attribution: string
}

const mapLayers: MapLayerOption[] = [
    {
        name: "Dark",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
        name: "Light",
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
        name: "Terrain",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution:
            "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    },
    {
        name: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
]

interface SearchSuggestion {
    place_id: number
    display_name: string
    lat: string
    lon: string
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
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchRadius, setSearchRadius] = useState(5) // 5 km default radius
    const [showDataVisualization, setShowDataVisualization] = useState(false)
    const [severityFilter, setSeverityFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("all")

    const mapRef = useRef<L.Map | null>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const MIN_FETCH_INTERVAL = 15000 // Minimum 15 seconds between API calls
    const SIGNIFICANT_MOVE_DISTANCE = 0.02 // Approximately 2km
    const locationInitializedRef = useRef(false)

    // Filter the potholes based on selected filters
    const filteredPotholes = useMemo(() => {
        return potholes.filter(pothole => {
            // Filter by severity
            if (severityFilter !== "all") {
                const severity = pothole.severity;
                if (severityFilter === "high" && severity < 7) return false;
                if (severityFilter === "medium" && (severity < 4 || severity >= 7)) return false;
                if (severityFilter === "low" && severity >= 4) return false;
            }

            // Filter by date
            if (dateFilter !== "all") {
                const reportDate = new Date(pothole.dateReported);
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));

                if (dateFilter === "today" && daysDiff >= 1) return false;
                if (dateFilter === "week" && daysDiff > 7) return false;
                if (dateFilter === "month" && daysDiff > 30) return false;
            }

            return true;
        });
    }, [potholes, severityFilter, dateFilter]);

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
            if (suggestionsTimeoutRef.current) {
                clearTimeout(suggestionsTimeoutRef.current)
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

    // Auto-suggest feature
    const fetchLocationSuggestions = useCallback(
        async (query: string) => {
            if (!query || query.length < 3) {
                setSearchSuggestions([])
                setShowSuggestions(false)
                return
            }

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
                );
                const data = await response.json();
                setSearchSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error fetching location suggestions:", error);
                setSearchSuggestions([]);
                setShowSuggestions(false);
            }
        },
        []
    );

    // Create a debounced version of the suggestions fetch
    const debouncedFetchSuggestions = useRef(
        debounce((query: string) => {
            fetchLocationSuggestions(query);
        }, 300)
    ).current;

    // Update suggestions when search query changes
    useEffect(() => {
        debouncedFetchSuggestions(searchQuery);
    }, [searchQuery, debouncedFetchSuggestions]);

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
                    setShowSuggestions(false)
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

    // Handle selecting a suggestion
    const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
        const lat = Number.parseFloat(suggestion.lat);
        const lng = Number.parseFloat(suggestion.lon);

        if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
            setSearchQuery("");
            setShowSuggestions(false);
        }
    };

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

// Modify the fetchPotholes function to handle the new data structure
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

        // Fetch from API with new parameters
        fetch(`/api/detections?lat=${lat}&lng=${lng}&radius=${searchRadius}`)
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`API error: ${res.status}`)
                }
                return res.json()
            })
            .then((response) => {
                const fetchedData = response.data || []

                // Transform API data to match existing Pothole interface
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-expect-error
                const transformedPotholes = fetchedData.map(detection => ({
                    id: detection.id,
                    latitude: detection.location.latitude,
                    longitude: detection.location.longitude,
                    severity: detection.detection.highestSeverity 
                        ? parseInt(detection.detection.highestSeverity) * 2 // Adjust severity scaling if needed
                        : 5, // Default severity
                    reportedBy: detection.metadata.username || 'Anonymous',
                    img: detection.images.annotated || '', // Base64 encoded image
                    dateReported: detection.metadata.createdAt
                }))

                if (transformedPotholes.length === 0) {
                    setError("No potholes found in this area")
                } else {
                    setError(null)
                }

                setPotholes(transformedPotholes)
            })
            .catch((err) => {
                console.error("Error fetching potholes:", err)
                setError("Network issue, please connect to internet")
            })
            .finally(() => {
                setIsLoading(false)
            })
    },
    [lastFetchTime, lastFetchedCoords, searchRadius],
)
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

    // Effect to trigger fetch when search radius changes
    useEffect(() => {
        if (mapRef.current && lastFetchedCoords) {
            fetchPotholes(lastFetchedCoords.lat, lastFetchedCoords.lng);
        }
    }, [searchRadius, fetchPotholes]);

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
        return location ? <Marker position={location} icon={currentLocationIcon} /> : null
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
        } catch {
            return "Unknown date"
        }
    }

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            if (debouncedFetchPotholes && typeof debouncedFetchPotholes.cancel === "function") {
                debouncedFetchPotholes.cancel()
            }
            if (debouncedFetchSuggestions && typeof debouncedFetchSuggestions.cancel === "function") {
                debouncedFetchSuggestions.cancel()
            }
        }
    }, [debouncedFetchPotholes, debouncedFetchSuggestions])

    // Handle search form submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        searchLocation(searchQuery)
    }

    // Toggle data visualization panel
    const toggleDataVisualization = () => {
        setShowDataVisualization(!showDataVisualization)
        setSelectedPothole(null)
    }

    // Calculate statistics for data visualization
    const calculateStatistics = () => {
        if (!potholes || potholes.length === 0) {
            return {
                totalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                averageSeverity: 0,
                byDate: {
                    today: 0,
                    yesterday: 0,
                    lastWeek: 0,
                    lastMonth: 0,
                    older: 0
                }
            };
        }

        const now = new Date();
        const stats = {
            totalCount: filteredPotholes.length,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            averageSeverity: 0,
            byDate: {
                today: 0,
                yesterday: 0,
                lastWeek: 0,
                lastMonth: 0,
                older: 0
            }
        };

        let severitySum = 0;

        filteredPotholes.forEach(pothole => {
            // Count by severity
            const severity = pothole.severity;
            severitySum += severity;

            if (severity >= 7) {
                stats.highCount++;
            } else if (severity >= 4) {
                stats.mediumCount++;
            } else {
                stats.lowCount++;
            }

            // Count by date
            try {
                const reportDate = new Date(pothole.dateReported);
                const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff < 1) {
                    stats.byDate.today++;
                } else if (daysDiff < 2) {
                    stats.byDate.yesterday++;
                } else if (daysDiff <= 7) {
                    stats.byDate.lastWeek++;
                } else if (daysDiff <= 30) {
                    stats.byDate.lastMonth++;
                } else {
                    stats.byDate.older++;
                }
            } catch {
                stats.byDate.older++;
            }
        });

        stats.averageSeverity = filteredPotholes.length > 0 ? parseFloat((severitySum / filteredPotholes.length).toFixed(1)) : 0;

        return stats;
    };

    const stats = calculateStatistics();

    // Ensure potholes is always an array to avoid mapping errors
    //const safePotholes = Array.isArray(potholes) ? potholes : []

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <header className="bg-black border-b border-gray-800 z-20 p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Pothole Map</h1>
                        <p className="text-sm text-gray-400">Current Location: {locationName}</p>
                        <p className="text-sm text-gray-400">Showing {filteredPotholes.length} potholes in your area</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search form */}
                        <div className="relative">
                            <form onSubmit={handleSearchSubmit} className="flex items-center">
                                <div className="relative flex-1">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search for a location..."
                                        className="bg-gray-900 text-white border border-gray-700 rounded-lg py-2 px-4 pr-10 w-full focus:outline-none focus:border-blue-500"
                                        onFocus={() => {
                                            if (searchSuggestions.length > 0) {
                                                setShowSuggestions(true)
                                            }
                                        }}
                                        onBlur={() => {
                                            // Delay hiding suggestions to allow for clicks
                                            setTimeout(() => setShowSuggestions(false), 200)
                                        }}
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

                            {/* Search suggestions dropdown */}
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div className="absolute mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                                    {searchSuggestions.map((suggestion) => (
                                        <div
                                            key={suggestion.place_id}
                                            className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm border-b border-gray-700 last:border-0"
                                            onClick={() => handleSuggestionSelect(suggestion)}
                                        >
                                            {suggestion.display_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Toggle Data Visualization */}
                        <button
                            className={`bg-gray-800 text-white rounded-lg px-3 py-2 flex items-center ${showDataVisualization ? 'bg-blue-600' : ''}`}
                            onClick={toggleDataVisualization}
                        >
                            <BarChart size={16} className="mr-1" />
                            <span className="hidden sm:inline">Analytics</span>
                        </button>

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
                        {/* Use LayersControl for different map styles */}
                        <LayersControl position="topright">
                            {mapLayers.map((layer) => (
                                <LayersControl.BaseLayer
                                    key={layer.name}
                                    name={layer.name}
                                    checked={layer.name === "Dark"} // Default to dark theme
                                >
                                    <TileLayer
                                        url={layer.url}
                                        attribution={layer.attribution}
                                    />
                                </LayersControl.BaseLayer>
                            ))}
                        </LayersControl>

                        <LocationMarker />
                        {filteredPotholes.map((pothole) => (
                            <CircleMarker
                                key={pothole.id}
                                center={[pothole.latitude, pothole.longitude]}
                                radius={getSeverityRadius(pothole.severity)}
                                pathOptions={{
                                    fillColor: getSeverityColor(pothole.severity),
                                    color: "white",
                                    weight: 1,
                                    fillOpacity: 0.8
                                }}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedPothole(pothole)
                                        setShowDataVisualization(false)
                                    }
                                }}
                            >
                                <Tooltip>
                                    Severity: {getSeverityLabel(pothole.severity)}
                                </Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>

                {/* Error message overlay */}
                {error && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg">
                        <AlertTriangle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-70 p-4 rounded-lg flex items-center">
                        <div className="w-6 h-6 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mr-3"></div>
                        <span>Loading...</span>
                    </div>
                )}

                {/* Filter controls overlay */}
                <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-70 p-3 rounded-lg shadow-lg max-w-xs w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold flex items-center">
                            <Filter size={16} className="mr-2" />
                            Filters
                        </h3>
                        <div className="text-sm text-gray-300">
                            Radius: {searchRadius} km
                        </div>
                    </div>

                    {/* Search radius slider */}
                    <div className="mb-4">
                        <label htmlFor="radius-slider" className="text-xs text-gray-400 block mb-1">
                            Search Radius
                        </label>
                        <input
                            id="radius-slider"
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1km</span>
                            <span>10km</span>
                            <span>20km</span>
                        </div>
                    </div>

                    {/* Severity filter */}
                    <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">
                            Severity Level
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                            <button
                                className={`text-xs py-1 px-2 rounded ${severityFilter === "all" ? "bg-blue-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setSeverityFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${severityFilter === "high" ? "bg-red-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setSeverityFilter("high")}
                            >
                                High
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${severityFilter === "medium" ? "bg-orange-500" : "bg-gray-700"
                                    }`}
                                onClick={() => setSeverityFilter("medium")}
                            >
                                Medium
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${severityFilter === "low" ? "bg-yellow-500 text-black" : "bg-gray-700"
                                    }`}
                                onClick={() => setSeverityFilter("low")}
                            >
                                Low
                            </button>
                        </div>
                    </div>

                    {/* Date filter */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">
                            Reported Date
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            <button
                                className={`text-xs py-1 px-2 rounded ${dateFilter === "all" ? "bg-blue-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setDateFilter("all")}
                            >
                                All
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${dateFilter === "today" ? "bg-blue-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setDateFilter("today")}
                            >
                                Today
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${dateFilter === "week" ? "bg-blue-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setDateFilter("week")}
                            >
                                This Week
                            </button>
                            <button
                                className={`text-xs py-1 px-2 rounded ${dateFilter === "month" ? "bg-blue-600" : "bg-gray-700"
                                    }`}
                                onClick={() => setDateFilter("month")}
                            >
                                This Month
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 z-10">
                    <div className="bg-black bg-opacity-70 rounded-lg shadow-lg overflow-hidden">
                        <div
                            className="px-3 py-2 cursor-pointer flex items-center justify-between"
                            onClick={() => setIsLegendOpen(!isLegendOpen)}
                        >
                            <span className="font-semibold">Legend</span>
                            <ChevronRight
                                size={16}
                                className={`transition-transform duration-200 ${isLegendOpen ? "transform rotate-90" : ""}`}
                            />
                        </div>

                        {isLegendOpen && (
                            <div className="px-3 pb-3">
                                <div className="flex items-center my-1">
                                    <div
                                        className="w-4 h-4 rounded-full mr-2"
                                        style={{ backgroundColor: getSeverityColor(8) }}
                                    ></div>
                                    <span className="text-sm">High Severity</span>
                                </div>
                                <div className="flex items-center my-1">
                                    <div
                                        className="w-4 h-4 rounded-full mr-2"
                                        style={{ backgroundColor: getSeverityColor(5) }}
                                    ></div>
                                    <span className="text-sm">Medium Severity</span>
                                </div>
                                <div className="flex items-center my-1">
                                    <div
                                        className="w-4 h-4 rounded-full mr-2"
                                        style={{ backgroundColor: getSeverityColor(2) }}
                                    ></div>
                                    <span className="text-sm">Low Severity</span>
                                </div>
                                <div className="flex items-center my-1">
                                    <div className="w-4 h-4 flex items-center justify-center mr-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <span className="text-sm">Your Location</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected pothole detail panel */}
                {selectedPothole && (
                    <div className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-black bg-opacity-90 p-4 z-20 overflow-y-auto border-l border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Pothole Details</h2>
                            <button
                                onClick={() => setSelectedPothole(null)}
                                className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {selectedPothole.img && (
                            <div className="mb-4">
                                <img
                                    src={`data:image/jpeg;base64,${selectedPothole.img}`}
                                    alt="Pothole"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-gray-400 text-sm">Severity</h3>
                                <div className="flex items-center">
                                    <div
                                        className="w-4 h-4 rounded-full mr-2"
                                        style={{ backgroundColor: getSeverityColor(selectedPothole.severity) }}
                                    ></div>
                                    <span className="font-semibold">
                                        {getSeverityLabel(selectedPothole.severity)} ({selectedPothole.severity}/10)
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-gray-400 text-sm">Location</h3>
                                <p className="font-mono text-sm">
                                    {selectedPothole.latitude.toFixed(6)}, {selectedPothole.longitude.toFixed(6)}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-gray-400 text-sm">Reported By</h3>
                                <p>{selectedPothole.reportedBy}</p>
                            </div>

                            <div>
                                <h3 className="text-gray-400 text-sm">Date Reported</h3>
                                <p>{formatDate(selectedPothole.dateReported)}</p>
                            </div>

                            <div className="pt-2">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full">
                                    Report Fixed
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data visualization panel */}
                {showDataVisualization && (
                    <div className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-black bg-opacity-90 p-4 z-20 overflow-y-auto border-l border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Pothole Analytics</h2>
                            <button
                                onClick={() => setShowDataVisualization(false)}
                                className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-800 p-3 rounded-lg">
                                    <h3 className="text-gray-400 text-xs mb-1">Total Potholes</h3>
                                    <p className="text-2xl font-bold">{stats.totalCount}</p>
                                </div>
                                <div className="bg-gray-800 p-3 rounded-lg">
                                    <h3 className="text-gray-400 text-xs mb-1">Avg. Severity</h3>
                                    <p className="text-2xl font-bold">{stats.averageSeverity}</p>
                                </div>
                            </div>

                            {/* Severity distribution */}
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">Severity Distribution</h3>
                                <div className="relative pt-1">
                                    <div className="flex h-4 mb-4 overflow-hidden text-xs rounded-lg">
                                        <div
                                            style={{ width: `${(stats.highCount / stats.totalCount) * 100}%` }}
                                            className="bg-red-600 flex flex-col text-center whitespace-nowrap justify-center"
                                        ></div>
                                        <div
                                            style={{ width: `${(stats.mediumCount / stats.totalCount) * 100}%` }}
                                            className="bg-orange-500 flex flex-col text-center whitespace-nowrap justify-center"
                                        ></div>
                                        <div
                                            style={{ width: `${(stats.lowCount / stats.totalCount) * 100}%` }}
                                            className="bg-yellow-500 flex flex-col text-center whitespace-nowrap justify-center"
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-red-600 mr-1 rounded-sm"></div>
                                            <span>High: {stats.highCount}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-orange-500 mr-1 rounded-sm"></div>
                                            <span>Medium: {stats.mediumCount}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-yellow-500 mr-1 rounded-sm"></div>
                                            <span>Low: {stats.lowCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Date distribution */}
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">Reports Timeline</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-24 text-xs">Today</div>
                                        <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${(stats.byDate.today / stats.totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right text-xs ml-2">{stats.byDate.today}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-24 text-xs">Yesterday</div>
                                        <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${(stats.byDate.yesterday / stats.totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right text-xs ml-2">{stats.byDate.yesterday}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-24 text-xs">Last Week</div>
                                        <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${(stats.byDate.lastWeek / stats.totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right text-xs ml-2">{stats.byDate.lastWeek}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-24 text-xs">Last Month</div>
                                        <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${(stats.byDate.lastMonth / stats.totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right text-xs ml-2">{stats.byDate.lastMonth}</div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-24 text-xs">Older</div>
                                        <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600"
                                                style={{ width: `${(stats.byDate.older / stats.totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-8 text-right text-xs ml-2">{stats.byDate.older}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation section */}
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold mb-3">Analysis</h3>
                                <p className="text-sm text-gray-300">
                                    Based on the data, this area has
                                    {stats.highCount > (stats.totalCount / 3) ? ' a high' : ' a moderate'} number of severe potholes.
                                    {stats.byDate.today + stats.byDate.yesterday > (stats.totalCount / 4) ?
                                        ' There has been a recent increase in pothole reports.' :
                                        ' Reports have been consistent over time.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PotholeMap