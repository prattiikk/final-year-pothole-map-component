import { HeroSection } from "@/components/hero-section"
import { FeatureShowcase } from "@/components/feature-showcase"
import { MapPreview } from "@/components/map-preview"
import { DataVisualizationPreview } from "@/components/data-visualization-preview"
import { CommunitySection } from "@/components/community-section"
import { IntegratedPlatform } from "@/components/integrated-platform"
import { Footer } from "@/components/footer"
import { Layout } from "@/components/layout"

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <MapPreview />
      <FeatureShowcase />
      <IntegratedPlatform />
      <DataVisualizationPreview />
      <CommunitySection />
      <Footer />
    </Layout>
  )
}
