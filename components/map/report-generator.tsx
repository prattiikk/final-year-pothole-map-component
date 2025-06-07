"use client"

import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define interfaces based on your API structure
interface Detection {
  id: string
  bbox: number[]
  center: number[]
  confidence: number
  class: string
  severity: string
  relativePosition?: number[]
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

interface ReportGeneratorProps {
  detectionData: DetectionData[]
  locationName: string
  searchRadius: number
  filters?: {
    severity?: string
    status?: string
    days?: number
  }
}

export function ReportGenerator({ 
  detectionData, 
  locationName, 
  searchRadius,
  filters = {} 
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateAnalytics = () => {
    if (!detectionData || detectionData.length === 0) {
      return {
        totalReports: 0,
        totalAnomalies: 0,
        avgConfidence: 0,
        severityBreakdown: {},
        statusBreakdown: {},
        anomalyTypes: {},
        timeAnalysis: {},
        locationHotspots: [],
        riskAssessment: 'LOW',
        recommendations: []
      }
    }

    // Basic statistics
    const totalReports = detectionData.length
    const totalAnomalies = detectionData.reduce((sum, data) => sum + (data.detection?.totalDetections || 0), 0)
    const avgConfidence = detectionData.reduce((sum, data) => sum + (data.detection?.averageConfidence || 0), 0) / totalReports

    // Severity breakdown
    const severityBreakdown = detectionData.reduce((acc, data) => {
      const severity = data.detection?.highestSeverity || 'UNKNOWN'
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Status breakdown
    const statusBreakdown = detectionData.reduce((acc, data) => {
      const status = data.detection?.status || 'UNKNOWN'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Anomaly types from individual detections
    const anomalyTypes = detectionData.reduce((acc, data) => {
      data.detection?.details?.forEach(detection => {
        const type = detection.class || 'UNKNOWN'
        acc[type] = (acc[type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    // Time analysis - group by date
    const timeAnalysis = detectionData.reduce((acc, data) => {
      const date = new Date(data.metadata.createdAt).toDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Location hotspots - group by approximate coordinates
    const locationHotspots = detectionData.reduce((acc, data) => {
      const lat = Math.round(data.location.latitude * 1000) / 1000
      const lng = Math.round(data.location.longitude * 1000) / 1000
      const key = `${lat},${lng}`
      
      if (!acc[key]) {
        acc[key] = { lat, lng, count: 0, severities: {} as Record<string, number> }
      }
      acc[key].count += 1
      
      const severity = data.detection?.highestSeverity || 'UNKNOWN'
      acc[key].severities[severity] = (acc[key].severities[severity] || 0) + 1
      
      return acc
    }, {} as Record<string, any>)

    // Convert to array and sort by count
    const hotspotArray = Object.values(locationHotspots)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    // Risk assessment
    const highSeverityCount = severityBreakdown.HIGH || 0
    const mediumSeverityCount = severityBreakdown.MEDIUM || 0
    const riskAssessment = highSeverityCount > totalReports * 0.3 ? 'HIGH' :
                          (highSeverityCount + mediumSeverityCount) > totalReports * 0.5 ? 'MEDIUM' : 'LOW'

    // Generate recommendations
    const recommendations = []
    if (highSeverityCount > 0) {
      recommendations.push(`Immediate attention required for ${highSeverityCount} high-severity anomalies`)
    }
    if (avgConfidence < 70) {
      recommendations.push('Detection confidence is below optimal threshold - consider manual verification')
    }
    if (hotspotArray.length > 0) {
      recommendations.push(`Focus maintenance efforts on hotspot areas with ${hotspotArray[0].count}+ reported issues`)
    }
    if (totalAnomalies > totalReports * 2) {
      recommendations.push('High anomaly density detected - comprehensive road inspection recommended')
    }

    return {
      totalReports,
      totalAnomalies,
      avgConfidence,
      severityBreakdown,
      statusBreakdown,
      anomalyTypes,
      timeAnalysis,
      locationHotspots: hotspotArray,
      riskAssessment,
      recommendations
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)

    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      const analytics = generateAnalytics()

      // Page setup
      const pageWidth = 210
      const margin = 20
      const contentWidth = pageWidth - 2 * margin
      let yPos = 20

      // Header
      pdf.setFillColor(220, 38, 38) // red-600
      pdf.rect(0, 0, pageWidth, 35, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.text('ROAD ANOMALY DETECTION REPORT', pageWidth / 2, 15, { align: 'center' })
      pdf.setFontSize(12)
      pdf.text('Comprehensive Analysis & Risk Assessment', pageWidth / 2, 25, { align: 'center' })

      yPos = 50

      // Report metadata
      pdf.setTextColor(55, 65, 81)
      pdf.setFontSize(11)
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      pdf.text(`Location: ${locationName}`, margin, yPos)
      pdf.text(`Search Radius: ${searchRadius} km`, margin, yPos + 6)
      pdf.text(`Report Generated: ${reportDate}`, margin, yPos + 12)
      pdf.text(`Analysis Period: ${filters.days || 30} days`, margin, yPos + 18)
      
      yPos += 35

      // Executive Summary
      pdf.setFillColor(239, 246, 255) // blue-50
      pdf.rect(margin - 5, yPos - 5, contentWidth + 10, 25, 'F')
      
      pdf.setFontSize(16)
      pdf.setTextColor(30, 58, 138) // blue-800
      pdf.text('EXECUTIVE SUMMARY', margin, yPos + 5)
      
      pdf.setFontSize(11)
      pdf.setTextColor(55, 65, 81)
      pdf.text(`Risk Level: ${analytics.riskAssessment}`, margin + 120, yPos + 5)
      pdf.text(`Detection Reports: ${analytics.totalReports}`, margin, yPos + 12)
      pdf.text(`Total Anomalies: ${analytics.totalAnomalies}`, margin + 60, yPos + 12)
      pdf.text(`Avg Confidence: ${analytics.avgConfidence.toFixed(1)}%`, margin + 120, yPos + 12)

      yPos += 35

      // Severity Analysis
      pdf.setFontSize(14)
      pdf.setTextColor(31, 41, 55)
      pdf.text('SEVERITY ANALYSIS', margin, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(75, 85, 99)
      Object.entries(analytics.severityBreakdown).forEach(([severity, count], index) => {
        const percentage = ((count / analytics.totalReports) * 100).toFixed(1)
        pdf.text(`• ${severity}: ${count} reports (${percentage}%)`, margin + 5, yPos + (index * 6))
      })
      yPos += Object.keys(analytics.severityBreakdown).length * 6 + 15

      // Anomaly Types
      pdf.setFontSize(14)
      pdf.setTextColor(31, 41, 55)
      pdf.text('ANOMALY CLASSIFICATION', margin, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(75, 85, 99)
      const sortedAnomalies = Object.entries(analytics.anomalyTypes)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8)

      sortedAnomalies.forEach(([type, count], index) => {
        const percentage = ((count / analytics.totalAnomalies) * 100).toFixed(1)
        pdf.text(`• ${type}: ${count} detections (${percentage}%)`, margin + 5, yPos + (index * 6))
      })
      yPos += sortedAnomalies.length * 6 + 15

      // Location Hotspots
      if (analytics.locationHotspots.length > 0) {
        pdf.setFontSize(14)
        pdf.setTextColor(31, 41, 55)
        pdf.text('HIGH-RISK LOCATIONS', margin, yPos)
        yPos += 10

        pdf.setFontSize(10)
        pdf.setTextColor(75, 85, 99)
        analytics.locationHotspots.slice(0, 5).forEach((hotspot: any, index) => {
          const severityInfo = Object.entries(hotspot.severities)
            .map(([sev, cnt]) => `${sev}: ${cnt}`)
            .join(', ')
          pdf.text(`${index + 1}. Lat: ${hotspot.lat}, Lng: ${hotspot.lng}`, margin + 5, yPos)
          pdf.text(`   ${hotspot.count} reports [${severityInfo}]`, margin + 10, yPos + 4)
          yPos += 12
        })
        yPos += 10
      }

      // Recommendations
      if (analytics.recommendations.length > 0) {
        pdf.setFillColor(254, 243, 199) // yellow-100
        pdf.rect(margin - 5, yPos - 5, contentWidth + 10, 8 + analytics.recommendations.length * 8, 'F')
        
        pdf.setFontSize(14)
        pdf.setTextColor(146, 64, 14) // yellow-800
        pdf.text('RECOMMENDATIONS', margin, yPos + 5)
        yPos += 15

        pdf.setFontSize(10)
        pdf.setTextColor(92, 25, 2) // yellow-900
        analytics.recommendations.forEach((rec, index) => {
          const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, contentWidth - 10)
          pdf.text(lines, margin + 5, yPos)
          yPos += lines.length * 5 + 3
        })
        yPos += 10
      }

      // New page for detailed findings
      pdf.addPage()
      yPos = 20
      
      pdf.setFontSize(18)
      pdf.setTextColor(31, 41, 55)
      pdf.text('DETAILED DETECTION REPORTS', margin, yPos)
      yPos += 15

      // Sort detections by severity and confidence
      const sortedDetections = [...detectionData]
        .sort((a, b) => {
          const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 }
          const aSeverity = severityOrder[a.detection?.highestSeverity as keyof typeof severityOrder] || 0
          const bSeverity = severityOrder[b.detection?.highestSeverity as keyof typeof severityOrder] || 0
          
          if (aSeverity !== bSeverity) return bSeverity - aSeverity
          return (b.detection?.averageConfidence || 0) - (a.detection?.averageConfidence || 0)
        })

      sortedDetections.slice(0, 20).forEach((data, index) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }

        // Detection header with severity color coding
        const severityColors = {
          HIGH: [239, 68, 68],    // red-500
          MEDIUM: [249, 115, 22], // orange-500
          LOW: [34, 197, 94],     // green-500
          UNKNOWN: [107, 114, 128] // gray-500
        }
        
        const severity = data.detection?.highestSeverity || 'UNKNOWN'
        const [r, g, b] = severityColors[severity as keyof typeof severityColors] || [107, 114, 128]
        
        pdf.setFillColor(r, g, b)
        pdf.rect(margin - 2, yPos - 3, 4, 15, 'F')
        
        pdf.setFillColor(248, 250, 252)
        pdf.rect(margin + 5, yPos - 3, contentWidth - 5, 15, 'F')
        
        pdf.setFontSize(12)
        pdf.setTextColor(31, 41, 55)
        pdf.text(`Report #${index + 1} - ${severity} Severity`, margin + 8, yPos + 5)
        
        const confidence = data.detection?.averageConfidence || 0
        pdf.text(`Confidence: ${confidence.toFixed(1)}%`, margin + 120, yPos + 5)

        yPos += 18

        // Detection details
        pdf.setFontSize(9)
        pdf.setTextColor(75, 85, 99)
        
        const createdDate = new Date(data.metadata?.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        
        pdf.text(`Location: ${data.location?.latitude?.toFixed(6)}, ${data.location?.longitude?.toFixed(6)}`, margin + 8, yPos)
        pdf.text(`Reported: ${createdDate}`, margin + 8, yPos + 5)
        pdf.text(`Reporter: ${data.metadata?.username || 'Anonymous'}`, margin + 8, yPos + 10)
        pdf.text(`Total Anomalies: ${data.detection?.totalDetections || 0}`, margin + 100, yPos)
        pdf.text(`Processing: ${data.detection?.processingTimeMs || 0}ms`, margin + 100, yPos + 5)
        pdf.text(`Status: ${data.detection?.status || 'Unknown'}`, margin + 100, yPos + 10)

        yPos += 18

        // Individual anomaly details
        if (data.detection?.details && data.detection.details.length > 0) {
          pdf.setFontSize(8)
          pdf.setTextColor(107, 114, 128)
          pdf.text('Detected Anomalies:', margin + 8, yPos)
          yPos += 5

          data.detection.details.slice(0, 3).forEach((detection, detIndex) => {
            pdf.text(`  ${detIndex + 1}. ${detection.class} (${detection.confidence.toFixed(1)}% confidence, ${detection.severity} severity)`, margin + 12, yPos)
            yPos += 4
          })

          if (data.detection.details.length > 3) {
            pdf.text(`  ... and ${data.detection.details.length - 3} more`, margin + 12, yPos)
            yPos += 4
          }
        }

        // Notes if available
        if (data.metadata?.notes) {
          pdf.setFontSize(8)
          pdf.setTextColor(75, 85, 99)
          const noteLines = pdf.splitTextToSize(`Notes: ${data.metadata.notes}`, contentWidth - 20)
          pdf.text(noteLines, margin + 8, yPos + 3)
          yPos += noteLines.length * 4
        }

        yPos += 15
      })

      if (detectionData.length > 20) {
        pdf.setFontSize(10)
        pdf.setTextColor(107, 114, 128)
        pdf.text(`Note: Showing top 20 of ${detectionData.length} total detection reports`, margin, yPos + 10)
      }

      // Footer with metadata
      const totalPages = pdf.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(107, 114, 128)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 290, { align: 'right' })
        pdf.text(`Generated by Road Anomaly Detection System`, margin, 290)
      }

      // Save the PDF
      const fileName = `RoadAnomalyReport_${locationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const analytics = generateAnalytics()

  return (
    <div className="space-y-4">
      {/* Report Preview Stats
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.totalReports}</div>
          <div className="text-sm text-gray-600">Reports</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.totalAnomalies}</div>
          <div className="text-sm text-gray-600">Anomalies</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.avgConfidence.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            analytics.riskAssessment === 'HIGH' ? 'text-red-600' :
            analytics.riskAssessment === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
          }`}>
            {analytics.riskAssessment}
          </div>
          <div className="text-sm text-gray-600">Risk Level</div>
        </div>
      </div> */}

      {/* Download button */}
      <Button
        onClick={generateReport}
        disabled={isGenerating || !detectionData || detectionData.length === 0}
        className="flex items-center gap-2 w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Comprehensive Report...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            Download Report ({detectionData?.length || 0} detections)
          </>
        )}
      </Button>
    </div>
  )
}