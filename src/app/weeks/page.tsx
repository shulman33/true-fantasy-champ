import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { WeeksPageClient } from "@/components/weeks/weeks-page-client";

export default function WeeksPage() {
  return (
    <MainLayout>
      <ScoreboardHeader
        title="WEEKLY ANALYSIS"
        subtitle="View Performance by Week"
        lastUpdated="Live Data"
        seasonYear={2025}
      />

      <WeeksPageClient />
    </MainLayout>
  );
}
