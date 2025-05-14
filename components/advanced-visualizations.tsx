"use client"

import { useEffect, useRef } from "react"
import { BarChart, PieChart, Layers, AlertTriangle, Clock, Map } from "lucide-react"

interface Detection {
  id: string
  severity: string
  confidence: number
  bbox: number[]
  center: number[]
  relativePosition: unknown
  className: string
}

interface DetectionData {
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

interface AdvancedVisualizationsProps {
  data: DetectionData[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdvancedVisualizations({ data, activeTab, onTabChange }: AdvancedVisualizationsProps) {
  const barChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const heatmapRef = useRef<HTMLCanvasElement>(null)
  const positionMapRef = useRef<HTMLCanvasElement>(null)
  const classDistributionRef = useRef<HTMLCanvasElement>(null)

  // Process data for visualization
  const processData = () => {
    // Count detections by severity
    const severityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }

    // Count detections by class
    const classCounts: Record<string, number> = {}

    // Track confidence by class
    const confidenceByClass: Record<string, number[]> = {}

    // Track position data
    const positionData: Array<{ x: number; y: number; severity: string }> = []

    // Track processing time
    const processingTimes: Array<{ date: string; time: number }> = []

    // Count detections by date
    const now = new Date()
    const dateLabels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      return d.toISOString().split("T")[0]
    }).reverse()

    const dateCounts = dateLabels.reduce(
      (acc, date) => {
        acc[date] = 0
        return acc
      },
      {} as Record<string, number>,
    )

    // Process all data
    data.forEach((item) => {
      // Add to processing times
      processingTimes.push({
        date: new Date(item.metadata.createdAt).toISOString().split("T")[0],
        time: item.detection.processingTimeMs,
      })

      // Add to date counts
      const itemDate = new Date(item.metadata.createdAt).toISOString().split("T")[0]
      if (dateCounts[itemDate] !== undefined) {
        dateCounts[itemDate] += 1
      }

      // Process individual detections
      item.detection.details.forEach((detection) => {
        // Add to severity counts
        if (severityCounts[detection.severity]) {
          severityCounts[detection.severity]++
        }

        // Add to class counts
        if (classCounts[detection.className]) {
          classCounts[detection.className]++
        } else {
          classCounts[detection.className] = 1
        }

        // Add to confidence by class
        if (!confidenceByClass[detection.className]) {
          confidenceByClass[detection.className] = []
        }
        confidenceByClass[detection.className].push(detection.confidence)

        // Add to position data if relativePosition exists
        if (detection.relativePosition) {
          try {
            const pos = Array.isArray(detection.relativePosition)
              ? detection.relativePosition
              : JSON.parse(detection.relativePosition as string)

            if (pos && pos.length === 2) {
              positionData.push({
                x: pos[0],
                y: pos[1],
                severity: detection.severity,
              })
            }
          } catch (e) {
            console.error("Error parsing position data:", e)
          }
        }
      })
    })

    // Calculate average confidence by class
    const avgConfidenceByClass = Object.entries(confidenceByClass).map(([className, confidences]) => ({
      className,
      avgConfidence: confidences.reduce((sum, val) => sum + val, 0) / confidences.length,
    }))

    return {
      severityCounts,
      classCounts,
      avgConfidenceByClass,
      positionData,
      processingTimes,
      dateLabels,
      dateCounts,
    }
  }

