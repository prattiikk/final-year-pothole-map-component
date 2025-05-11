"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { LandingPage } from "../components/landing-page"

// Dynamically import the map component to avoid SSR issues with Leaflet
const PotholeMap = dynamic(() => import("../components/map"), { ssr: false })

export default function IntegratedPage() {
  const [showMap, setShowMap] = useState(false)

  return (
    <div className="min-h-screen">
      {showMap ? <PotholeMap /> : <LandingPage onViewMapClick={() => setShowMap(true)} />}
    </div>
  )
}
