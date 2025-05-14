"use client"

import type React from "react"

import { motion, useInView } from "framer-motion"
import { MapPin, Layers, Filter, Search, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"

export function MapPreview() {
  const mapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(mapRef, { once: true })
  const [isMapRendered, setIsMapRendered] = useState(false)

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

    // Define pothole data with more variety
    const potholes = [
      // Critical severity (red)
      { x: 120, y: 50, severity: "critical", size: 9, confidence: 0.92 },
      { x: 350, y: 290, severity: "critical", size: 8, confidence: 0.89 },
      { x: 50, y: 220, severity: "critical", size: 10, confidence: 0.95 },

      // High severity (orange)
      { x: 250, y: 50, severity: "high", size: 7, confidence: 0.85 },
      { x: 180, y: 290, severity: "high", size: 7, confidence: 0.82 },
      { x: 290, y: 200, severity: "high", size: 8, confidence: 0.87 },

      // Medium severity (yellow)
      { x: 400, y: 170, severity: "medium", size: 6, confidence: 0.78 },
      { x: 50, y: 120, severity: "medium", size: 5, confidence: 0.75 },
      { x: 290, y: 80, severity: "medium", size: 6, confidence: 0.76 },

      // Low severity (green)
      { x: 170, y: 150, severity: "low", size: 4, confidence: 0.65 },
      { x: 320, y: 120, severity: "low", size: 4, confidence: 0.68 },
      { x: 220, y: 220, severity: "low", size: 5, confidence: 0.72 },
    ]

    // Draw potholes on streets with improved visuals
    const drawPotholes = () => {
      potholes.forEach((pothole) => {
        let color, radius

        switch (pothole.severity) {
          case "critical":
            color = "#FF424F"
            radius = pothole.size
            break
          case "high":
            color = "#FF9E0D"
            radius = pothole.size
            break
          case "medium":
            color = "#FFCD1C"
            radius = pothole.size
            break
          default:
            color = "#05A357"
            radius = pothole.size
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

        // Draw confidence indicator (small arc)
        ctx.beginPath()
        ctx.arc(pothole.x, pothole.y, radius + 2, 0, Math.PI * 2 * pothole.confidence)
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    }

    // Draw map elements
    drawBlocks()
    drawStreets()
    drawPotholes()

    // Draw a legend
    const drawLegend = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillRect(canvas.width - 130, 10, 120, 100)
      ctx.strokeStyle = "#ccc"
      ctx.strokeRect(canvas.width - 130, 10, 120, 100)

      ctx.fillStyle = "#333"
      ctx.font = "10px Arial"
      ctx.fillText("Pothole Severity", canvas.width - 120, 25)

      // Critical severity
      ctx.beginPath()
      ctx.arc(canvas.width - 115, 40, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FF424F"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("Critical", canvas.width - 100, 43)

      // High severity
      ctx.beginPath()
      ctx.arc(canvas.width - 115, 60, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FF9E0D"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("High", canvas.width - 100, 63)

      // Medium severity
      ctx.beginPath()
      ctx.arc(canvas.width - 115, 80, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#FFCD1C"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("Medium", canvas.width - 100, 83)

      // Low severity
      ctx.beginPath()
      ctx.arc(canvas.width - 115, 100, 5, 0, Math.PI * 2)
      ctx.fillStyle = "#05A357"
      ctx.fill()
      ctx.fillStyle = "#333"
      ctx.fillText("Low", canvas.width - 100, 103)
    }

    drawLegend()
    setIsMapRendered(true)

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      if (!container.contains(canvas)) {
        clearInterval(updateInterval)
        return
      }

      // Add a new pothole at a random position
      const randomX = Math.random() * canvas.width * 0.8 + canvas.width * 0.1
      const randomY = Math.random() * canvas.height * 0.8 + canvas.height * 0.1

      // Find the nearest street
      const nearestStreetX = Math.round(randomX / 120) * 120
      const nearestStreetY = Math.round(randomY / 120) * 120

      // Adjust to be on a street
      const onHorizontal = Math.abs(randomY - nearestStreetY) < Math.abs(randomX - nearestStreetX)
      const finalX = onHorizontal ? randomX : nearestStreetX
      const finalY = onHorizontal ? nearestStreetY : randomY

      // Random severity
      const severities = ["low", "medium", "high", "critical"]
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)]

      // Draw the new pothole
      let color, radius
      const size = 4 + Math.random() * 6
      const confidence = 0.65 + Math.random() * 0.3

      switch (randomSeverity) {
        case "critical":
          color = "#FF424F"
          radius = size
          break
        case "high":
          color = "#FF9E0D"
          radius = size
          break
        case "medium":
          color = "#FFCD1C"
          radius = size
          break
        default:
          color = "#05A357"
          radius = size
      }

      // Draw pothole with animation effect
      const drawAnimatedPothole = (progress: number) => {
        const currentRadius = radius * progress

        // Clear the area
        ctx.clearRect(finalX - radius * 3, finalY - radius * 3, radius * 6, radius * 6)

        // Redraw the street under the pothole
        ctx.strokeStyle = "#d0d0d0"
        ctx.lineWidth = 8
        if (onHorizontal) {
          ctx.beginPath()
          ctx.moveTo(finalX - radius * 3, finalY)
          ctx.lineTo(finalX + radius * 3, finalY)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.moveTo(finalX, finalY - radius * 3)
          ctx.lineTo(finalX, finalY + radius * 3)
          ctx.stroke()
        }

        // Draw pothole
        ctx.beginPath()
        ctx.arc(finalX, finalY, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Draw glow effect
        const gradient = ctx.createRadialGradient(
          finalX,
          finalY,
          currentRadius * 0.5,
          finalX,
          finalY,
          currentRadius * 2,
        )
        gradient.addColorStop(0, color + "80")
        gradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(finalX, finalY, currentRadius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw confidence indicator
        if (progress === 1) {
          ctx.beginPath()
          ctx.arc(finalX, finalY, radius + 2, 0, Math.PI * 2 * confidence)
          ctx.strokeStyle = "#fff"
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // Animate the appearance
      let progress = 0
      const animationInterval = setInterval(() => {
        progress += 0.1
        if (progress > 1) {
          progress = 1
          clearInterval(animationInterval)
        }
        drawAnimatedPothole(progress)
      }, 50)
    }, 5000) // Add a new pothole every 5 seconds

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
          <span className="inline-block text-primary font-medium mb-3">Real-Time Monitoring</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Explore Road Anomalies In Your Area</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Our interactive map displays real-time data from user submissions, allowing you to view road anomalies in
            your area, filter by severity, and analyze patterns with advanced visualization tools.
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

                {/* Live indicator */}
                <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50 z-20 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium">Live Data</span>
                </div>

                {/* Loading state */}
                {!isMapRendered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading map data...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs">Critical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-xs">High</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs">Low</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    <Layers size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    <Filter size={16} />
                  </button>
                </div>
              </div>

              {/* Status bar */}
              <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>12 critical issues detected in this area</span>
                </div>
                <div>Last updated: just now</div>
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
