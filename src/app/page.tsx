import { MainLayout, ScoreboardHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <MainLayout>
      <ScoreboardHeader
        title="TRUE CHAMPION"
        subtitle="Who would win if everyone played everyone each week?"
        lastUpdated="Coming Soon"
        seasonYear={2025}
      />

      <div className="space-y-4 md:space-y-6">
        {/* Welcome Section */}
        <Card className="retro-card">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl text-primary text-retro">
              WELCOME TO THE TRUTH
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Stop letting luck decide your champion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            <p className="text-sm leading-relaxed">
              Your fantasy football league has a dirty little secret: the
              champion might just be the luckiest person in your league, not the
              best. Week after week, teams dodge bullets by facing weak opponents
              while powerhouse teams cannibalize each other.
            </p>
            <p className="text-sm leading-relaxed">
              True Champion calculates what each team's record would be if they
              played EVERY other team EVERY week. No more schedule luck. Just pure
              performance.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <Card className="retro-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <CardTitle className="text-lg text-retro">TRUE RECORDS</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                See what your record would be if you played everyone, every single
                week. The truth revealed.
              </p>
            </CardContent>
          </Card>

          <Card className="retro-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍀</span>
                <CardTitle className="text-lg text-retro">LUCK METER</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Find out who's been riding their lucky schedule and who's been
                robbed by fate.
              </p>
            </CardContent>
          </Card>

          <Card className="retro-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <CardTitle className="text-lg text-retro">WEEKLY BREAKDOWN</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Dive into every week to see hypothetical matchups and how you
                would've fared.
              </p>
            </CardContent>
          </Card>

          <Card className="retro-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <CardTitle className="text-lg text-retro">TRUE CHAMPION</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Crown the team that deserves it most - consistent, dominant
                performance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Card */}
        <Card className="retro-card bg-primary/10">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg text-retro">PROJECT STATUS</CardTitle>
              <Badge variant="outline" className="border-primary text-primary text-xs sm:text-sm whitespace-nowrap">
                IN DEVELOPMENT
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>Phase 1-3: Foundation & Algorithm - COMPLETE</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              <span>Phase 4: UI Components Foundation - COMPLETE</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">○</span>
              <span className="text-muted-foreground">
                Phase 5: Dashboard - Coming Next
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-6 md:py-8">
          <Button className="retro-button w-full max-w-md mx-auto text-sm sm:text-base md:text-lg px-4 py-3 sm:px-6 md:px-8 sm:py-4 md:py-6 whitespace-normal leading-tight" size="lg">
            VIEW STANDINGS (COMING SOON)
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
