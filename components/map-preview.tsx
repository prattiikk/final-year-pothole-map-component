"use client"

import type React from "react"

import { motion, useInView } from "framer-motion"
import { MapPin, Layers, Filter, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRef, useEffect } from "react"

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(mapRef, { once: true })

  useEffect(() => {
    if (!mapRef.current || !isInView) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const container = mapRef.current
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight
    container.appendChild(canvas)

    // Draw map background with a light color for a map-like appearance
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw a grid of streets
    const drawStreets = () => {
      // Main streets
      ctx.strokeStyle = "#d0d0d0"
      ctx.lineWidth = 8

      // Horizontal main streets
      for (let y = 50; y < canvas.height; y += 120) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical main streets
      for (let x = 50; x < canvas.width; x += 120) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Secondary streets
      ctx.strokeStyle = "#e0e0e0"
      ctx.lineWidth = 4

      // Horizontal secondary streets
      for (let y = 90; y < canvas.height; y += 120) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical secondary streets
      for (let x = 90; x < canvas.width; x += 120) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
    }

    // Draw blocks (buildings)
    const drawBlocks = () => {
      ctx.fillStyle = "#e8e8e8"

      for (let y = 10; y < canvas.height; y += 120) {
        for (let x = 10; x < canvas.width; x += 120) {
          // Skip some blocks randomly to create variety
          if (Math.random() > 0.2) {
            const width = 70 + Math.random() * 20
            const height = 70 + Math.random() * 20
            ctx.fillRect(x, y, width, height)
          }
        }
      }
    }

    // Draw potholes on streets
    const drawPotholes = () => {
      // Define pothole locations on streets
      const potholes = [
        // On horizontal streets
        { x: 120, y: 50, severity: "high" },
        { x: 250, y: 50, severity: "medium" },
        { x: 400, y: 170, severity: "low" },
        { x: 180, y: 290, severity: "high" },
        { x: 350, y: 290, severity: "medium" },
        // On vertical streets
        { x: 50, y: 120, severity: "medium" },
        { x: 50, y: 220, severity: "high" },
        { x: 170, y: 150, severity: "low" },
        { x: 290, y: 80, severity: "medium" },
        { x: 290, y: 200, severity: "high" },
      ]

      potholes.forEach((pothole) => {
        let color, radius

        switch (pothole.severity) {
          case "high":
            color = "#FF424F"
            radius = 8
            break
          case "medium":
            color = "#FF9E0D"
            radius = 6
            break
          default:
            color = "#FFCD1C"
            radius = 5
        }

        // Draw pothole
        ctx.beginPath()
        ctx.arc(pothole.x, pothole.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Draw glow effect
        const gradient = ctx.createRadialGradient(pothole.x, pothole.y, radius * 0.5, pothole.x, pothole.y, radius * 2)
        gradient.addColorStop(0, color + "80")
        gradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(pothole.x, pothole.y, radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })
    }

    // Draw map elements
    drawBlocks()
    drawStreets()
    drawPotholes()

    // Draw a legend
    const drawLegend = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillRect(canvas.width - 120, 10, 110, 80)
      ctx.strokeStyle = "#ccc"
      ctx.strokeRect(canvas.width - 120, 10, 110, 80)

      ctx.fillStyle = "#333"
      ctx.font = "10px Arial"
      ctx.fillText("Pothole Severity", canvas.width - 110, 25)

      // High severity
      ctx.beginPath()
      ctx.arc(canvas.width - 105, 40, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FF424F"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("High", canvas.width - 90, 43)

      // Medium severity
      ctx.beginPath()
      ctx.arc(canvas.width - 105, 60, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FF9E0D"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("Medium", canvas.width - 90, 63)

      // Low severity
      ctx.beginPath()
      ctx.arc(canvas.width - 105, 80, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FFCD1C"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("Low", canvas.width - 90, 83)
    }

    drawLegend()

    return () => {
      if (container.contains(canvas)) {
        container.removeChild(canvas)
      }
    }
  }, [isInView])

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
          <span className="inline-block text-primary font-medium mb-3">Interactive Map</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Explore Potholes In Your Area</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Our interactive map allows you to view road anomalies in your area, filter by severity, and analyze data
            with advanced visualization tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Map Preview Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-background rounded-xl overflow-hidden shadow-2xl border border-border/50">
              <div ref={mapRef} className="h-72 md:h-96 relative bg-black overflow-hidden">
                {/* Map will be rendered here by the canvas */}
              </div>

              {/* Controls */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs mr-4">High</span>
                  <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-xs mr-4">Medium</span>
                  <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
                  <span className="text-xs">Low</span>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full bg-muted/50">
                    <Layers size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-muted/50">
                    <Filter size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <FeatureItem
              icon={Search}
              title="Smart Search with Auto-Suggest"
              description="Quickly find locations with our intelligent search feature that suggests locations as you type."
            />
            <FeatureItem
              icon={Layers}
              title="Multiple Map Layers"
              description="Switch between dark, light, terrain, and satellite map views for different perspectives."
            />
            <FeatureItem
              icon={Filter}
              title="Advanced Filtering"
              description="Filter potholes by severity, date reported, or distance to focus on what matters to you."
            />
            <FeatureItem
              icon={MapPin}
              title="Data Visualization"
              description="Analyze pothole data with heat maps, bar charts, and pie charts for comprehensive insights."
            />
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

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
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
