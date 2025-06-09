import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Target, FileText } from "lucide-react"

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
  const stats = [
    {
      title: "Total Reports",
      value: totalReports.toLocaleString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "Road anomaly reports",
    },
    {
      title: "Total Detections",
      value: totalDetections.toLocaleString(),
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "Individual anomalies found",
    },
    {
      title: "Average Confidence",
      value: avgConfidence,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      description: "AI detection accuracy",
    },
    {
      title: "Critical Issues",
      value: criticalSeverity.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      description: "Require immediate attention",
    },
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>

              {/* Progress indicator for critical issues */}
              {stat.title === "Critical Issues" && totalDetections > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-red-500 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((criticalSeverity / totalDetections) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((criticalSeverity / totalDetections) * 100).toFixed(1)}% of total
                  </p>
                </div>
              )}

              {/* Progress indicator for confidence */}
              {stat.title === "Average Confidence" && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${Number.parseFloat(avgConfidence.replace("%", ""))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Detection reliability</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
