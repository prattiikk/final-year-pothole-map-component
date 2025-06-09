import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface SeverityChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  className?: string
}

const SEVERITY_COLORS = {
  LOW: "#10B981", // Emerald
  MEDIUM: "#F59E0B", // Amber
  HIGH: "#EF4444", // Red
  CRITICAL: "#DC2626", // Dark Red
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{`${data.name}: ${data.value}`}</p>
        <p className="text-sm text-muted-foreground">
          {`${((data.value / payload[0].payload.total) * 100).toFixed(1)}% of total`}
        </p>
      </div>
    )
  }
  return null
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null // Don't show labels for slices smaller than 5%

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function SeverityChart({ data, className }: SeverityChartProps) {
  // Filter out zero values and add total for tooltip
  const filteredData = data.filter((item) => item.value > 0)
  const total = filteredData.reduce((sum, item) => sum + item.value, 0)
  const dataWithTotal = filteredData.map((item) => ({ ...item, total }))

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Severity Distribution</CardTitle>
          <CardDescription>No severity data available with confidence &gt; 50%.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📊</span>
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
        <CardTitle className="text-lg font-semibold">Severity Distribution</CardTitle>
        <CardDescription>Distribution of pothole severity levels (confidence > 50%)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }} className="text-sm font-medium">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats below chart */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-sm text-muted-foreground">Total Detections</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {filteredData.find((item) => item.name === "CRITICAL")?.value || 0}
            </p>
            <p className="text-sm text-muted-foreground">Critical Issues</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
