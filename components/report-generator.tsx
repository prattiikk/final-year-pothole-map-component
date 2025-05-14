"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  const generateReport = async () => {
    setIsGenerating(true)

    try {
      // Create a simple text report
      const reportText = generateTextReport(potholes, locationName, searchRadius)

      // Create a blob and download it
      const blob = new Blob([reportText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      // Create a temporary link and trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = `RoadSense_Report_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate a simple text report
  const generateTextReport = (potholes: Pothole[], locationName: string, searchRadius: number): string => {
    // Report header
    let report = "ROAD ANOMALY REPORT\n"
    report += "=================\n\n"

    // Report information
    report += `Location: ${locationName}\n`
    report += `Search Radius: ${searchRadius} km\n`
    report += `Total Potholes: ${potholes.length}\n`
    report += `Report Date: ${new Date().toLocaleDateString()}\n\n`

    // Severity summary
    const highSeverity = potholes.filter((p) => p.severity >= 7).length
    const mediumSeverity = potholes.filter((p) => p.severity >= 4 && p.severity < 7).length
    const lowSeverity = potholes.filter((p) => p.severity < 4).length

    report += "SEVERITY SUMMARY\n"
    report += "---------------\n"
    report += `High: ${highSeverity} (${((highSeverity / potholes.length) * 100 || 0).toFixed(1)}%)\n`
    report += `Medium: ${mediumSeverity} (${((mediumSeverity / potholes.length) * 100 || 0).toFixed(1)}%)\n`
    report += `Low: ${lowSeverity} (${((lowSeverity / potholes.length) * 100 || 0).toFixed(1)}%)\n\n`

    // Pothole details
    report += "POTHOLE DETAILS\n"
    report += "--------------\n"
    report += "ID\tSeverity\tLocation\tDate Reported\tReported By\n"

    potholes.forEach((pothole) => {
      report += `${pothole.id.substring(0, 8)}\t`
      report += `${getSeverityLabel(pothole.severity)}\t`
      report += `${pothole.latitude.toFixed(6)}, ${pothole.longitude.toFixed(6)}\t`
      report += `${formatDate(pothole.dateReported)}\t`
      report += `${pothole.reportedBy}\n`
    })

    return report
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
    <Button
      onClick={generateReport}
      disabled={isGenerating || potholes.length === 0}
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Download Report
        </>
      )}
    </Button>
  )
}