  // Draw bar chart for severity distribution
  useEffect(() => {
    if (!barChartRef.current || activeTab !== "severity") return

    const canvas = barChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { severityCounts } = processData()
    const labels = Object.keys(severityCounts)
    const values = Object.values(severityCounts)

    // Colors for different severity levels
    const colors = {
      LOW: "#FFCD1C",
      MEDIUM: "#FF9E0D",
      HIGH: "#FF424F",
      CRITICAL: "#9C27B0",
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Severity Distribution", canvas.width / 2, 30)

    // Draw bars
    const barWidth = (canvas.width - 100) / labels.length
    const maxValue = Math.max(...values, 1)
    const barHeightMultiplier = (canvas.height - 100) / maxValue

    labels.forEach((label, index) => {
      const value = values[index]
      const x = 50 + index * barWidth
      const barHeight = value * barHeightMultiplier
      const y = canvas.height - 50 - barHeight

      // Draw bar
      ctx.fillStyle = colors[label as keyof typeof colors] || "#276EF1"
      ctx.fillRect(x, y, barWidth - 10, barHeight)

      // Draw label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(label, x + (barWidth - 10) / 2, canvas.height - 30)

      // Draw value
      ctx.fillText(value.toString(), x + (barWidth - 10) / 2, y - 10)
    })

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(40, canvas.height - 50)
    ctx.lineTo(canvas.width - 40, canvas.height - 50)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(50, 50)
    ctx.lineTo(50, canvas.height - 40)
    ctx.stroke()

    // Y-axis labels
    const yAxisSteps = 5
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((maxValue / yAxisSteps) * i)
      const y = canvas.height - 50 - value * barHeightMultiplier

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.font = "10px Arial"
      ctx.textAlign = "right"
      ctx.fillText(value.toString(), 45, y + 3)

      // Grid line
      ctx.beginPath()
      ctx.moveTo(50, y)
      ctx.lineTo(canvas.width - 40, y)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "20"
      ctx.stroke()
    }
  }, [data, activeTab])

