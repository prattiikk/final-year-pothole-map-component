"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useState } from "react"

interface Detection {
  id: string
  date: string
  totalDetections: number
  confidence: number
  severity: string
  status: string
  location: {
    latitude: number
    longitude: number
  }
}

interface DetectionTableProps {
  data: Detection[]
  className?: string
  onMarkAsFixed?: (id: string) => void
}

export function DetectionTable({ data, className, onMarkAsFixed }: DetectionTableProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleMarkAsFixed = async (id: string) => {
    if (onMarkAsFixed) {
      setLoadingIds((prev) => new Set(prev).add(id))
      try {
        await onMarkAsFixed(id)
      } finally {
        setLoadingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Detections</CardTitle>
        <CardDescription>All recent pothole reports in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Detections</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id.substring(0, 8)}...</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.totalDetections}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.confidence > 0.8
                            ? "border-green-500 text-green-500"
                            : item.confidence > 0.6
                              ? "border-yellow-500 text-yellow-500"
                              : "border-red-500 text-red-500"
                        }
                      >
                        {(item.confidence * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.severity === "LOW"
                            ? "border-green-500 text-green-500"
                            : item.severity === "MEDIUM"
                              ? "border-yellow-500 text-yellow-500"
                              : item.severity === "HIGH"
                                ? "border-orange-500 text-orange-500"
                                : "border-red-500 text-red-500"
                        }
                      >
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsFixed(item.id)}
                        disabled={loadingIds.has(item.id)}
                        className="flex items-center gap-1"
                      >
                        {loadingIds.has(item.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Fixed
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">No detection data available</div>
        )}
      </CardContent>
    </Card>
  )
}
