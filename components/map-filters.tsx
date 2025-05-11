"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"

interface FilterOptions {
  severity: {
    low: boolean
    medium: boolean
    high: boolean
  }
  timeRange: string // 'all', 'today', 'week', 'month'
}

interface MapFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
}

export function MapFilters({ onFilterChange }: MapFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    severity: {
      low: true,
      medium: true,
      high: true,
    },
    timeRange: "all",
  })

  const handleSeverityChange = (level: "low" | "medium" | "high") => {
    const newFilters = {
      ...filters,
      severity: {
        ...filters.severity,
        [level]: !filters.severity[level],
      },
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTimeRangeChange = (range: string) => {
    const newFilters = {
      ...filters,
      timeRange: range,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="relative">
      <button className="bg-black bg-opacity-70 p-2 rounded-lg flex items-center" onClick={() => setIsOpen(!isOpen)}>
        <Filter size={20} className="mr-2" />
        <span className="text-sm">Filters</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-black bg-opacity-90 rounded-lg shadow-lg p-4 min-w-[250px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filter Options</h3>
            <button className="p-1 rounded-full hover:bg-gray-800" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-2">Severity</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.severity.low}
                  onChange={() => handleSeverityChange("low")}
                  className="mr-2"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                Low
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.severity.medium}
                  onChange={() => handleSeverityChange("medium")}
                  className="mr-2"
                />
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                Medium
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.severity.high}
                  onChange={() => handleSeverityChange("high")}
                  className="mr-2"
                />
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                High
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-400 mb-2">Time Range</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeRange"
                  value="all"
                  checked={filters.timeRange === "all"}
                  onChange={() => handleTimeRangeChange("all")}
                  className="mr-2"
                />
                All Time
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeRange"
                  value="today"
                  checked={filters.timeRange === "today"}
                  onChange={() => handleTimeRangeChange("today")}
                  className="mr-2"
                />
                Today
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeRange"
                  value="week"
                  checked={filters.timeRange === "week"}
                  onChange={() => handleTimeRangeChange("week")}
                  className="mr-2"
                />
                Past Week
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeRange"
                  value="month"
                  checked={filters.timeRange === "month"}
                  onChange={() => handleTimeRangeChange("month")}
                  className="mr-2"
                />
                Past Month
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
