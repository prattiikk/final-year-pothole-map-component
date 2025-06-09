import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ConfidenceChartProps {
  data: Array<{
    range: string
    count: number
  }>
  className?: string
}

const getBarColor = (range: string) => {
  const percentage = Number.parseInt(range.split("-")[0])
  if (percentage >= 90) return "#10B981" // High confidence - Green
  if (percentage >= 80) return "#3B82F6" // Good confidence - Blue
  if (percentage >= 70) return "#F59E0B" // Medium confidence - Amber
  if (percentage >= 60) return "#EF4444" // Low confidence - Red
  return "#6B7280" // Very low confidence - Gray
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{`Confidence: ${label}`}</p>
        <p className="text-sm text-muted-foreground">{`${payload[0].value} detections`}</p>
      </div>
    )
  }
  return null
}

export function ConfidenceChart({ data, className }: ConfidenceChartProps) {
  // Filter out zero values
  const filteredData = data.filter((item) => item.count > 0)

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Confidence Distribution</CardTitle>
          <CardDescription>No confidence data available above 50% threshold.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-muted-foreground">No data to display</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Confidence Distribution</CardTitle>
        <CardDescription>Distribution of detection confidence levels (above 50%)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="range"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {filteredData
                .filter((item) => Number.parseInt(item.range.split("-")[0]) >= 90)
                .reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">High Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {filteredData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Detections</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {Math.round(
                filteredData.reduce((sum, item, index) => {
                  const midPoint =
                    (Number.parseInt(item.range.split("-")[0]) + Number.parseInt(item.range.split("-")[1])) / 2
                  return sum + midPoint * item.count
                }, 0) / filteredData.reduce((sum, item) => sum + item.count, 0),
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
