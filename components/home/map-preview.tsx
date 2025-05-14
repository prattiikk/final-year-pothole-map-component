"use client"

import type React from "react"
import { motion, useInView } from "framer-motion"
import { MapPin, Layers, Filter, Search, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { HeatmapVisualization } from "@/components/dashboard/heatmap-visualization"



export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(mapRef, { once: true })
  const [isMapRendered, setIsMapRendered] = useState(false)
  const [heatmapData, setHeatmapData] = useState([
    { latitude: 18.5286, longitude: 73.8748, severity: 8 },
    { latitude: 18.5292, longitude: 73.8755, severity: 7 },
    { latitude: 18.5275, longitude: 73.8732, severity: 5 },
    { latitude: 18.5301, longitude: 73.8760, severity: 4 },
    { latitude: 18.5269, longitude: 73.8727, severity: 3 },
    { latitude: 18.5310, longitude: 73.8750, severity: 2 },
  ])

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setIsMapRendered(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [isInView])

  useEffect(() => {
    if (!isMapRendered) return

    const updateInterval = setInterval(() => {
      const newAnomaly = {
        latitude: 18.5286 + (Math.random() - 0.5) * 0.002,
        longitude: 73.8748 + (Math.random() - 0.5) * 0.002,
        severity: Math.floor(Math.random() * 8) + 1,
      }

      setHeatmapData(prevData => [...prevData, newAnomaly])
    }, 5000)

    return () => clearInterval(updateInterval)
  }, [isMapRendered])

  return (
    <section id="map-preview" className="py-24 md:py-32 px-6 relative overflow-hidden bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">Real-Time Monitoring</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Explore Road Anomalies Near Pune Station</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Our interactive map displays real-time data from user submissions, allowing you to view road anomalies in
            the Pune Station area with severity filtering and rich visual insights.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl border border-border/50">
              <div ref={mapRef} className="h-72 md:h-96 relative overflow-hidden">
                {isInView && (
                  <HeatmapVisualization
                    data={heatmapData}
                    center={[18.5286, 73.8748]}
                    zoom={16}
                    interaction={true}
                  />
                )}

                <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50 z-20 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium">Live Data</span>
                </div>

                {!isMapRendered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading map data...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend and Controls */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Legend color="bg-red-500" label="Critical" />
                  <Legend color="bg-amber-500" label="High" />
                  <Legend color="bg-yellow-400" label="Medium" />
                  <Legend color="bg-green-500" label="Low" />
                </div>
                <div className="flex space-x-2">
                  <IconButton icon={Layers} />
                  <IconButton icon={Filter} />
                </div>
              </div>

              {/* Status bar */}
              <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{heatmapData.filter(item => item.severity >= 7).length} critical issues detected near Pune Station</span>
                </div>
                <div>Last updated: just now</div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <FeatureItem icon={Search} title="Smart Search with Auto-Suggest" description="Quickly find locations with intelligent suggestions." />
            <FeatureItem icon={Layers} title="Multiple Map Layers" description="Switch between different visual layers for better insight." />
            <FeatureItem icon={Filter} title="Advanced Filtering" description="Filter potholes by severity or distance." />
            <FeatureItem icon={MapPin} title="Data Visualization" description="Analyze anomaly data with visual clarity." />
            <Link href="/map">
              <Button className="w-full md:w-auto mt-4 flex items-center justify-center" size="lg">
                Explore Full Map <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FeatureItem({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex">
      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mr-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-foreground/70">{description}</p>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center">
      <div className={`h-3 w-3 rounded-full mr-2 ${color}`}></div>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function IconButton({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
      <Icon size={16} />
    </button>
  )
}