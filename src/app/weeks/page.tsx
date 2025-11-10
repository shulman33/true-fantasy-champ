import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function WeeksPage() {
  const totalWeeks = 18;
  const currentWeek = new Date().getMonth() >= 8 ? Math.min(Math.floor((new Date().getDate() - 1) / 7) + 1, 18) : 1; // Simple estimate

  return (
    <MainLayout>
      <ScoreboardHeader
        title="WEEKLY ANALYSIS"
        subtitle="View Performance by Week"
        lastUpdated="Live Data"
        seasonYear={2025}
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="retro-card bg-background/95">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Select a Week
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              View detailed analysis, scores, and hypothetical matchups for any week
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                const isCurrent = week === currentWeek;
                const isPast = week < currentWeek;

                return (
                  <Link key={week} href={`/week/${week}`} className="block">
                    <Card
                      className={`retro-card hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all ${
                        isCurrent
                          ? "border-accent bg-accent/10"
                          : isPast
                          ? "border-primary bg-primary/5"
                          : "border-muted bg-muted/20"
                      }`}
                    >
                      <CardContent className="p-4 md:p-6 text-center">
                        <div className="mb-2">
                          {isCurrent ? (
                            <TrendingUp className="h-6 w-6 mx-auto text-accent" />
                          ) : isPast ? (
                            <BarChart3 className="h-6 w-6 mx-auto text-primary" />
                          ) : (
                            <Calendar className="h-6 w-6 mx-auto text-muted-foreground" />
                          )}
                        </div>
                        <div
                          className={`text-2xl md:text-3xl font-bold text-retro mb-1 ${
                            isCurrent
                              ? "text-accent"
                              : isPast
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {week}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          {isCurrent ? "Current" : isPast ? "Completed" : "Upcoming"}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Quick Access Buttons */}
            <div className="mt-8 pt-6 border-t border-primary/30">
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-4 text-center">
                Quick Access
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href={`/week/${currentWeek}`}>
                  <Button className="retro-button bg-primary text-primary-foreground">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Current Week ({currentWeek})
                  </Button>
                </Link>
                <Link href={`/week/1`}>
                  <Button variant="outline" className="retro-button">
                    Week 1
                  </Button>
                </Link>
                {currentWeek > 1 && (
                  <Link href={`/week/${currentWeek - 1}`}>
                    <Button variant="outline" className="retro-button">
                      Previous Week ({currentWeek - 1})
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="retro-card bg-background/95 mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-3 uppercase tracking-wider">
              About Weekly Analysis
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Weekly Scoreboard:</strong> See how all teams performed in a specific week, ranked by score.
              </p>
              <p>
                <strong className="text-foreground">Hypothetical Matchups:</strong> View what would happen if every team played every other team that week.
              </p>
              <p>
                <strong className="text-foreground">Stats Summary:</strong> Highest and lowest scores, averages, and interesting insights for each week.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
