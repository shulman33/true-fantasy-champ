'use client';

import { useEffect, useState } from 'react';
import { LoadingCard } from '@/components/shared/loading-skeleton';
import { ErrorMessage } from '@/components/shared/error-message';
import { TeamOverview } from './team-overview';
import { WeeklyPerformanceTable } from './weekly-performance-table';
import { PerformanceChart } from './performance-chart';
import { HeadToHeadTable } from './head-to-head-table';

interface TeamData {
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
  trueRecord: {
    wins: number;
    losses: number;
    winPercentage: number;
    totalGames: number;
  };
  actualRecord: {
    wins: number;
    losses: number;
    ties: number;
    winPercentage: number;
  } | null;
  recordDifferential: {
    wins: number;
    losses: number;
    winPercentage: number;
  } | null;
  statistics: {
    averagePoints: number;
    consistency: number;
    totalPoints: number;
    weeksPlayed: number;
  };
  weeklyPerformance: Array<{
    week: number;
    score: number;
    wins: number;
    losses: number;
    rank: number;
    totalTeams: number;
  }>;
  headToHead: Array<{
    opponentId: string;
    opponentName: string;
    opponentOwner: string;
    wins: number;
    losses: number;
    ties: number;
    winPercentage: number;
  }>;
  season: number;
  currentWeek: number;
}

interface TeamPageClientProps {
  teamId: string;
}

export function TeamPageClient({ teamId }: TeamPageClientProps) {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/team/${teamId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team data');
        }

        const data = await response.json();
        setTeamData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message="Team data not found" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Team Overview Section */}
      <TeamOverview teamData={teamData} />

      {/* Performance Chart */}
      <PerformanceChart weeklyPerformance={teamData.weeklyPerformance} />

      {/* Week-by-Week Breakdown */}
      <WeeklyPerformanceTable
        weeklyPerformance={teamData.weeklyPerformance}
        teamName={teamData.teamName}
      />

      {/* Head-to-Head Records */}
      <HeadToHeadTable headToHead={teamData.headToHead} teamName={teamData.teamName} />
    </div>
  );
}
