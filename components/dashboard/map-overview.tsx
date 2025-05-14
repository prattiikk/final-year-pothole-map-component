import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { HeatmapVisualization } from "@/components/heatmap-visualization"

interface MapOverviewProps {
  data: Array<{
    latitude: number
    longitude: number
    severity: number
  }>
  className?: string
}

export function MapOverview({ data, className }: MapOverviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pothole Heatmap</CardTitle>
            <CardDescription>Geographic distribution of potholes</CardDescription>
          </div>
          <Link href="/map">
            <Button variant="outline" size="sm">
              <MapPin className="mr-2 h-4 w-4" />
              Open Full Map
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-md border">
          <HeatmapVisualization data={data} />
        </div>
      </CardContent>
    </Card>
  )
}