  // Draw pie chart for class distribution
  useEffect(() => {
    if (!pieChartRef.current || activeTab !== "classes") return

    const canvas = pieChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { classCounts } = processData()

    // Sort classes by count (descending)
    const sortedClasses = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Show top 5 classes

    const labels = sortedClasses.map(([className]) => className)
    const values = sortedClasses.map(([, count]) => count)
    const total = values.reduce((sum, value) => sum + value, 0)

    // Generate colors
    const colors = [
      "#276EF1", // Blue
      "#FF424F", // Red
      "#05A357", // Green
      "#FFCD1C", // Yellow
      "#FF9E0D", // Orange
    ]

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Top 5 Pothole Classes", canvas.width / 2, 30)

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 80

    let startAngle = 0
    sortedClasses.forEach(([className, count], index) => {
      const sliceAngle = (count / total) * 2 * Math.PI

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = colors[index % colors.length]
      ctx.fill()

      // Calculate label position
      const midAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 1.2
      const labelX = centerX + Math.cos(midAngle) * labelRadius
      const labelY = centerY + Math.sin(midAngle) * labelRadius

      // Draw line to label
      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
      ctx.lineTo(labelX, labelY)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.stroke()

      // Draw label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.font = "12px Arial"
      ctx.textAlign = midAngle < Math.PI ? "left" : "right"
      ctx.fillText(`${className}: ${count} (${Math.round((count / total) * 100)}%)`, labelX, labelY)

      startAngle += sliceAngle
    })

    // Draw empty state if no data
    if (total === 0) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.textAlign = "center"
      ctx.fillText("No class data available", centerX, centerY)
    }
  }, [data, activeTab])

  // Draw line chart for time series
  useEffect(() => {
    if (!lineChartRef.current || activeTab !== "timeline") return

    const canvas = lineChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { dateLabels, dateCounts } = processData()
    const values = dateLabels.map((date) => dateCounts[date] || 0)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Reports Over Time", canvas.width / 2, 30)

    // Calculate chart dimensions
    const chartLeft = 60
    const chartRight = canvas.width - 40
    const chartTop = 60
    const chartBottom = canvas.height - 60
    const chartWidth = chartRight - chartLeft
    const chartHeight = chartBottom - chartTop

    // Calculate max value for scaling
    const maxValue = Math.max(...values, 1)

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(chartLeft, chartBottom)
    ctx.lineTo(chartRight, chartBottom)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(chartLeft, chartTop)
    ctx.lineTo(chartLeft, chartBottom)
    ctx.stroke()

    // Draw X-axis labels (dates)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "10px Arial"
    ctx.textAlign = "center"

    dateLabels.forEach((date, index) => {
      const x = chartLeft + index * (chartWidth / (dateLabels.length - 1))

      // Format date to be more readable
      const formattedDate = new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })

      ctx.fillText(formattedDate, x, chartBottom + 20)

      // Draw vertical grid line
      ctx.beginPath()
      ctx.moveTo(x, chartBottom)
      ctx.lineTo(x, chartTop)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "10"
      ctx.stroke()
    })

    // Draw Y-axis labels
    ctx.textAlign = "right"
    const yAxisSteps = 5

    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((maxValue / yAxisSteps) * i)
      const y = chartBottom - (value / maxValue) * chartHeight

      ctx.fillText(value.toString(), chartLeft - 10, y + 3)

      // Draw horizontal grid line
      ctx.beginPath()
      ctx.moveTo(chartLeft, y)
      ctx.lineTo(chartRight, y)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "10"
      ctx.stroke()
    }

    // Draw line chart
    ctx.beginPath()
    values.forEach((value, index) => {
      const x = chartLeft + index * (chartWidth / (values.length - 1))
      const y = chartBottom - (value / maxValue) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.strokeStyle = "#276EF1"
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area under the line
    ctx.lineTo(chartLeft + chartWidth, chartBottom)
    ctx.lineTo(chartLeft, chartBottom)
    ctx.closePath()
    ctx.fillStyle = "#276EF120"
    ctx.fill()

    // Draw data points
    values.forEach((value, index) => {
      const x = chartLeft + index * (chartWidth / (values.length - 1))
      const y = chartBottom - (value / maxValue) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "#276EF1"
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw value above point
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.textAlign = "center"
      ctx.fillText(value.toString(), x, y - 10)
    })
  }, [data, activeTab])

  // Draw heatmap for position distribution
  useEffect(() => {
    if (!heatmapRef.current || activeTab !== "heatmap") return

    const canvas = heatmapRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { positionData } = processData()

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Position Heatmap", canvas.width / 2, 30)

    // Draw frame representing a road/image
    const frameLeft = 50
    const frameRight = canvas.width - 50
    const frameTop = 60
    const frameBottom = canvas.height - 60
    const frameWidth = frameRight - frameLeft
    const frameHeight = frameBottom - frameTop

    // Draw frame
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
    ctx.lineWidth = 2
    ctx.strokeRect(frameLeft, frameTop, frameWidth, frameHeight)

    // Draw grid
    ctx.lineWidth = 0.5

    // Vertical grid lines
    for (let x = 0.25; x < 1; x += 0.25) {
      const lineX = frameLeft + frameWidth * x
      ctx.beginPath()
      ctx.moveTo(lineX, frameTop)
      ctx.lineTo(lineX, frameBottom)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0.25; y < 1; y += 0.25) {
      const lineY = frameTop + frameHeight * y
      ctx.beginPath()
      ctx.moveTo(frameLeft, lineY)
      ctx.lineTo(frameRight, lineY)
      ctx.stroke()
    }

    // Draw position data points
    positionData.forEach((point) => {
      // Convert relative position (0-1) to canvas coordinates
      const x = frameLeft + point.x * frameWidth
      const y = frameTop + point.y * frameHeight

      // Determine color based on severity
      let color
      switch (point.severity) {
        case "HIGH":
        case "CRITICAL":
          color = "#FF424F"
          break
        case "MEDIUM":
          color = "#FF9E0D"
          break
        default:
          color = "#FFCD1C"
      }

      // Draw point with glow effect
      const radius = 5

      // Glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3)
      gradient.addColorStop(0, color + "80")
      gradient.addColorStop(1, "transparent")

      ctx.beginPath()
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Center point
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })

    // Draw legend
    const legendX = frameRight - 120
    const legendY = frameTop + 20

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--background").trim() + "80"
    ctx.fillRect(legendX - 10, legendY - 15, 130, 85)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
    ctx.strokeRect(legendX - 10, legendY - 15, 130, 85)

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText("Severity", legendX, legendY)

    // High
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY + 20, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FF424F"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("High", legendX + 25, legendY + 23)

    // Medium
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY + 40, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FF9E0D"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("Medium", legendX + 25, legendY + 43)

    // Low
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY + 60, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FFCD1C"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("Low", legendX + 25, legendY + 63)

    // Draw empty state if no data
    if (positionData.length === 0) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.textAlign = "center"
      ctx.fillText("No position data available", canvas.width / 2, canvas.height / 2)
    }
  }, [data, activeTab])

  // Draw position map
  useEffect(() => {
    if (!positionMapRef.current || activeTab !== "position") return

    const canvas = positionMapRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { positionData } = processData()

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Position Map", canvas.width / 2, 30)

    // Draw road representation
    const roadLeft = 100
    const roadRight = canvas.width - 100
    const roadTop = 100
    const roadBottom = canvas.height - 100
    const roadWidth = roadRight - roadLeft
    const roadHeight = roadBottom - roadTop

    // Draw road background
    ctx.fillStyle = "#444"
    ctx.fillRect(roadLeft, roadTop, roadWidth, roadHeight)

    // Draw road markings
    ctx.strokeStyle = "#fff"
    ctx.setLineDash([20, 20])
    ctx.lineWidth = 2

    // Center line
    ctx.beginPath()
    ctx.moveTo(roadLeft, roadTop + roadHeight / 2)
    ctx.lineTo(roadRight, roadTop + roadHeight / 2)
    ctx.stroke()

    // Reset line dash
    ctx.setLineDash([])

    // Draw road edges
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 4

    // Top edge
    ctx.beginPath()
    ctx.moveTo(roadLeft, roadTop)
    ctx.lineTo(roadRight, roadTop)
    ctx.stroke()

    // Bottom edge
    ctx.beginPath()
    ctx.moveTo(roadLeft, roadBottom)
    ctx.lineTo(roadRight, roadBottom)
    ctx.stroke()

    // Draw position data points
    positionData.forEach((point) => {
      // Convert relative position (0-1) to road coordinates
      const x = roadLeft + point.x * roadWidth
      const y = roadTop + point.y * roadHeight

      // Determine color based on severity
      let color
      switch (point.severity) {
        case "HIGH":
        case "CRITICAL":
          color = "#FF424F"
          break
        case "MEDIUM":
          color = "#FF9E0D"
          break
        default:
          color = "#FFCD1C"
      }

      // Draw pothole
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw legend
    const legendX = 50
    const legendY = 70

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillText("Severity:", legendX, legendY)

    // High
    ctx.beginPath()
    ctx.arc(legendX + 70, legendY - 4, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FF424F"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("High", legendX + 85, legendY)

    // Medium
    ctx.beginPath()
    ctx.arc(legendX + 140, legendY - 4, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FF9E0D"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("Medium", legendX + 155, legendY)

    // Low
    ctx.beginPath()
    ctx.arc(legendX + 220, legendY - 4, 5, 0, Math.PI * 2)
    ctx.fillStyle = "#FFCD1C"
    ctx.fill()
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.fillText("Low", legendX + 235, legendY)

    // Draw empty state if no data
    if (positionData.length === 0) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.textAlign = "center"
      ctx.fillText("No position data available", canvas.width / 2, canvas.height / 2)
    }
  }, [data, activeTab])

  // Draw class distribution with confidence
  useEffect(() => {
    if (!classDistributionRef.current || activeTab !== "confidence") return

    const canvas = classDistributionRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.offsetWidth || 600
    canvas.height = canvas.parentElement?.offsetHeight || 400

    const { avgConfidenceByClass } = processData()

    // Sort by average confidence (descending)
    const sortedData = [...avgConfidenceByClass].sort((a, b) => b.avgConfidence - a.avgConfidence).slice(0, 8) // Show top 8 classes

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Average Confidence by Class", canvas.width / 2, 30)

    // Calculate chart dimensions
    const chartLeft = 150
    const chartRight = canvas.width - 40
    const chartTop = 60
    const chartBottom = canvas.height - 40
    const chartHeight = chartBottom - chartTop
    const barHeight = Math.min(25, (chartHeight / sortedData.length) * 0.7)
    const barSpacing = (chartHeight - barHeight * sortedData.length) / (sortedData.length + 1)

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "40"
    ctx.lineWidth = 1

    // X-axis
    ctx.beginPath()
    ctx.moveTo(chartLeft, chartBottom)
    ctx.lineTo(chartRight, chartBottom)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(chartLeft, chartTop)
    ctx.lineTo(chartLeft, chartBottom)
    ctx.stroke()

    // Draw X-axis labels (confidence percentages)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
    ctx.font = "10px Arial"
    ctx.textAlign = "center"

    const xAxisSteps = 5
    const chartWidth = chartRight - chartLeft

    for (let i = 0; i <= xAxisSteps; i++) {
      const value = i / xAxisSteps
      const x = chartLeft + value * chartWidth

      ctx.fillText(`${(value * 100).toFixed(0)}%`, x, chartBottom + 15)

      // Draw vertical grid line
      ctx.beginPath()
      ctx.moveTo(x, chartBottom)
      ctx.lineTo(x, chartTop)
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() + "10"
      ctx.stroke()
    }

    // Draw bars
    sortedData.forEach((item, index) => {
      const y = chartTop + barSpacing + index * (barHeight + barSpacing)
      const barWidth = item.avgConfidence * chartWidth

      // Draw class label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.font = "12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(item.className, chartLeft - 10, y + barHeight / 2 + 4)

      // Draw bar
      ctx.fillStyle = "#276EF1"
      ctx.fillRect(chartLeft, y, barWidth, barHeight)

      // Draw confidence value
      ctx.fillStyle = "#fff"
      ctx.textAlign = "left"
      ctx.font = "10px Arial"
      ctx.fillText(`${(item.avgConfidence * 100).toFixed(1)}%`, chartLeft + barWidth + 5, y + barHeight / 2 + 3)
    })

    // Draw empty state if no data
    if (sortedData.length === 0) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
      ctx.textAlign = "center"
      ctx.fillText("No confidence data available", canvas.width / 2, canvas.height / 2)
    }
  }, [data, activeTab])

  return (
    <div className="space-y-6">
      {/* Visualization tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "severity" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("severity")}
        >
          <BarChart className="h-4 w-4" />
          Severity Distribution
        </button>
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "classes" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("classes")}
        >
          <PieChart className="h-4 w-4" />
          Class Distribution
        </button>
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "timeline" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("timeline")}
        >
          <Clock className="h-4 w-4" />
          Timeline Analysis
        </button>
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "heatmap" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("heatmap")}
        >
          <Layers className="h-4 w-4" />
          Position Heatmap
        </button>
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "position" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("position")}
        >
          <Map className="h-4 w-4" />
          Road Position
        </button>
        <button
          className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
            activeTab === "confidence" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onTabChange("confidence")}
        >
          <AlertTriangle className="h-4 w-4" />
          Confidence Analysis
        </button>
      </div>

      {/* Visualization canvas */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border/50 h-[400px]">
        {activeTab === "severity" && <canvas ref={barChartRef} className="w-full h-full" />}
        {activeTab === "classes" && <canvas ref={pieChartRef} className="w-full h-full" />}
        {activeTab === "timeline" && <canvas ref={lineChartRef} className="w-full h-full" />}
        {activeTab === "heatmap" && <canvas ref={heatmapRef} className="w-full h-full" />}
        {activeTab === "position" && <canvas ref={positionMapRef} className="w-full h-full" />}
        {activeTab === "confidence" && <canvas ref={classDistributionRef} className="w-full h-full" />}

        {data.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No data available for visualization</p>
          </div>
        )}
      </div>

      {/* Visualization description */}
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          {activeTab === "severity" && <BarChart className="h-4 w-4" />}
          {activeTab === "classes" && <PieChart className="h-4 w-4" />}
          {activeTab === "timeline" && <Clock className="h-4 w-4" />}
          {activeTab === "heatmap" && <Layers className="h-4 w-4" />}
          {activeTab === "position" && <Map className="h-4 w-4" />}
          {activeTab === "confidence" && <AlertTriangle className="h-4 w-4" />}

          {activeTab === "severity" && "Severity Distribution"}
          {activeTab === "classes" && "Class Distribution"}
          {activeTab === "timeline" && "Timeline Analysis"}
          {activeTab === "heatmap" && "Position Heatmap"}
          {activeTab === "position" && "Road Position"}
          {activeTab === "confidence" && "Confidence Analysis"}
        </h3>

        <p className="text-sm text-muted-foreground">
          {activeTab === "severity" &&
            "This chart shows the distribution of pothole severity levels across all detections. Higher severity potholes require more urgent attention."}
          {activeTab === "classes" &&
            "This chart shows the distribution of pothole classes detected by our AI model. Different classes represent different types of road anomalies."}
          {activeTab === "timeline" &&
            "This chart shows the number of pothole reports over time, helping identify trends and patterns in road deterioration."}
          {activeTab === "heatmap" &&
            "This heatmap shows where potholes are most commonly detected within the camera frame, helping identify patterns in pothole positioning."}
          {activeTab === "position" &&
            "This visualization shows pothole positions on a simulated road surface, helping understand their distribution across the road."}
          {activeTab === "confidence" &&
            "This chart shows the average confidence level for each pothole class, indicating how reliable the AI detection is for different types of anomalies."}
        </p>
      </div>
    </div>
  )
}
