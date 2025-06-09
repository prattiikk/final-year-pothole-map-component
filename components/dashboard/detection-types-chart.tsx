import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DetectionTypesChartProps {
  data: Array<{
    name: string
    count: number
  }>
  className?: string
}

const CHART_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{`${payload[0].value} detections`}</p>
      </div>
    )
  }
  return null
}

export function DetectionTypesChart({ data, className }: DetectionTypesChartProps) {
  // Filter out zero values and limit to top 8 for better visualization
  const filteredData = data.filter((item) => item.count > 0).slice(0, 8)

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Detection Types</CardTitle>
          <CardDescription>No detection type data available with confidence &gt; 50%.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📈</span>
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
        <CardTitle className="text-lg font-semibold">Detection Types</CardTitle>
        <CardDescription>Types of road anomalies detected (confidence &gt; 50%)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{filteredData.length}</p>
            <p className="text-xs text-muted-foreground">Types Found</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {filteredData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Count</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{filteredData[0]?.name || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Most Common</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
