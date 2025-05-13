"use client"

import { useState, useEffect } from "react"
import { Layout } from "@/components/layout"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Filter, BarChart2, PieChartIcon, TrendingUp, Map, Layers } from "lucide-react"
import _ from "lodash"
import { motion } from "framer-motion"
import { HeatmapVisualization } from "@/components/heatmap-visualization"

// Define the types based on the API response
type Detection = {
  id: string
  severity: string
  confidence: number
  bbox: number[]
  center: number[]
  relativePosition: unknown
  className: string
}

type DetectionData = {
  id: string
  location: {
    latitude: number
    longitude: number
    accuracy: number
  }
  images: {
    original: string
    annotated: string
  }
  metadata: {
    userId: string
    username: string
    createdAt: string
    updatedAt: string
    notes: string
  }
  detection: {
    totalDetections: number
    averageConfidence: number
    processingTimeMs: number
    highestSeverity: string
    status: string
    counts: Record<string, number>
    details: Detection[]
  }
}


export default function DashboardPage() {
  const [data, setData] = useState<DetectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [, setMapCenter] = useState({ lat: 0, lng: 0 })

  // Colors for visualization
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFF", "#FF6B6B", "#4ECDC4", "#C7F464"]
  const SEVERITY_COLORS = {
    LOW: "#00C49F",
    MEDIUM: "#FFBB28",
    HIGH: "#FF8042",
    CRITICAL: "#FF6B6B",
  }

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Get user's location to use as default location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMapCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
            fetchDetectionData(position.coords.latitude, position.coords.longitude)
          },
          (err) => {
            console.error("Error getting location:", err)
            // Default to a location if geolocation fails
            fetchDetectionData(40.7128, -74.006) // New York coordinates as default
            setMapCenter({ lat: 40.7128, lng: -74.006 })
          },
        )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to fetch data")
        setLoading(false)
      }
    }

    const fetchDetectionData = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`/api/detections?lat=${lat}&lng=${lng}&radius=0.1&days=30`)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const result = await response.json()
        setData(result.data || [])
        setLoading(false)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to fetch detection data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate aggregated data for visualizations
  const getSeverityData = () => {
    const severityCounts = _.countBy(data, (item) => item.detection.highestSeverity)
    return Object.keys(severityCounts).map((key) => ({
      name: key,
      value: severityCounts[key],
    }))
  }

  const getStatusData = () => {
    const statusCounts = _.countBy(data, (item) => item.detection.status)
    return Object.keys(statusCounts).map((key) => ({
      name: key,
      value: statusCounts[key],
    }))
  }

  const getDetectionTypesData = () => {
    // Combine all counts from all detections
    const aggregatedCounts: Record<string, number> = {}
    data.forEach((item) => {
      Object.entries(item.detection.counts).forEach(([key, value]) => {
        if (aggregatedCounts[key]) {
          aggregatedCounts[key] += value
        } else {
          aggregatedCounts[key] = value
        }
      })
    })

    return Object.keys(aggregatedCounts).map((key) => ({
      name: key,
      count: aggregatedCounts[key],
    }))
  }

  const getTimeSeriesData = () => {
    // Group detections by day
    const groupedByDay = _.groupBy(data, (item) => {
      const date = new Date(item.metadata.createdAt)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    })

    // Convert to array and sort by date
    return Object.keys(groupedByDay)
      .map((date) => ({
        date,
        count: groupedByDay[date].length,
        avgConfidence: _.meanBy(groupedByDay[date], (item) => item.detection.averageConfidence),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getConfidenceDistribution = () => {
    // Group by confidence ranges
    const ranges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    const distribution = ranges.map((max, i) => {
      const min = i > 0 ? ranges[i - 1] : 0
      const count = data.filter(
        (item) => item.detection.averageConfidence >= min && item.detection.averageConfidence < max,
      ).length

      return {
        range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
        count,
      }
    })

    return distribution
  }

  // Prepare data for heatmap
  const getHeatmapData = () => {
    return data.map((item) => ({
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      severity:
        item.detection.highestSeverity === "CRITICAL"
          ? 8
          : item.detection.highestSeverity === "HIGH"
            ? 6
            : item.detection.highestSeverity === "MEDIUM"
              ? 4
              : 2,
    }))
  }

  // Loading and error states
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p>
              <strong>Error:</strong> {error}
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  // Main component render
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold mb-6">Road Anomaly Analytics Dashboard</h1>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Total Detections", value: data.length, icon: BarChart2, color: "bg-primary/10 text-primary" },
            {
              title: "Avg Confidence",
              value: `${(_.meanBy(data, (d) => d.detection.averageConfidence) * 100).toFixed(1)}%`,
              icon: PieChartIcon,
              color: "bg-blue-500/10 text-blue-500",
            },
            {
              title: "Critical Severity",
              value: data.filter((d) => d.detection.highestSeverity === "CRITICAL").length,
              icon: TrendingUp,
              color: "bg-red-500/10 text-red-500",
            },
            {
              title: "Unique Objects",
              value: Object.keys(_.flatMap(data, (d) => d.detection.counts)).length,
              icon: Map,
              color: "bg-green-500/10 text-green-500",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
              <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart2 },
            { id: "heatmap", label: "Heatmap", icon: Layers },
            { id: "trends", label: "Trends", icon: TrendingUp },
            { id: "details", label: "Details", icon: Filter },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`mr-4 py-2 px-4 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
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
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {getSeverityData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Detection Types */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
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
            </motion.div>

            {/* Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
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
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {getStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Confidence Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
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
            </motion.div>
          </div>
        )}

        {/* Heatmap Tab */}
        {activeTab === "heatmap" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
          >
            <h2 className="text-xl font-semibold mb-4">Pothole Heatmap Visualization</h2>
            <div className="h-[500px] w-full">
              <HeatmapVisualization data={getHeatmapData()} />
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                This heatmap shows the concentration of potholes in the area. Brighter and larger spots indicate higher
                severity or multiple potholes in close proximity.
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Time Series */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
              <h2 className="text-xl font-semibold mb-4">Detection Trends Over Time</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 1]}
                    tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0088FE" name="Detections" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgConfidence"
                    stroke="#FF8042"
                    name="Avg Confidence"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Detection Count Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
            >
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
            </motion.div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-6 rounded-xl shadow-sm border border-border/50"
          >
            <h2 className="text-xl font-semibold mb-4">Detection Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Detections
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(item.metadata.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.detection.totalDetections}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {(item.detection.averageConfidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              item.detection.highestSeverity === "LOW"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : item.detection.highestSeverity === "MEDIUM"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : item.detection.highestSeverity === "HIGH"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                        >
                          {item.detection.highestSeverity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.detection.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
