import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, MapPin, AlertTriangle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  totalReports: number
  totalDetections: number
  avgConfidence: string
  criticalSeverity: number
  className?: string
}

export function DashboardStats({
  totalReports,
  totalDetections,
  avgConfidence,
  criticalSeverity,
  className,
}: DashboardStatsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalReports}</div>
          <p className="text-xs text-muted-foreground">Submitted pothole reports</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDetections}</div>
          <p className="text-xs text-muted-foreground">Individual potholes detected</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgConfidence}</div>
          <p className="text-xs text-muted-foreground">Detection confidence level</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Severity</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{criticalSeverity}</div>
          <p className="text-xs text-muted-foreground">High priority potholes</p>
        </CardContent>
      </Card>
    </div>
  )
}
