"use client";

import { Trophy } from "lucide-react";
import { MainLayout, ScoreboardHeader } from "@/components/shared";
import {
  StatsGrid,
  TeamStandingsGrid,
  TrueStandingsTable,
  RecordComparisonGrid,
  RecordComparisonTable,
} from "@/components/dashboard";
import {
  MOCK_TEAMS,
  MOCK_LEAGUE_INFO,
  calculateMockStats,
  getMockStandings,
} from "@/lib/mock-league-data";
import Link from "next/link";

export default function DemoPage() {
  const stats = calculateMockStats();
  const standings = getMockStandings();

  // Transform mock data to match dashboard format
  const formattedStandings = standings.map((team, index) => ({
    rank: index + 1,
    teamId: team.id,
    teamName: team.name,
    owner: team.owner,
    abbrev: team.name.substring(0, 3).toUpperCase(),
    wins: team.trueWins,
    losses: team.trueLosses,
    winPercentage: (team.trueWins / (team.trueWins + team.trueLosses)) * 100,
    averagePoints:
      team.weeklyScores.reduce((a, b) => a + b, 0) / team.weeklyScores.length,
    totalPoints: team.pointsFor,
    consistency: team.weeklyScores.reduce((sum, score) => {
      const avg =
        team.weeklyScores.reduce((a, b) => a + b, 0) / team.weeklyScores.length;
      return sum + Math.pow(score - avg, 2);
    }, 0) / team.weeklyScores.length,
  }));

  // Format actual standings for comparison
  const actualStandings = MOCK_TEAMS.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    owner: team.owner,
    wins: team.actualWins,
    losses: team.actualLosses,
    winPercentage: (team.actualWins / (team.actualWins + team.actualLosses)) * 100,
  })).sort((a, b) => b.winPercentage - a.winPercentage);

  return (
    <MainLayout>
      {/* Demo Banner */}
      <div className="mb-6 rounded-lg border-2 border-retro-yellow bg-retro-yellow/10 p-4 text-center">
        <p className="flex items-center justify-center gap-2 text-xs text-retro-yellow md:text-sm">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          <span className="font-bold">DEMO MODE</span> - This is sample data
          to show you how True Champion works.{" "}
          <Link href="/signup" className="underline hover:text-retro-yellow/80">
            Sign up
          </Link>{" "}
          to connect your real league!
        </p>
      </div>

      <ScoreboardHeader
        title="TRUE CHAMPION"
        subtitle="Fantasy Football's Ultimate Truth Detector"
        lastUpdated={new Date(MOCK_LEAGUE_INFO.lastUpdated).toLocaleString()}
        seasonYear={MOCK_LEAGUE_INFO.season}
      />

      <div className="space-y-8">
        {/* Last Updated Info */}
        <div className="text-xs sm:text-sm text-gray-400 font-mono">
          Last updated: {new Date(MOCK_LEAGUE_INFO.lastUpdated).toLocaleString()}
        </div>

        {/* Stats Grid */}
        <StatsGrid
          luckiest={stats.luckiest}
          unluckiest={stats.unluckiest}
          mostConsistent={stats.mostConsistent}
          highestScoring={stats.highestScoring}
        />

        {/* True Standings - Mobile Card Grid (< 1024px) / Desktop Table (>= 1024px) */}
        <div className="block lg:hidden">
          <TeamStandingsGrid standings={formattedStandings} />
        </div>
        <div className="hidden lg:block">
          <TrueStandingsTable standings={formattedStandings} />
        </div>

        {/* Record Comparison - Mobile Card Grid (< 1024px) / Desktop Table (>= 1024px) */}
        <div className="block lg:hidden">
          <RecordComparisonGrid
            trueStandings={formattedStandings}
            actualStandings={actualStandings}
          />
        </div>
        <div className="hidden lg:block">
          <RecordComparisonTable
            trueStandings={formattedStandings}
            actualStandings={actualStandings}
          />
        </div>

        {/* CTA to sign up */}
        <div className="mt-8 text-center">
          <div className="retro-card inline-block border-primary bg-card/90 p-6">
            <p className="mb-4 text-sm text-foreground">
              Ready to see YOUR league&apos;s true champion?
            </p>
            <Link
              href="/signup"
              className="retro-button inline-flex items-center gap-2 bg-primary px-8 py-3 text-xs text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              CONNECT YOUR LEAGUE
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
