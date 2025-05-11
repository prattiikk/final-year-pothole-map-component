"use client"

import type React from "react"

import { motion } from "framer-motion"
import { MapPin, Layers, Filter, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MapPreviewProps {
  onViewMapClick?: () => void
}

export function MapPreview({ onViewMapClick }: MapPreviewProps) {
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
              <div className="h-72 md:h-96 relative bg-black overflow-hidden">
                {/* Map placeholder with dots representing potholes */}
                <div className="absolute inset-0 opacity-60">
                  <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="800" height="600" fill="#111" />
                    <circle cx="300" cy="200" r="8" fill="#FF424F" opacity="0.8" />
                    <circle cx="450" cy="320" r="6" fill="#FF9E0D" opacity="0.8" />
                    <circle cx="200" cy="400" r="5" fill="#FFCD1C" opacity="0.8" />
                    <circle cx="600" cy="250" r="7" fill="#FF424F" opacity="0.8" />
                    <circle cx="150" cy="180" r="5" fill="#FF9E0D" opacity="0.8" />
                    <path d="M100,100 L700,500" stroke="#333" strokeWidth="2" />
                    <path d="M200,150 L650,300" stroke="#333" strokeWidth="2" />
                    <path d="M300,500 L500,100" stroke="#333" strokeWidth="2" />
                  </svg>
                </div>

                {/* Current location marker */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-4 h-4 rounded-full bg-blue-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                    }}
                  />
                  <motion.div
                    className="w-10 h-10 rounded-full border-2 border-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                    }}
                  />
                </div>
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
            <Button
              onClick={onViewMapClick}
              className="w-full md:w-auto mt-4 flex items-center justify-center"
              size="lg"
            >
              Explore Full Map <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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
