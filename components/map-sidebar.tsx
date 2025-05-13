"use client"

import type React from "react"

import { useState } from "react"
import { Layers, Filter, MapIcon, ChevronRight, ChevronLeft, AlertTriangle, Info, Flame } from "lucide-react"

interface MapLayer {
  name: string
  url: string
  attribution: string
}

interface Pothole {
  id: string
  latitude: number
  longitude: number
  severity: number
  reportedBy: string
  img: string
  dateReported: string
}

interface MapSidebarProps {
  potholes: Pothole[]
  filteredPotholes: Pothole[]
  searchRadius: number
  setSearchRadius: (radius: number) => void
  severityFilter: string
  setSeverityFilter: (filter: string) => void
  dateFilter: string
  setDateFilter: (filter: string) => void
  onLayerChange: (layer: MapLayer) => void
  stats: {
    totalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    averageSeverity: number
    byDate: {
      today: number
      yesterday: number
      lastWeek: number
      lastMonth: number
      older: number
    }
  }
  showHeatmap: boolean
  setShowHeatmap: (show: boolean) => void
}

export function MapSidebar({
  potholes,
  filteredPotholes,
  searchRadius,
  setSearchRadius,
  severityFilter,
  setSeverityFilter,
  dateFilter,
  setDateFilter,
  onLayerChange,
  stats,
  showHeatmap,
  setShowHeatmap,
}: MapSidebarProps) {
  const [activeTab, setActiveTab] = useState<"filters" | "layers" | "analytics">("filters")
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280) // Default width

  const mapLayers: Record<string, MapLayer> = {
    dark: {
      name: "Dark",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    light: {
      name: "Light",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    satellite: {
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
    terrain: {
      name: "Terrain",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution:
        "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    },
    streets: {
      name: "Streets",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  }

  const handleLayerSelect = (layerId: string) => {
    onLayerChange(mapLayers[layerId])
  }

  // Get severity color
  const getSeverityColor = (severity?: number) => {
    if (severity === undefined) return "#276EF1" // Uber blue (default)

    if (severity >= 7) return "#FF424F" // High - Uber red
    if (severity >= 4) return "#FF9E0D" // Medium - Orange
    return "#FFCD1C" // Low - Yellow
  }

  // Get heatmap data
  const getHeatmapData = () => {
    return potholes.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      severity: item.severity >= 7 ? 8 : item.severity >= 4 ? 5 : 2,
    }))
  }

  // Add a resize handler for the sidebar
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    const startX = e.clientX
    const startWidth = sidebarWidth

    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX
      // Set min and max width constraints
      if (newWidth > 200 && newWidth < 500) {
        setSidebarWidth(newWidth)
      }
    }

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag)
      document.removeEventListener("mouseup", stopDrag)
    }

    document.addEventListener("mousemove", doDrag)
    document.addEventListener("mouseup", stopDrag)
  }

  return (
    <div className="absolute top-0 left-0 bottom-0 z-10">
      <div className={`h-full flex transition-all duration-300 ${collapsed ? "translate-x-[-100%]" : "translate-x-0"}`}>
        {/* Main sidebar */}
        <div
          className="bg-black bg-opacity-90 border-r border-gray-800 flex flex-col h-full overflow-hidden"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold flex items-center">
              <MapIcon className="mr-2 h-5 w-5" />
              Map Controls
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              className={`flex-1 py-2 px-3 text-sm flex justify-center items-center ${
                activeTab === "filters" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("filters")}
            >
              <Filter size={16} className="mr-1" />
              Filters
            </button>
            <button
              className={`flex-1 py-2 px-3 text-sm flex justify-center items-center ${
                activeTab === "layers" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("layers")}
            >
              <Layers size={16} className="mr-1" />
              Layers
            </button>
            <button
              className={`flex-1 py-2 px-3 text-sm flex justify-center items-center ${
                activeTab === "analytics" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              <AlertTriangle size={16} className="mr-1" />
              Stats
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Filters Tab */}
            {activeTab === "filters" && (
              <div className="space-y-6">
                {/* Heatmap toggle */}
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Flame size={18} className="mr-2 text-orange-500" />
                      <span className="font-medium">Heatmap Overlay</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showHeatmap}
                        onChange={() => setShowHeatmap(!showHeatmap)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Toggle to show heatmap overlay on the map</p>
                </div>

                {/* Search radius slider */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Search Radius: {searchRadius} km</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span>10km</span>
                    <span>20km</span>
                  </div>
                </div>

                {/* Severity filter */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Severity Level</label>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      className={`text-sm py-1 px-2 rounded ${severityFilter === "all" ? "bg-blue-600" : "bg-gray-700"}`}
                      onClick={() => setSeverityFilter("all")}
                    >
                      All
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${severityFilter === "high" ? "bg-red-600" : "bg-gray-700"}`}
                      onClick={() => setSeverityFilter("high")}
                    >
                      High
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${severityFilter === "medium" ? "bg-orange-500" : "bg-gray-700"}`}
                      onClick={() => setSeverityFilter("medium")}
                    >
                      Medium
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${
                        severityFilter === "low" ? "bg-yellow-500 text-black" : "bg-gray-700"
                      }`}
                      onClick={() => setSeverityFilter("low")}
                    >
                      Low
                    </button>
                  </div>
                </div>

                {/* Date filter */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Reported Date</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`text-sm py-1 px-2 rounded ${dateFilter === "all" ? "bg-blue-600" : "bg-gray-700"}`}
                      onClick={() => setDateFilter("all")}
                    >
                      All Time
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${dateFilter === "today" ? "bg-blue-600" : "bg-gray-700"}`}
                      onClick={() => setDateFilter("today")}
                    >
                      Today
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${dateFilter === "week" ? "bg-blue-600" : "bg-gray-700"}`}
                      onClick={() => setDateFilter("week")}
                    >
                      This Week
                    </button>
                    <button
                      className={`text-sm py-1 px-2 rounded ${dateFilter === "month" ? "bg-blue-600" : "bg-gray-700"}`}
                      onClick={() => setDateFilter("month")}
                    >
                      This Month
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Legend</label>
                  <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getSeverityColor(8) }}></div>
                      <span className="text-sm">High Severity</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getSeverityColor(5) }}></div>
                      <span className="text-sm">Medium Severity</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getSeverityColor(2) }}></div>
                      <span className="text-sm">Low Severity</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 flex items-center justify-center mr-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm">Your Location</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layers Tab */}
            {activeTab === "layers" && (
              <div className="space-y-4">
                <label className="text-sm text-gray-400 block mb-2">Map Style</label>
                <div className="space-y-2">
                  {Object.entries(mapLayers).map(([id, layer]) => (
                    <button
                      key={id}
                      className="w-full px-3 py-2 rounded flex items-center bg-gray-800 hover:bg-gray-700"
                      onClick={() => handleLayerSelect(id)}
                    >
                      <div className="w-4 h-4 mr-2 rounded border border-gray-600 overflow-hidden">
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor:
                              id === "dark"
                                ? "#242424"
                                : id === "light"
                                  ? "#f5f5f5"
                                  : id === "satellite"
                                    ? "#143d6b"
                                    : id === "terrain"
                                      ? "#c6ddaa"
                                      : "#e8e8e8",
                          }}
                        ></div>
                      </div>
                      <span className="text-sm">{layer.name}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Info size={16} className="text-blue-400 mr-2" />
                    <span className="text-sm font-medium">Map Attribution</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Map data provided by OpenStreetMap contributors and various tile providers including CARTO, Stamen
                    Design, and Esri.
                  </p>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h3 className="text-gray-400 text-xs mb-1">Total Potholes</h3>
                    <p className="text-2xl font-bold">{stats.totalCount}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h3 className="text-gray-400 text-xs mb-1">Avg. Severity</h3>
                    <p className="text-2xl font-bold">{stats.averageSeverity}</p>
                  </div>
                </div>

                {/* Severity distribution */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3">Severity Distribution</h3>
                  <div className="relative pt-1">
                    <div className="flex h-4 mb-4 overflow-hidden text-xs rounded-lg">
                      <div
                        style={{ width: `${stats.totalCount ? (stats.highCount / stats.totalCount) * 100 : 0}%` }}
                        className="bg-red-600 flex flex-col text-center whitespace-nowrap justify-center"
                      ></div>
                      <div
                        style={{ width: `${stats.totalCount ? (stats.mediumCount / stats.totalCount) * 100 : 0}%` }}
                        className="bg-orange-500 flex flex-col text-center whitespace-nowrap justify-center"
                      ></div>
                      <div
                        style={{ width: `${stats.totalCount ? (stats.lowCount / stats.totalCount) * 100 : 0}%` }}
                        className="bg-yellow-500 flex flex-col text-center whitespace-nowrap justify-center"
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-600 mr-1 rounded-sm"></div>
                        <span>High: {stats.highCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 mr-1 rounded-sm"></div>
                        <span>Medium: {stats.mediumCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 mr-1 rounded-sm"></div>
                        <span>Low: {stats.lowCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date distribution */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3">Reports Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-24 text-xs">Today</div>
                      <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${stats.totalCount ? (stats.byDate.today / stats.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-xs ml-2">{stats.byDate.today}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-xs">Yesterday</div>
                      <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${stats.totalCount ? (stats.byDate.yesterday / stats.totalCount) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-xs ml-2">{stats.byDate.yesterday}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-xs">Last Week</div>
                      <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${stats.totalCount ? (stats.byDate.lastWeek / stats.totalCount) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-xs ml-2">{stats.byDate.lastWeek}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-xs">Last Month</div>
                      <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${stats.totalCount ? (stats.byDate.lastMonth / stats.totalCount) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-xs ml-2">{stats.byDate.lastMonth}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 text-xs">Older</div>
                      <div className="flex-1 h-4 bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${stats.totalCount ? (stats.byDate.older / stats.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-xs ml-2">{stats.byDate.older}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Showing {filteredPotholes.length} of {potholes.length} potholes
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="w-1 cursor-ew-resize bg-gray-700 hover:bg-blue-500 transition-colors"
          onMouseDown={startResize}
        ></div>

        {/* Toggle button */}
        <button
          className="h-10 w-6 bg-black bg-opacity-90 border-r border-t border-b border-gray-800 flex items-center justify-center rounded-r-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  )
}
