import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TimeSeriesChartProps {
  data: Array<{
    date: string
    count: number
    avgConfidence?: number
  }>
  className?: string
}

export function TimeSeriesChart({ data, className }: TimeSeriesChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Reports Over Time</CardTitle>
        <CardDescription>Number of pothole reports over time</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString()
                }}
                formatter={(value: number, name: string) => {
                  if (name === "count") return [`${value} reports`, "Reports"]
                  if (name === "avgConfidence") return [`${(value * 100).toFixed(1)}%`, "Avg Confidence"]
                  return [value, name]
                }}
              />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
              {data[0]?.avgConfidence !== undefined && (
                <Line type="monotone" dataKey="avgConfidence" stroke="#82ca9d" yAxisId="right" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
