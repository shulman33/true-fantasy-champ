import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { TeamPageClient } from "@/components/team/team-page-client";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <MainLayout>
      <ScoreboardHeader
        title="TEAM PROFILE"
        subtitle="Detailed Performance Analysis"
        lastUpdated="Live Data"
        seasonYear={2025}
      />

      <TeamPageClient teamId={teamId} />
    </MainLayout>
  );
}
