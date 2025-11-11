'use client';

import { useEffect, useState } from 'react';
import { LoadingCard } from '@/components/shared/loading-skeleton';
import { ErrorMessage } from '@/components/shared/error-message';
import { WeeklyScoreboard } from './weekly-scoreboard';
import { MatchupMatrix } from './matchup-matrix';
import { WeeklyStats } from './weekly-stats';
import { WeekNavigator } from './week-navigator';

interface WeeklyAnalysisData {
  week: number;
  season: number;
  scores: Array<{
    teamId: string;
    teamName: string;
    owner: string;
    abbrev: string;
    week: number;
    score: number;
    rank: number;
  }>;
  highestScore: {
    teamId: string;
    teamName: string;
    owner: string;
    week: number;
    score: number;
  };
  lowestScore: {
    teamId: string;
    teamName: string;
    owner: string;
    week: number;
    score: number;
  };
  averageScore: number;
  medianScore: number;
  matchupMatrix: Array<{
    week: number;
    team1Id: string;
    team2Id: string;
    team1Score: number;
    team2Score: number;
    winner: string;
  }>;
  totalTeams: number;
}

interface WeekPageClientProps {
  week: number;
}

interface CurrentWeekInfo {
  currentWeek: number;
  lastCompletedWeek: number;
  maxWeek: number;
  totalWeeks: number;
}

export function WeekPageClient({ week }: WeekPageClientProps) {
  const [data, setData] = useState<WeeklyAnalysisData | null>(null);
  const [weekInfo, setWeekInfo] = useState<CurrentWeekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeeklyAnalysis() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both weekly analysis and current week info in parallel
        const [analysisResponse, weekInfoResponse] = await Promise.all([
          fetch(`/api/weekly-analysis/${week}`, {
            cache: 'no-store',
          }),
          fetch('/api/current-week', {
            cache: 'no-store',
          }),
        ]);

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json();
          throw new Error(errorData.error || 'Failed to fetch weekly analysis');
        }

        const analysisData = await analysisResponse.json();
        setData(analysisData);

        // Set week info even if the request fails (it has fallback)
        if (weekInfoResponse.ok) {
          const weekInfoData = await weekInfoResponse.json();
          setWeekInfo(weekInfoData);
        } else {
          // Fallback to showing all weeks
          setWeekInfo({
            currentWeek: 18,
            lastCompletedWeek: 18,
            maxWeek: 18,
            totalWeeks: 18,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklyAnalysis();
  }, [week]);

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

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message="No weekly analysis data available" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Week Navigator */}
      <WeekNavigator
        currentWeek={week}
        totalWeeks={weekInfo?.totalWeeks || 18}
        maxCompletedWeek={weekInfo?.maxWeek || 18}
      />

      {/* Weekly Stats Summary */}
      <WeeklyStats
        highestScore={data.highestScore}
        lowestScore={data.lowestScore}
        averageScore={data.averageScore}
        medianScore={data.medianScore}
        totalTeams={data.totalTeams}
      />

      {/* Weekly Scoreboard */}
      <WeeklyScoreboard scores={data.scores} week={week} />

      {/* Hypothetical Matchups Matrix */}
      <MatchupMatrix
        matchupMatrix={data.matchupMatrix}
        scores={data.scores}
        week={week}
      />
    </div>
  );
}
