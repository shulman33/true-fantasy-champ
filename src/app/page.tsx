import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function Home() {
  return (
    <MainLayout>
      <ScoreboardHeader
        title="TRUE CHAMPION"
        subtitle="Fantasy Football's Ultimate Truth Detector"
        lastUpdated="Live Data"
        seasonYear={2025}
      />

      <DashboardClient />
    </MainLayout>
  );
}
