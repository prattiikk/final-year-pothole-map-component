import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart2, Map, List } from "lucide-react"

interface DashboardTabsProps {
    children: React.ReactNode
    defaultValue?: string
    className?: string
}

export function DashboardTabs({ children, defaultValue = "overview", className }: DashboardTabsProps) {
    return (
        <Tabs defaultValue={defaultValue} className={className}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
            </TabsList>
            {children}
        </Tabs>
    )
}
