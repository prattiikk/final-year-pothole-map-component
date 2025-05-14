"use client"

import { useState, useEffect, useMemo } from "react"
import { Layout } from "@/components/home/layout"
import _ from "lodash"
import { motion } from "framer-motion"

// Import our dashboard components
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { SeverityChart } from "@/components/dashboard/severity-chart"
import { DetectionTypesChart } from "@/components/dashboard/detection-types-chart"
import { ConfidenceChart } from "@/components/dashboard/confidence-chart"
import { MapOverview } from "@/components/dashboard/map-overview"
import { DetectionTable } from "@/components/dashboard/detection-table"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { TabsContent } from "@/components/ui/tabs"
import { UnifiedVisualizations } from "@/components/dashboard/unified-visualizations"

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
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.006 }); // Default to NYC


  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Get user's location to use as default location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            fetchDetectionData(position.coords.latitude, position.coords.longitude)
          },
          (err) => {
            console.error("Error getting location:", err)
            // Default to a location if geolocation fails
            fetchDetectionData(40.7128, -74.006) // New York coordinates as default
          },
        )
      } catch (err) {
        setError("Failed to fetch data")
        setLoading(false)
      }
    }

    const fetchDetectionData = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`/api/detections?lat=${lat}&lng=${lng}&radius=10&days=30`)

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const result = await response.json()
        setData(result.data || [])
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch detection data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate total individual detections
  const totalIndividualDetections = useMemo(
    () => data.reduce((sum, item) => sum + item.detection.details.length, 0),
    [data],
  )

  // Calculate average confidence
  const averageConfidence = useMemo(() => {
    const allDetections = data.flatMap((d) => d.detection.details)
    if (allDetections.length === 0) return "0%"

    const avgConf = _.meanBy(allDetections, (d) => d.confidence) * 100
    return `${avgConf.toFixed(1)}%`
  }, [data])

  // Count critical severity detections
  const criticalSeverityCount = useMemo(
    () => data.flatMap((d) => d.detection.details).filter((d) => d.severity === "CRITICAL").length,
    [data],
  )

  // Prepare severity data for chart
  const severityData = useMemo(() => {
    const severityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }

    data.forEach((item) => {
      item.detection.details.forEach((detection) => {
        if (severityCounts[detection.severity]) {
          severityCounts[detection.severity]++
        } else {
          severityCounts[detection.severity] = 1
        }
      })
    })

    return Object.keys(severityCounts).map((key) => ({
      name: key,
      value: severityCounts[key],
      color: key === "LOW" ? "#00C49F" : key === "MEDIUM" ? "#FFBB28" : key === "HIGH" ? "#FF8042" : "#FF6B6B",
    }))
  }, [data])
  console.log("pie chart data -> ", severityData)

  // Prepare detection types data for chart
  const detectionTypesData = useMemo(() => {
    const aggregatedCounts: Record<string, number> = {}

    data.forEach((item) => {
      if (item.detection.counts) {
        Object.entries(item.detection.counts).forEach(([key, value]) => {
          if (aggregatedCounts[key]) {
            aggregatedCounts[key] += value
          } else {
            aggregatedCounts[key] = value
          }
        })
      }
    })

    return Object.keys(aggregatedCounts)
      .map((key) => ({
        name: key,
        count: aggregatedCounts[key],
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }, [data])

  // Prepare confidence distribution data for chart
  const confidenceData = useMemo(() => {
    const ranges = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    const distribution = ranges.map((max, i) => {
      const min = i > 0 ? ranges[i - 1] : 0

      let count = 0
      data.forEach((item) => {
        item.detection.details.forEach((detection) => {
          if (detection.confidence >= min && detection.confidence < max) {
            count++
          }
        })
      })

      return {
        range: `${(min * 100).toFixed(0)}-${(max * 100).toFixed(0)}%`,
        count,
      }
    })

    return distribution
  }, [data])

  // Prepare heatmap data
  const heatmapData = useMemo(
    () =>
      data.map((item) => ({
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
      })),
    [data],
  )

  // Prepare detection table data
  const detectionTableData = useMemo(
    () =>
      data
        .map((item) => ({
          id: item.id,
          date: item.metadata.createdAt,
          totalDetections: item.detection.totalDetections,
          confidence: item.detection.averageConfidence,
          severity: item.detection.highestSeverity,
          status: item.detection.status,
          location: {
            latitude: item.location.latitude,
            longitude: item.location.longitude,
          },
        }))
        .slice(0, 10), // Show only the 10 most recent
    [data],
  )

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <DashboardStats
            totalReports={data.length}
            totalDetections={totalIndividualDetections}
            avgConfidence={averageConfidence}
            criticalSeverity={criticalSeverityCount}
            className="mb-8"
          />
        </motion.div>

        {/* Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <DashboardTabs>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SeverityChart data={severityData} />
                <DetectionTypesChart data={detectionTypesData} />
                <ConfidenceChart data={confidenceData} className="md:col-span-2" />
              </div>
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map">
              <MapOverview data={heatmapData} centerdata={[userLocation.lat, userLocation.lng]}
              />
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <DetectionTable data={detectionTableData} />
            </TabsContent>
          </DashboardTabs>
        </motion.div>

        {/* Advanced Visualizations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <UnifiedVisualizations data={data} />
        </motion.div>
      </div>
    </Layout>
  )
}