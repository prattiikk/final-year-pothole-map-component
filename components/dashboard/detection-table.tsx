import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
}

export function DetectionTable({ data, className }: DetectionTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Detections</CardTitle>
        <CardDescription>Latest pothole reports in the system</CardDescription>
      </CardHeader>
      <CardContent>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id.substring(0, 8)}...</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell>{item.totalDetections}</TableCell>
                  <TableCell>{(item.confidence * 100).toFixed(1)}%</TableCell>
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
                  <TableCell>{item.status}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
