"use client"

import { useState, useRef, useEffect } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"

interface Pothole {
  id: string
  latitude: number
  longitude: number
  severity: number
  reportedBy: string
  img?: string
  dateReported: string
}

interface ReportGeneratorProps {
  potholes: Pothole[]
  locationName: string
  searchRadius: number
}

export function ReportGenerator({ potholes, locationName, searchRadius }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const severityChartRef = useRef<HTMLCanvasElement>(null)
  const timelineChartRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLCanvasElement>(null)

  // Prepare chart data
  useEffect(() => {
    if (severityChartRef.current && potholes.length > 0) {
      renderSeverityChart(severityChartRef.current, potholes)
    }

    if (timelineChartRef.current && potholes.length > 0) {
      renderTimelineChart(timelineChartRef.current, potholes)
    }

    if (mapRef.current && potholes.length > 0) {
      renderMapPreview(mapRef.current, potholes)
    }
  }, [potholes])

  const renderSeverityChart = (canvas: HTMLCanvasElement, potholes: Pothole[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 400
    canvas.height = 200

    // Count potholes by severity
    const highSeverity = potholes.filter((p) => p.severity >= 7).length
    const mediumSeverity = potholes.filter((p) => p.severity >= 4 && p.severity < 7).length
    const lowSeverity = potholes.filter((p) => p.severity < 4).length

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Severity Distribution", canvas.width / 2, 20)

    // Draw pie chart
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 70

    const total = highSeverity + mediumSeverity + lowSeverity

    // Define severity data
    const data = [
      { label: "High", value: highSeverity, color: "#FF424F" },
      { label: "Medium", value: mediumSeverity, color: "#FF9E0D" },
      { label: "Low", value: lowSeverity, color: "#05A357" },
    ]

    let startAngle = 0
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // Calculate label position
      const midAngle = startAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(midAngle) * (radius + 20)
      const labelY = centerY + Math.sin(midAngle) * (radius + 20)

      // Draw label
      ctx.fillStyle = "#333"
      ctx.font = "12px Arial"
      ctx.textAlign = midAngle < Math.PI ? "left" : "right"
      ctx.fillText(`${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`, labelX, labelY)

      startAngle += sliceAngle
    })
  }

  const renderTimelineChart = (canvas: HTMLCanvasElement, potholes: Pothole[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 400
    canvas.height = 200

    // Group potholes by date
    const dateMap = new Map<string, number>()

    // Get date range (last 7 days)
    const today = new Date()
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      dates.push(dateString)
      dateMap.set(dateString, 0)
    }

    // Count potholes by date
    potholes.forEach((pothole) => {
      try {
        const date = new Date(pothole.dateReported).toISOString().split("T")[0]
        if (dateMap.has(date)) {
          dateMap.set(date, (dateMap.get(date) || 0) + 1)
        }
      } catch (e) {
        console.error("Error parsing date:", e)
      }
    })

    // Prepare data for chart
    const data = dates.map((date) => ({
      date,
      count: dateMap.get(date) || 0,
    }))

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Reports Over Time", canvas.width / 2, 20)

    // Calculate chart dimensions
    const chartLeft = 40
    const chartRight = canvas.width - 20
    const chartTop = 40
    const chartBottom = canvas.height - 30
    const chartWidth = chartRight - chartLeft
    const chartHeight = chartBottom - chartTop

    // Calculate max value for scaling
    const maxValue = Math.max(...data.map((d) => d.count), 1)

    // Draw axes
    ctx.strokeStyle = "#ccc"
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
    ctx.fillStyle = "#333"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"

    data.forEach((item, index) => {
      const x = chartLeft + index * (chartWidth / (data.length - 1))

      // Format date to be more readable
      const date = new Date(item.date)
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`

      ctx.fillText(formattedDate, x, chartBottom + 15)
    })

    // Draw Y-axis labels
    ctx.textAlign = "right"
    const yAxisSteps = 5

    for (let i = 0; i <= yAxisSteps; i++) {
      const value = Math.round((maxValue / yAxisSteps) * i)
      const y = chartBottom - (value / maxValue) * chartHeight

      ctx.fillText(value.toString(), chartLeft - 5, y + 3)
    }

    // Draw line chart
    ctx.beginPath()
    data.forEach((item, index) => {
      const x = chartLeft + index * (chartWidth / (data.length - 1))
      const y = chartBottom - (item.count / maxValue) * chartHeight

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
    ctx.fillStyle = "rgba(39, 110, 241, 0.1)"
    ctx.fill()

    // Draw data points
    data.forEach((item, index) => {
      const x = chartLeft + index * (chartWidth / (data.length - 1))
      const y = chartBottom - (item.count / maxValue) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "#276EF1"
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw value above point
      ctx.fillStyle = "#333"
      ctx.textAlign = "center"
      ctx.fillText(item.count.toString(), x, y - 10)
    })
  }

  const renderMapPreview = (canvas: HTMLCanvasElement, potholes: Pothole[]) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 400
    canvas.height = 200

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Pothole Location Map", canvas.width / 2, 20)

    // Draw map background
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(20, 30, canvas.width - 40, canvas.height - 50)

    // Draw grid lines
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 0.5

    // Vertical grid lines
    for (let x = 40; x < canvas.width - 20; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 30)
      ctx.lineTo(x, canvas.height - 20)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 50; y < canvas.height - 20; y += 20) {
      ctx.beginPath()
      ctx.moveTo(20, y)
      ctx.lineTo(canvas.width - 20, y)
      ctx.stroke()
    }

    // Find min/max coordinates to scale the map
    let minLat = Math.min(...potholes.map((p) => p.latitude))
    let maxLat = Math.max(...potholes.map((p) => p.latitude))
    let minLng = Math.min(...potholes.map((p) => p.longitude))
    let maxLng = Math.max(...potholes.map((p) => p.longitude))

    // Add some padding
    const latPadding = (maxLat - minLat) * 0.1
    const lngPadding = (maxLng - minLng) * 0.1

    minLat -= latPadding
    maxLat += latPadding
    minLng -= lngPadding
    maxLng += lngPadding

    // If all points are at the same location, create a small area around it
    if (minLat === maxLat) {
      minLat -= 0.001
      maxLat += 0.001
    }
    if (minLng === maxLng) {
      minLng -= 0.001
      maxLng += 0.001
    }

    // Draw potholes
    potholes.forEach((pothole) => {
      // Convert coordinates to canvas position
      const x = 20 + ((pothole.longitude - minLng) / (maxLng - minLng)) * (canvas.width - 40)
      const y = 30 + ((maxLat - pothole.latitude) / (maxLat - minLat)) * (canvas.height - 50)

      // Determine color based on severity
      let color
      if (pothole.severity >= 7) {
        color = "#FF424F" // High
      } else if (pothole.severity >= 4) {
        color = "#FF9E0D" // Medium
      } else {
        color = "#05A357" // Low
      }

      // Draw pothole
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Draw glow effect
      const gradient = ctx.createRadialGradient(x, y, 2, x, y, 8)
      gradient.addColorStop(0, color + "80")
      gradient.addColorStop(1, "transparent")

      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    })

    // Draw legend
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(canvas.width - 90, 35, 70, 65)
    ctx.strokeStyle = "#ccc"
    ctx.strokeRect(canvas.width - 90, 35, 70, 65)

    ctx.fillStyle = "#333"
    ctx.font = "10px Arial"
    ctx.textAlign = "left"
    ctx.fillText("Severity", canvas.width - 85, 45)

    // High
    ctx.beginPath()
    ctx.arc(canvas.width - 80, 55, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#FF424F"
    ctx.fill()
    ctx.fillStyle = "#333"
    ctx.fillText("High", canvas.width - 70, 58)

    // Medium
    ctx.beginPath()
    ctx.arc(canvas.width - 80, 70, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#FF9E0D"
    ctx.fill()
    ctx.fillStyle = "#333"
    ctx.fillText("Medium", canvas.width - 70, 73)

    // Low
    ctx.beginPath()
    ctx.arc(canvas.width - 80, 85, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#05A357"
    ctx.fill()
    ctx.fillStyle = "#333"
    ctx.fillText("Low", canvas.width - 70, 88)
  }

  const generateReport = async () => {
    setIsGenerating(true)

    try {
      // Create a new PDF document
      const pdf = new jsPDF()

      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(33, 33, 33)
      pdf.text("ROAD ANOMALY REPORT", 105, 20, { align: "center" })

      // Add report information
      pdf.setFontSize(12)
      pdf.setTextColor(66, 66, 66)
      pdf.text(`Location: ${locationName}`, 20, 35)
      pdf.text(`Search Radius: ${searchRadius} km`, 20, 42)
      pdf.text(`Total Potholes: ${potholes.length}`, 20, 49)
      pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 56)

      // Add severity summary
      const highSeverity = potholes.filter((p) => p.severity >= 7).length
      const mediumSeverity = potholes.filter((p) => p.severity >= 4 && p.severity < 7).length
      const lowSeverity = potholes.filter((p) => p.severity < 4).length

      pdf.setFontSize(14)
      pdf.setTextColor(33, 33, 33)
      pdf.text("SEVERITY SUMMARY", 20, 70)

      pdf.setFontSize(10)
      pdf.setTextColor(66, 66, 66)
      pdf.text(`High: ${highSeverity} (${((highSeverity / potholes.length) * 100 || 0).toFixed(1)}%)`, 20, 78)
      pdf.text(`Medium: ${mediumSeverity} (${((mediumSeverity / potholes.length) * 100 || 0).toFixed(1)}%)`, 20, 85)
      pdf.text(`Low: ${lowSeverity} (${((lowSeverity / potholes.length) * 100 || 0).toFixed(1)}%)`, 20, 92)

      // Add severity chart
      if (severityChartRef.current) {
        const severityChartImg = severityChartRef.current.toDataURL("image/png")
        pdf.addImage(severityChartImg, "PNG", 105, 65, 85, 42.5)
      }

      // Add timeline chart
      pdf.setFontSize(14)
      pdf.setTextColor(33, 33, 33)
      pdf.text("REPORTS OVER TIME", 20, 110)

      if (timelineChartRef.current) {
        const timelineChartImg = timelineChartRef.current.toDataURL("image/png")
        pdf.addImage(timelineChartImg, "PNG", 20, 115, 170, 42.5)
      }

      // Add map preview
      pdf.setFontSize(14)
      pdf.setTextColor(33, 33, 33)
      pdf.text("LOCATION MAP", 20, 165)

      if (mapRef.current) {
        const mapImg = mapRef.current.toDataURL("image/png")
        pdf.addImage(mapImg, "PNG", 20, 170, 170, 42.5)
      }

      // Add new page for pothole details
      pdf.addPage()

      // Add pothole details table
      pdf.setFontSize(14)
      pdf.setTextColor(33, 33, 33)
      pdf.text("POTHOLE DETAILS", 105, 20, { align: "center" })

      // Table headers
      pdf.setFontSize(10)
      pdf.setTextColor(66, 66, 66)
      pdf.text("ID", 20, 30)
      pdf.text("Severity", 60, 30)
      pdf.text("Location", 90, 30)
      pdf.text("Date Reported", 140, 30)
      pdf.text("Reported By", 175, 30)

      // Draw header line
      pdf.setDrawColor(200, 200, 200)
      pdf.line(20, 32, 190, 32)

      // Table rows
      let y = 40
      potholes.slice(0, 20).forEach((pothole, index) => {
        pdf.setFontSize(8)
        pdf.setTextColor(66, 66, 66)

        // Alternate row background
        if (index % 2 === 1) {
          pdf.setFillColor(245, 245, 245)
          pdf.rect(20, y - 5, 170, 8, "F")
        }

        pdf.text(pothole.id.substring(0, 8), 20, y)
        pdf.text(getSeverityLabel(pothole.severity), 60, y)
        pdf.text(`${pothole.latitude.toFixed(6)}, ${pothole.longitude.toFixed(6)}`, 90, y)
        pdf.text(formatDate(pothole.dateReported), 140, y)
        pdf.text(pothole.reportedBy, 175, y)

        y += 8

        // Add new page if needed
        if (y > 280 && index < potholes.length - 1) {
          pdf.addPage()

          // Add headers on new page
          y = 20
          pdf.setFontSize(10)
          pdf.setTextColor(66, 66, 66)
          pdf.text("ID", 20, y)
          pdf.text("Severity", 60, y)
          pdf.text("Location", 90, y)
          pdf.text("Date Reported", 140, y)
          pdf.text("Reported By", 175, y)

          // Draw header line
          pdf.setDrawColor(200, 200, 200)
          pdf.line(20, y + 2, 190, y + 2)

          y = 30
        }
      })

      // Add note if there are more potholes
      if (potholes.length > 20) {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.text(
          `Note: Showing 20 of ${potholes.length} potholes. Download the full data for complete details.`,
          105,
          y + 10,
          { align: "center" },
        )
      }

      // Save the PDF
      pdf.save(`RoadSense_Report_${locationName}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper functions
  const getSeverityLabel = (severity: number): string => {
    if (severity >= 7) return "High"
    if (severity >= 4) return "Medium"
    return "Low"
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch {
      return "Unknown"
    }
  }

  return (
    <div>
      {/* Hidden canvases for chart generation */}
      <div className="hidden">
        <canvas ref={severityChartRef} width="400" height="200"></canvas>
        <canvas ref={timelineChartRef} width="400" height="200"></canvas>
        <canvas ref={mapRef} width="400" height="200"></canvas>
      </div>

      <Button
        onClick={generateReport}
        disabled={isGenerating || potholes.length === 0}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            Download PDF Report
          </>
        )}
      </Button>
    </div>
  )
}
