import { HeroSection } from "@/components/hero-section"
import { Navigation } from "@/components/navigation"
import { FeatureShowcase } from "@/components/feature-showcase"
import { DataVisualization } from "@/components/data-visualization"
import { CommunitySection } from "@/components/community-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        <HeroSection />
        <FeatureShowcase />
        <DataVisualization />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  )
}
