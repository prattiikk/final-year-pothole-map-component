"use client"
import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';
import _ from 'lodash';

// Define the types based on the API response
type Detection = {
  id: string;
  severity: string;
  confidence: number;
  bbox: number[];
  center: number[];
  relativePosition: unknown;
  className: string;
};

type DetectionData = {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  images: {
    original: string;
    annotated: string;
  };
  metadata: {
    userId: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    notes: string;
  };
  detection: {
    totalDetections: number;
    averageConfidence: number;
    processingTimeMs: number;
    highestSeverity: string;
    status: string;
    counts: Record<string, number>;
    details: Detection[];
  };
};

export default function DetectionDataVisualization() {
  const [data, setData] = useState<DetectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [, setMapCenter] = useState({ lat: 0, lng: 0 });
  
  // Colors for visualization
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4ECDC4', '#C7F464'];
  const SEVERITY_COLORS = {
    LOW: '#00C49F',
    MEDIUM: '#FFBB28',
    HIGH: '#FF8042',
    CRITICAL: '#FF6B6B'
  };
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get user's location to use as default location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMapCenter({ 
              lat: position.coords.latitude, 
              lng: position.coords.longitude 
            });
            fetchDetectionData(
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (err) => {
            console.error("Error getting location:", err);
            // Default to a location if geolocation fails
            fetchDetectionData(40.7128, -74.0060); // New York coordinates as default
            setMapCenter({ lat: 40.7128, lng: -74.0060 });
          }
        );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    const fetchDetectionData = async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `/api/detections?lat=${lat}&lng=${lng}&radius=0.1&days=30`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data);
        setLoading(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to fetch detection data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate aggregated data for visualizations
  const getSeverityData = () => {
    const severityCounts = _.countBy(data, item => item.detection.highestSeverity);
    return Object.keys(severityCounts).map(key => ({
      name: key,
      value: severityCounts[key]
    }));
  };

  const getStatusData = () => {
    const statusCounts = _.countBy(data, item => item.detection.status);
    return Object.keys(statusCounts).map(key => ({
      name: key,
      value: statusCounts[key]
    }));
  };

  const getDetectionTypesData = () => {
    // Combine all counts from all detections
    const aggregatedCounts: Record<string, number> = {};
    data.forEach(item => {
      Object.entries(item.detection.counts).forEach(([key, value]) => {
        if (aggregatedCounts[key]) {
          aggregatedCounts[key] += value;
        } else {
          aggregatedCounts[key] = value;
        }
      });
    });
    
    return Object.keys(aggregatedCounts).map(key => ({
      name: key,
      count: aggregatedCounts[key]
    }));
  };

  const getTimeSeriesData = () => {
    // Group detections by day
    const groupedByDay = _.groupBy(data, item => {
      const date = new Date(item.metadata.createdAt);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    });
    
    // Convert to array and sort by date
    return Object.keys(groupedByDay)
      .map(date => ({
        date,
        count: groupedByDay[date].length,
        avgConfidence: _.meanBy(groupedByDay[date], item => item.detection.averageConfidence)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getConfidenceDistribution = () => {
    // Group by confidence ranges
    const ranges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const distribution = ranges.map((max, i) => {
      const min = i > 0 ? ranges[i-1] : 0;
      const count = data.filter(item => 
        item.detection.averageConfidence >= min && 
        item.detection.averageConfidence < max
      ).length;
      
      return {
        range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
        count
      };
    });
    
    return distribution;
  };

  // Map rendering helper function
  const renderHeatmap = () => {
    if (typeof window !== 'undefined' && data.length > 0) {
      return (
        <div className="relative h-96 w-full bg-gray-200 rounded-lg overflow-hidden">
          {/* This would be replaced with an actual map library like Leaflet or Google Maps */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">Map with heatmap visualization would render here.</p>
            <p className="text-gray-500 mt-2">Integrate with Leaflet, Google Maps, or Mapbox.</p>
          </div>
          
          {/* Sample pins to demonstrate concept */}
          {data.slice(0, 5).map((detection, index) => (
            <div 
              key={detection.id}
              className="absolute"
              style={{
                top: `${30 + Math.random() * 60}%`,
                left: `${30 + Math.random() * 60}%`,
              }}
            >
              <MapPin 
                size={24} 
                color={
                  Object.values(SEVERITY_COLORS)[index % Object.values(SEVERITY_COLORS).length]
                }
              />
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No detection data available for map visualization</p>
      </div>
    );
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Detection Data Visualization Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Detections</h3>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Confidence</h3>
          <p className="text-2xl font-bold">
            {(_.meanBy(data, d => d.detection.averageConfidence) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Critical Severity</h3>
          <p className="text-2xl font-bold">
            {data.filter(d => d.detection.highestSeverity === 'CRITICAL').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Objects</h3>
          <p className="text-2xl font-bold">
            {Object.keys(_.flatMap(data, d => d.detection.counts)).length}
          </p>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'map' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Heatmap
        </button>
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'trends' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={`mr-4 py-2 px-4 ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Severity Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getSeverityData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}: {name: string; percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getSeverityData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 

                      fill={SEVERITY_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detection Types */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Detection Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDetectionTypesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}: {name: string; percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Confidence Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Confidence Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getConfidenceDistribution()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Detection Heatmap</h2>
          {renderHeatmap()}
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Map shows locations of all detections. Color intensity indicates concentration of detections.
            </p>
          </div>
        </div>
      )}
      
      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Time Series */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Detection Trends Over Time</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={getTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0088FE" name="Detections" />
                <Line yAxisId="right" type="monotone" dataKey="avgConfidence" stroke="#FF8042" name="Avg Confidence" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detection Count Area Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Detection Count Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Detection Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.metadata.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.detection.totalDetections}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item.detection.averageConfidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${item.detection.highestSeverity === 'LOW' ? 'bg-green-100 text-green-800' : 
                          item.detection.highestSeverity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          item.detection.highestSeverity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'}`}
                      >
                        {item.detection.highestSeverity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.detection.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}