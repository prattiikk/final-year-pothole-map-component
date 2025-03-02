"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { debounce } from "lodash";

// Fix for Leaflet marker icon issue in Next.js
const fixLeafletIcon = () => {
  // Only run on client side
  if (typeof window === "undefined") return;
  
  delete L.Icon.Default.prototype.options.iconUrl;
  delete L.Icon.Default.prototype.options.iconRetinaUrl;
  delete L.Icon.Default.prototype.options.shadowUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
  });
};

// Custom pothole marker icons based on severity
const createPotholeIcons = () => {
  return {
    high: new L.Icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    medium: new L.Icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    low: new L.Icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    user: new L.Icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  };
};

interface Pothole {
  id: number;
  latitude: number;
  longitude: number;
  image_url: string;
  severity?: string;
  reported_at?: string;
}

const PotholeMap = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MIN_FETCH_INTERVAL = 15000; // Minimum 15 seconds between API calls
  const potholeIcons = useRef<Record<string, L.Icon>>({}); // Store icon instances

  // Fix Leaflet icon issue and initialize custom markers on component mount
  useEffect(() => {
    fixLeafletIcon();
    potholeIcons.current = createPotholeIcons();
  }, []);

  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(userLocation);
          setMapCenter([userLocation.lat, userLocation.lng]);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting initial location:", error);
          setError("Failed to get your location. Using default map view.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Function to fetch potholes data
  const fetchPotholes = (lat: number, lng: number) => {
    const now = Date.now();
    // If we've fetched too recently, schedule a future fetch and return
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPotholes(lat, lng);
      }, MIN_FETCH_INTERVAL - (now - lastFetchTime));
      
      return;
    }
    
    setIsLoading(true);
    setLastFetchTime(now);
    
    // API call
    fetch(`/api/pothole?lat=${lat}&lng=${lng}`)
      .then((res) => {
        if (!res.ok) {
          // If API returns 404, generate mock data for testing instead of failing
          if (res.status === 404) {
            console.log("API endpoint not found. Using mock data instead.");
            return generateMockPotholes(lat, lng);
          }
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setPotholes(data);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching potholes:", err);
        
        // If fetch completely fails, still provide mock data for testing
        const mockData = generateMockPotholes(lat, lng);
        setPotholes(mockData);
        
        setError("Using test data: API unavailable");
        setIsLoading(false);
      });
  };

  // Generate mock pothole data for testing when API is unavailable
  const generateMockPotholes = (lat: number, lng: number): Pothole[] => {
    return [
      {
        id: 1,
        latitude: lat + 0.002,
        longitude: lng + 0.003,
        image_url: "https://www.thestructuralengineer.info/images/news/Large-Pothole.jpeg",
        severity: "high",
        reported_at: new Date().toISOString()
      },
      {
        id: 2,
        latitude: lat - 0.001,
        longitude: lng + 0.001,
        image_url: "https://images.theconversation.com/files/442675/original/file-20220126-19-1i2t7mk.jpg",
        severity: "medium",
        reported_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 3,
        latitude: lat + 0.0015,
        longitude: lng - 0.002,
        image_url: "https://www.tcsinc.org/wp-content/uploads/2021/08/pothole-road.jpg",
        severity: "low",
        reported_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];
  };

  // Create a debounced version of fetchPotholes
  const debouncedFetchPotholes = useRef(
    debounce((lat: number, lng: number) => {
      fetchPotholes(lat, lng);
    }, 1000)
  ).current;

  // Fetch potholes when location is set
  useEffect(() => {
    if (location) {
      debouncedFetchPotholes(location.lat, location.lng);
    }
    
    // Cleanup function to cancel any pending timeouts
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [location, debouncedFetchPotholes]);

  // Helper function to get the appropriate icon based on pothole severity
  const getPotholeIcon = (severity?: string) => {
    if (!severity) return potholeIcons.current.medium;
    
    switch (severity.toLowerCase()) {
      case 'high':
        return potholeIcons.current.high;
      case 'medium':
        return potholeIcons.current.medium;
      case 'low':
        return potholeIcons.current.low;
      default:
        return potholeIcons.current.medium;
    }
  };

  const LocationMarker = () => {
    const lastUpdateTime = useRef(0);
    const updateInterval = 15000; // 15 seconds

    const map = useMapEvents({
      locationfound(e) {
        const now = Date.now();
        if (now - lastUpdateTime.current > updateInterval) {
          lastUpdateTime.current = now;
          setLocation(e.latlng);
        }
      },
      moveend() {
        // Only fetch new data if we aren't already loading
        if (!isLoading) {
          const center = map.getCenter();
          
          // Use debounced fetch to prevent excessive calls
          debouncedFetchPotholes(center.lat, center.lng);
        }
      }
    });

    useEffect(() => {
      mapRef.current = map;
      
      interface GeoPosition {
        coords: {
          latitude: number;
          longitude: number;
        };
      }

      const geoSuccess = (position: GeoPosition) => {
        const now = Date.now();
        if (now - lastUpdateTime.current > updateInterval) {
          lastUpdateTime.current = now;
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          map.flyTo(newLocation, map.getZoom());
        }
      };

      const geoError = (error: GeolocationPositionError) => {
        console.error("Error getting location:", error);
      };

      const geoOptions = { enableHighAccuracy: true };

      const watcher = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);

      return () => navigator.geolocation.clearWatch(watcher);
    }, [map]);

    return location ? (
      <Marker position={location} icon={potholeIcons.current.user}>
        <Popup>Your location</Popup>
      </Marker>
    ) : null;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Map Section */}
      <div className="w-full md:w-3/4 h-2/3 md:h-screen relative">
        {isLoading && (
          <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded shadow">
            Loading data...
          </div>
        )}
        {error && (
          <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-700 p-2 rounded shadow">
            {error}
          </div>
        )}
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
          {potholes.map((pothole) => (
            <Marker
              key={pothole.id}
              position={[pothole.latitude, pothole.longitude]}
              icon={getPotholeIcon(pothole.severity)}
              eventHandlers={{
                click: () => setSelectedPothole(pothole),
                mouseover: () => setSelectedPothole(pothole),
              }}
            >
              <Popup>
                <div>
                  <p>Pothole ID: {pothole.id}</p>
                  {pothole.severity && <p>Severity: {pothole.severity}</p>}
                  <button 
                    className="bg-blue-500 text-white px-2 py-1 rounded mt-2 text-xs"
                    onClick={() => setSelectedPothole(pothole)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-white p-3 rounded shadow opacity-80 hover:opacity-100 transition-opacity">
          <div className="text-sm font-semibold mb-2">Legend</div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
            <span className="text-xs">High Severity</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-xs">Medium Severity</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-xs">Low Severity</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-xs">Your Location</span>
          </div>
        </div>
      </div>

      {/* Image Preview Section */}
      <div className="w-full md:w-1/4 h-1/3 md:h-screen p-4 bg-gray-100 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Pothole Details</h2>
        {selectedPothole ? (
          <div className="flex flex-col items-center">
            <img
              src={selectedPothole.image_url}
              alt="Pothole"
              className="max-w-full h-auto rounded-lg shadow-md mb-3"
            />
            <div className="mt-2 w-full">
              <p className="font-semibold">ID: {selectedPothole.id}</p>
              <p>Latitude: {selectedPothole.latitude.toFixed(6)}</p>
              <p>Longitude: {selectedPothole.longitude.toFixed(6)}</p>
              {selectedPothole.severity && (
                <p>Severity: <span className={`font-medium ${
                  selectedPothole.severity === "high" ? "text-red-600" :
                  selectedPothole.severity === "medium" ? "text-orange-500" : "text-yellow-600"
                }`}>{selectedPothole.severity}</span></p>
              )}
              {selectedPothole.reported_at && (
                <p>Reported: {new Date(selectedPothole.reported_at).toLocaleString()}</p>
              )}
              <button 
                className="mt-3 bg-blue-600 text-white p-2 rounded w-full"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo(
                      [selectedPothole.latitude, selectedPothole.longitude],
                      16
                    );
                  }
                }}
              >
                Center on Map
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <p className="text-gray-500">Click or hover over a marker to see details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PotholeMap;