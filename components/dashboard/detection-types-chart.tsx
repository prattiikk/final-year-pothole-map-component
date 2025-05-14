import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DetectionTypesChartProps {
  data: Array<{
    name: string
    count: number
  }>
  className?: string
}

export function DetectionTypesChart({ data, className }: DetectionTypesChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Detection Types</CardTitle>
        <CardDescription>Types of road anomalies detected</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value: number) => [`${value} detections`, "Count"]} />
              <Bar dataKey="count" fill="#0088FE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
