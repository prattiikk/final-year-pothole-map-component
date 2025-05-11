"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { debounce } from "lodash"

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface AutoSuggestSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void
  placeholder?: string
  className?: string
}

export function AutoSuggestSearch({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = "",
}: AutoSuggestSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        )
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error("Error searching for locations:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500),
  ).current

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim()) {
      setIsLoading(true)
      setIsOpen(true)
      debouncedSearch(value)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    const lat = Number.parseFloat(result.lat)
    const lng = Number.parseFloat(result.lon)

    setQuery(result.display_name)
    setIsOpen(false)
    onLocationSelect(lat, lng, result.display_name)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="bg-gray-900 text-white border border-gray-700 rounded-lg py-2 px-4 pr-10 w-full focus:outline-none focus:border-blue-500"
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.place_id}
              className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm"
              onClick={() => handleResultClick(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
