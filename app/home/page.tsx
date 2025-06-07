"use client"
import { HeroSection } from "@/components/home/hero-section"
import { FeatureShowcase } from "@/components/home/feature-showcase"
// import { MapPreview } from "@/components/home/map-preview"
const MapPreview = dynamic(() => import("@/components/home/map-preview"), { ssr: false })
import { DataVisualizationPreview } from "@/components/home/data-visualization-preview"
import { Footer } from "@/components/home/footer"
import { Layout } from "@/components/home/layout"
import { CallToAction } from "@/components/home/call-to-action"
import { HowItWorks } from "@/components/home/how-it-works"
import dynamic from "next/dynamic"


export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <MapPreview />
      <FeatureShowcase />
      <HowItWorks />
      <DataVisualizationPreview />
      <CallToAction />
      <Footer />
    </Layout>
  )
}
