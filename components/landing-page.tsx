"use client"

import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeatureShowcase } from "@/components/feature-showcase"
import { MapPreview } from "../components/map-preview"
import { DataVisualizationPreview } from "@/components/data-visualization-preview"
import { CommunitySection } from "@/components/community-section"
import { Footer } from "@/components/footer"

interface LandingPageProps {
  onViewMapClick: () => void
}

export function LandingPage({ onViewMapClick }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onViewMapClick={onViewMapClick} />
      <main className="flex-grow">
        <HeroSection  />
        <MapPreview />
        <FeatureShowcase />
        <DataVisualizationPreview />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  )
}
