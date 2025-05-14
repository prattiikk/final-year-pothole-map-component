"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { BarChart, PieChart, LineChart, Layers } from "lucide-react"

export function DataVisualizationPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isInView) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.offsetWidth
        canvas.height = container.offsetHeight
      }
    }
    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Draw simplified chart
    const drawChart = () => {
      const width = canvas.width
      const height = canvas.height
      const padding = 40
      const chartWidth = width - 2 * padding
      const chartHeight = height - 2 * padding
      const data = [25, 40, 60, 75, 45, 30, 65, 50]
      const barWidth = chartWidth / data.length - 10

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw axes
      ctx.beginPath()
      ctx.moveTo(padding, padding)
      ctx.lineTo(padding, height - padding)
      ctx.lineTo(width - padding, height - padding)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw bars
      data.forEach((value, index) => {
        const x = padding + index * (barWidth + 10) + 5
        const barHeight = (value / 100) * chartHeight
        const y = height - padding - barHeight

        // Draw bar
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() + "80"
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw value
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
        ctx.textAlign = "center"
        ctx.font = "12px Arial"
        ctx.fillText(value.toString(), x + barWidth / 2, y - 5)
      })
    }

    drawChart()
    window.addEventListener("resize", drawChart)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      window.removeEventListener("resize", drawChart)
    }
  }, [isInView])

  return (
    <section id="data" className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-medium mb-3">Data Analysis</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Visualize Pothole Data</h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">
            Turn complex pothole data into actionable insights with our powerful visualization tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-4">Comprehensive Analysis Tools</h3>
              <p className="text-foreground/70">
                Our data visualization tools provide a detailed overview of road conditions in your area. Analyze
                pothole data by severity, location, date reported, and more to gain valuable insights.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <VisualizationFeature
                  icon={BarChart}
                  title="Bar Charts"
                  description="Compare pothole data across different areas and time periods"
                />
                <VisualizationFeature
                  icon={PieChart}
                  title="Pie Charts"
                  description="View distribution of pothole severity and other metrics"
                />
                <VisualizationFeature
                  icon={LineChart}
                  title="Trend Analysis"
                  description="Track changes in road conditions over time"
                />
                <VisualizationFeature
                  icon={Layers}
                  title="Heatmaps"
                  description="Identify hotspots with high concentration of potholes"
                />
              </div>
            </div>
          </motion.div>

          <div ref={ref} className="relative h-[400px] rounded-2xl overflow-hidden border border-border/50">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  )
}

function VisualizationFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-foreground/70">{description}</p>
    </div>
  )
}
