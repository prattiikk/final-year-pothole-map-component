"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BarChart, PieChart, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

interface UnifiedVisualizationsProps {
    data: DetectionData[]
    className?: string
}

export function UnifiedVisualizations({ data, className }: UnifiedVisualizationsProps) {
    const [activeTab, setActiveTab] = useState("severity")

    const barChartRef = useRef<HTMLCanvasElement>(null)
    const pieChartRef = useRef<HTMLCanvasElement>(null)
    const lineChartRef = useRef<HTMLCanvasElement>(null)
    const confidenceChartRef = useRef<HTMLCanvasElement>(null)

    // Process data for visualization
    const processData = useCallback(() => {
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

        // Track confidence distribution
        const confidenceRanges = [0, 0.6, 0.7, 0.8, 0.9, 1.0]
        const confidenceCounts = Array(confidenceRanges.length - 1).fill(0)

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

                // Add to confidence counts
                for (let i = 0; i < confidenceRanges.length - 1; i++) {
                    if (detection.confidence >= confidenceRanges[i] && detection.confidence < confidenceRanges[i + 1]) {
                        confidenceCounts[i]++
                        break
                    }
                }

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
            confidenceRanges,
            confidenceCounts,
        }
    }, [data])

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
            LOW: "#00C49F",
            MEDIUM: "#FFBB28",
            HIGH: "#FF8042",
            CRITICAL: "#FF6B6B",
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
    }, [data, activeTab, processData])

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

        // const labels = sortedClasses.map(([className]) => className)
        const values = sortedClasses.map(([, count]) => count)
        const total = values.reduce((sum, value) => sum + value, 0)

        // Generate colors
        const colors = [
            "#276EF1", // Blue
            "#FF424F", // Red
            "#05A357", // Green
            "#FFBB28", // Yellow
            "#FF8042", // Orange
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
    }, [data, activeTab, processData])

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
    }, [data, activeTab, processData])

    // Draw confidence distribution
    useEffect(() => {
        if (!confidenceChartRef.current || activeTab !== "confidence") return

        const canvas = confidenceChartRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas dimensions
        canvas.width = canvas.parentElement?.offsetWidth || 600
        canvas.height = canvas.parentElement?.offsetHeight || 400

        const { confidenceRanges, confidenceCounts } = processData()

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw title
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
        ctx.font = "18px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Confidence Distribution", canvas.width / 2, 30)

        // Calculate chart dimensions
        const chartLeft = 60
        const chartRight = canvas.width - 40
        const chartTop = 60
        const chartBottom = canvas.height - 60
        const chartWidth = chartRight - chartLeft
        const chartHeight = chartBottom - chartTop

        // Create labels for confidence ranges
        const labels = []
        for (let i = 0; i < confidenceRanges.length - 1; i++) {
            labels.push(`${(confidenceRanges[i] * 100).toFixed(0)}-${(confidenceRanges[i + 1] * 100).toFixed(0)}%`)
        }

        // Calculate max value for scaling
        const maxValue = Math.max(...confidenceCounts, 1)

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

        // Draw bars
        const barWidth = chartWidth / labels.length

        labels.forEach((label, index) => {
            const value = confidenceCounts[index]
            const x = chartLeft + index * barWidth
            const barHeight = (value / maxValue) * chartHeight
            const y = chartBottom - barHeight

            // Draw bar
            ctx.fillStyle = "#00C49F"
            ctx.fillRect(x, y, barWidth - 10, barHeight)

            // Draw label
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            ctx.fillText(label, x + (barWidth - 10) / 2, chartBottom + 20)

            // Draw value
            ctx.fillText(value.toString(), x + (barWidth - 10) / 2, y - 10)
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
    }, [data, activeTab, processData])

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Road Anomaly Visualizations</CardTitle>
                <CardDescription>
                    Interactive visualizations of road anomaly data to help identify patterns and trends
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Visualization tabs */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={activeTab === "severity" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("severity")}
                        className="flex items-center gap-2"
                    >
                        <BarChart className="h-4 w-4" />
                        Severity
                    </Button>
                    <Button
                        variant={activeTab === "classes" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("classes")}
                        className="flex items-center gap-2"
                    >
                        <PieChart className="h-4 w-4" />
                        Classes
                    </Button>
                    <Button
                        variant={activeTab === "timeline" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("timeline")}
                        className="flex items-center gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Timeline
                    </Button>
                    <Button
                        variant={activeTab === "confidence" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab("confidence")}
                        className="flex items-center gap-2"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Confidence
                    </Button>
                </div>

                {/* Visualization canvas */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border/50 h-[400px]">
                    {activeTab === "severity" && <canvas ref={barChartRef} className="w-full h-full" />}
                    {activeTab === "classes" && <canvas ref={pieChartRef} className="w-full h-full" />}
                    {activeTab === "timeline" && <canvas ref={lineChartRef} className="w-full h-full" />}
                    {activeTab === "confidence" && <canvas ref={confidenceChartRef} className="w-full h-full" />}

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
                        {activeTab === "confidence" && <AlertTriangle className="h-4 w-4" />}

                        {activeTab === "severity" && "Severity Distribution"}
                        {activeTab === "classes" && "Class Distribution"}
                        {activeTab === "timeline" && "Timeline Analysis"}
                        {activeTab === "confidence" && "Confidence Analysis"}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                        {activeTab === "severity" &&
                            "This chart shows the distribution of pothole severity levels across all detections. Higher severity potholes require more urgent attention."}
                        {activeTab === "classes" &&
                            "This chart shows the distribution of pothole classes detected by our AI model. Different classes represent different types of road anomalies."}
                        {activeTab === "timeline" &&
                            "This chart shows the number of pothole reports over time, helping identify trends and patterns in road deterioration."}
                        {activeTab === "confidence" &&
                            "This chart shows the confidence distribution across all detections, indicating how reliable the AI detection is."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}