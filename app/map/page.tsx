"use client"

import dynamic from "next/dynamic"
import { Layout } from "@/components/layout"

// Dynamically import the map component to avoid SSR issues with Leaflet
const PotholeMap = dynamic(() => import("@/components/map"), { ssr: false })

export default function MapPage() {
  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)]">
        <PotholeMap />
      </div>
    </Layout>
  )
}
