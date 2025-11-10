import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { WeekPageClient } from "@/components/week/week-page-client";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const weekNumber = parseInt(week, 10);

  // Validate week number (1-18 for NFL fantasy season)
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 18) {
    return (
      <MainLayout>
        <ScoreboardHeader
          title="INVALID WEEK"
          subtitle="Week Not Found"
          lastUpdated="N/A"
          seasonYear={2025}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="retro-card bg-background/95 p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">ERROR</h2>
            <p className="text-foreground/80">
              Week {week} is not valid. Please select a week between 1 and 18.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScoreboardHeader
        title={`WEEK ${weekNumber} ANALYSIS`}
        subtitle="Hypothetical Matchups & Stats"
        lastUpdated="Live Data"
        seasonYear={2025}
      />

      <WeekPageClient week={weekNumber} />
    </MainLayout>
  );
}
