import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ConfidenceChartProps {
  data: Array<{
    range: string
    count: number
  }>
  className?: string
}

export function ConfidenceChart({ data, className }: ConfidenceChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Confidence Distribution</CardTitle>
        <CardDescription>Distribution of detection confidence levels</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} detections`, "Count"]} />
              <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
