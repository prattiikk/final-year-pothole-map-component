"use client"

import { useState } from "react"
import { Layers } from "lucide-react"

interface MapLayer {
  name: string
  url: string
  attribution: string
}

interface MapLayerSelectorProps {
  onLayerChange: (layer: MapLayer) => void
}

export function MapLayerSelector({ onLayerChange }: MapLayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<string>("dark")

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
      url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
      attribution:
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    streets: {
      name: "Streets",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  }

  const handleLayerSelect = (layerId: string) => {
    setSelectedLayer(layerId)
    onLayerChange(mapLayers[layerId])
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button className="bg-black bg-opacity-70 p-2 rounded-lg flex items-center" onClick={() => setIsOpen(!isOpen)}>
        <Layers size={20} className="mr-2" />
        <span className="text-sm">{mapLayers[selectedLayer].name}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-black bg-opacity-90 rounded-lg shadow-lg p-2 min-w-[150px]">
          {Object.entries(mapLayers).map(([id, layer]) => (
            <div
              key={id}
              className={`px-3 py-2 rounded cursor-pointer flex items-center ${
                selectedLayer === id ? "bg-gray-700" : "hover:bg-gray-800"
              }`}
              onClick={() => handleLayerSelect(id)}
            >
              <div
                className={`w-3 h-3 rounded-full mr-2 ${selectedLayer === id ? "bg-blue-500" : "bg-gray-500"}`}
              ></div>
              {layer.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
