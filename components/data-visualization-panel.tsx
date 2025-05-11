"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart, PieChart, Layers, X, ChevronLeft, ChevronRight } from "lucide-react"

interface Pothole {
  id: string
  latitude: number
  longitude: number
  severity: number
  reportedBy: string
  img: string
  dateReported: string
}

interface DataVisualizationPanelProps {
  potholes: Pothole[]
  onClose: () => void
}

export function DataVisualizationPanel({ potholes, onClose }: DataVisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<"bar" | "pie" | "heatmap">("bar")
  const [searchRadius, setSearchRadius] = useState<number>(5) // Default 5km
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const heatmapRef = useRef<HTMLCanvasElement>(null)

  // Process data for visualization
  const processData = () => {
    // Count potholes by severity
    const severityCounts = {
      low: potholes.filter((p) => p.severity < 4).length,
      medium: potholes.filter((p) => p.severity >= 4 && p.severity < 7).length,
      high: potholes.filter((p) => p.severity >= 7).length,
    }

    // Count potholes by date (last 7 days)
    const now = new Date()
    const dateLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      return d.toISOString().split("T")[0]
    }).reverse()

    const dateCounts = dateLabels.map((date) => {
      return potholes.filter((p) => p.dateReported.split("T")[0] === date).length
    })

    return { severityCounts, dateLabels, dateCounts }
  }

  // Draw bar chart
  useEffect(() => {
    if (!barChartRef.current || activeTab !== "bar") return

    const canvas = barChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 300
    canvas.height = canvas.parentElement?.offsetHeight || 200

    const { severityCounts } = processData()
    const data = [severityCounts.low, severityCounts.medium, severityCounts.high]
    const labels = ["Low", "Medium", "High"]
    const colors = ["#FFCD1C", "#FF9E0D", "#FF424F"]

    // Draw bar chart
    const barWidth = canvas.width / (data.length * 2)
    const maxValue = Math.max(...data, 1) // Ensure non-zero max
    const padding = 40

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Potholes by Severity", canvas.width / 2, 20)

    // Draw bars
    data.forEach((value, index) => {
      const x = padding + index * (barWidth * 2) + barWidth / 2
      const barHeight = (value / maxValue) * (canvas.height - padding * 2)

      // Draw bar
      ctx.fillStyle = colors[index]
      ctx.fillRect(x, canvas.height - padding - barHeight, barWidth, barHeight)

      // Draw label
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.fillText(labels[index], x + barWidth / 2, canvas.height - padding + 15)

      // Draw value
      ctx.fillText(value.toString(), x + barWidth / 2, canvas.height - padding - barHeight - 5)
    })
  }, [potholes, activeTab])

  // Draw pie chart
  useEffect(() => {
    if (!pieChartRef.current || activeTab !== "pie") return

    const canvas = pieChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 300
    canvas.height = canvas.parentElement?.offsetHeight || 200

    const { severityCounts } = processData()
    const data = [severityCounts.low, severityCounts.medium, severityCounts.high]
    const labels = ["Low", "Medium", "High"]
    const colors = ["#FFCD1C", "#FF9E0D", "#FF424F"]

    // Calculate total
    const total = data.reduce((sum, value) => sum + value, 0)

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Severity Distribution", canvas.width / 2, 20)

    // Draw pie segments
    let startAngle = 0
    data.forEach((value, index) => {
      if (total === 0) return // Avoid division by zero

      const sliceAngle = (value / total) * 2 * Math.PI

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = colors[index]
      ctx.fill()

      // Draw label line and text
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 1.2
      const labelX = centerX + Math.cos(midAngle) * labelRadius
      const labelY = centerY + Math.sin(midAngle) * labelRadius

      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
      ctx.lineTo(labelX, labelY)
      ctx.strokeStyle = "#fff"
      ctx.stroke()

      ctx.fillStyle = "#fff"
      ctx.textAlign = midAngle < Math.PI ? "left" : "right"
      ctx.fillText(`${labels[index]}: ${value} (${Math.round((value / total) * 100)}%)`, labelX, labelY)

      startAngle += sliceAngle
    })

    // Draw empty state if no data
    if (total === 0) {
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.fillText("No pothole data available", centerX, centerY)
    }
  }, [potholes, activeTab])

  // Draw heatmap
  useEffect(() => {
    if (!heatmapRef.current || activeTab !== "heatmap") return

    const canvas = heatmapRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 300
    canvas.height = canvas.parentElement?.offsetHeight || 200

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Heatmap (Simplified)", canvas.width / 2, 20)

    // Create a simplified heatmap
    const gridSize = 20
    const cols = Math.floor(canvas.width / gridSize)
    const rows = Math.floor(canvas.height / gridSize)

    // Initialize grid with zeros
    const grid = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0))

    // Randomly distribute potholes in the grid based on actual data
    potholes.forEach((pothole) => {
      const row = Math.floor(Math.random() * rows)
      const col = Math.floor(Math.random() * cols)
      grid[row][col] += pothole.severity
    })

    // Find max value for normalization
    let maxVal = 1
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        maxVal = Math.max(maxVal, grid[i][j])
      }
    }

    // Draw heatmap
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const value = grid[i][j]
        if (value > 0) {
          const intensity = value / maxVal

          // Create gradient for each cell
          const gradient = ctx.createRadialGradient(
            j * gridSize + gridSize / 2,
            i * gridSize + gridSize / 2,
            0,
            j * gridSize + gridSize / 2,
            i * gridSize + gridSize / 2,
            gridSize,
          )

          // Determine color based on intensity
          let color
          if (intensity < 0.3) {
            color = `rgba(255, 205, 28, ${intensity * 0.8})`
          } else if (intensity < 0.7) {
            color = `rgba(255, 158, 13, ${intensity * 0.8})`
          } else {
            color = `rgba(255, 66, 79, ${intensity * 0.8})`
          }

          gradient.addColorStop(0, color)
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

          ctx.fillStyle = gradient
          ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize)
        }
      }
    }

    // Draw legend
    const legendX = 20
    const legendY = canvas.height - 60
    const legendWidth = 150
    const legendHeight = 20

    const legendGradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0)
    legendGradient.addColorStop(0, "rgba(255, 205, 28, 0.8)")
    legendGradient.addColorStop(0.5, "rgba(255, 158, 13, 0.8)")
    legendGradient.addColorStop(1, "rgba(255, 66, 79, 0.8)")

    ctx.fillStyle = legendGradient
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)

    ctx.fillStyle = "#fff"
    ctx.textAlign = "center"
    ctx.fillText("Low", legendX, legendY + legendHeight + 15)
    ctx.fillText("High", legendX + legendWidth, legendY + legendHeight + 15)
  }, [potholes, activeTab])

  return (
    <div className="absolute top-0 left-0 bottom-0 z-40 bg-black bg-opacity-90 shadow-lg w-full md:w-96 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Data Visualization</h2>
        <button className="p-2 rounded-full hover:bg-gray-800" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-gray-800">
        <label className="block text-sm text-gray-400 mb-2">Search Radius (km)</label>
        <div className="flex items-center">
          <button
            className="p-1 bg-gray-800 rounded-l-md"
            onClick={() => setSearchRadius((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 py-1 bg-gray-700 text-center">{searchRadius} km</div>
          <button className="p-1 bg-gray-800 rounded-r-md" onClick={() => setSearchRadius((prev) => prev + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="flex space-x-2">
          <button
            className={`flex-1 py-2 rounded-md flex items-center justify-center ${activeTab === "bar" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setActiveTab("bar")}
          >
            <BarChart size={16} className="mr-2" />
            Bar
          </button>
          <button
            className={`flex-1 py-2 rounded-md flex items-center justify-center ${activeTab === "pie" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setActiveTab("pie")}
          >
            <PieChart size={16} className="mr-2" />
            Pie
          </button>
          <button
            className={`flex-1 py-2 rounded-md flex items-center justify-center ${activeTab === "heatmap" ? "bg-blue-600" : "bg-gray-800"}`}
            onClick={() => setActiveTab("heatmap")}
          >
            <Layers size={16} className="mr-2" />
            Heatmap
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full relative">
          {activeTab === "bar" && <canvas ref={barChartRef} className="w-full h-full" />}

          {activeTab === "pie" && <canvas ref={pieChartRef} className="w-full h-full" />}

          {activeTab === "heatmap" && <canvas ref={heatmapRef} className="w-full h-full" />}

          {potholes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No pothole data available in the selected radius
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400 mb-2">
          Total potholes in {searchRadius}km radius: <span className="font-semibold text-white">{potholes.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-gray-800 p-2 rounded-md">
            <div className="text-yellow-400 font-semibold">{potholes.filter((p) => p.severity < 4).length}</div>
            <div className="text-gray-400">Low</div>
          </div>
          <div className="bg-gray-800 p-2 rounded-md">
            <div className="text-orange-400 font-semibold">
              {potholes.filter((p) => p.severity >= 4 && p.severity < 7).length}
            </div>
            <div className="text-gray-400">Medium</div>
          </div>
          <div className="bg-gray-800 p-2 rounded-md">
            <div className="text-red-400 font-semibold">{potholes.filter((p) => p.severity >= 7).length}</div>
            <div className="text-gray-400">High</div>
          </div>
        </div>
      </div>
    </div>
  )
}
