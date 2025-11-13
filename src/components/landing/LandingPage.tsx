import { HeroSection } from "./HeroSection";
import { FeaturesGrid } from "./FeaturesGrid";
import { HowItWorksSection } from "./HowItWorksSection";
import { DemoPreview } from "./DemoPreview";
import { BottomCTA } from "./BottomCTA";

/**
 * Main landing page component
 * Orchestrates all landing page sections in mobile-first design
 */
export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Above the fold */}
      <HeroSection />

      {/* Features Grid - Core value props */}
      <FeaturesGrid />

      {/* How It Works - Process explanation */}
      <HowItWorksSection />

      {/* Demo Preview - Social proof / interactive preview */}
      <DemoPreview />

      {/* Bottom CTA - Final conversion push */}
      <BottomCTA />
    </div>
  );
}
