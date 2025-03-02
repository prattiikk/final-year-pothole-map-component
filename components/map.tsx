"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { debounce } from "lodash";

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

  // Function to get color based on severity
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "#FF0000"; // Red
      case "medium":
        return "#FFA500"; // Orange
      case "low":
        return "#FFFF00"; // Yellow
      default:
        return "#3388FF"; // Default blue
    }
  };



  const getSeverityRadius = (severity?: string) => {
    switch (severity) {
      case "high":
        return 14; // Red
      case "medium":
        return 6; // Orange
      case "low":
        return 2; // Yellow
      default:
        return 8; // Default blue
    }
  };



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
      },
      {
        id: 4,
        latitude: lat - 0.0025,
        longitude: lng - 0.001,
        image_url: "https://media.istockphoto.com/id/1307113302/photo/deep-and-wide-water-filled-pot-holes-hampering-safe-transport-along-local-community-access.jpg",
        severity: "high",
        reported_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      },
      {
        id: 5,
        latitude: lat + 0.003,
        longitude: lng - 0.003,
        image_url: "https://www.fox29.com/wp-content/uploads/2022/04/Pothole-City-Ave.jpg",
        severity: "medium",
        reported_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
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

    // Return blue circle for current location
    return location ? <CircleMarker 
      center={location} 
      radius={8} 
      pathOptions={{ color: '#2A81CB', fillColor: '#2A81CB', fillOpacity: 1 }}
    /> : null;
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
        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded shadow">
          <h3 className="font-bold text-sm mb-1">Severity Legend</h3>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
          {potholes.map((pothole) => (
            <CircleMarker
              key={pothole.id}
              center={[pothole.latitude, pothole.longitude]}
              radius={getSeverityRadius(pothole.severity)}
              pathOptions={{ 
                color: getSeverityColor(pothole.severity),
                fillColor: getSeverityColor(pothole.severity),
                fillOpacity: 0.8
              }}
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
            </CircleMarker>
          ))}
        </MapContainer>
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