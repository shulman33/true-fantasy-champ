'use client';

import { useEffect, useState } from 'react';
import { TrueStandingsTable, RecordComparisonTable, StatsGrid } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { LoadingTable, LoadingStats, ErrorMessage } from '@/components/shared';
import { RefreshCwIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardData {
  season: number;
  standings: Array<{
    rank: number;
    teamId: string;
    teamName: string;
    owner: string;
    abbrev: string;
    wins: number;
    losses: number;
    winPercentage: number;
    averagePoints: number;
    totalPoints: number;
    consistency: number;
  }>;
  stats: {
    luckiest: any | null;
    unluckiest: any | null;
    mostConsistent: any | null;
    highestScoring: any | null;
  };
  lastUpdate: string | null;
  currentWeek: number;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <LoadingStats />
        <LoadingTable rows={12} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <div className="text-center">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="retro-button"
            disabled={refreshing}
          >
            <RefreshCwIcon className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <ErrorMessage message="No data available. Please check back later." />
    );
  }

  return (
    <div className="space-y-8">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400 font-mono">
          {data.lastUpdate ? (
            <>
              Last updated: {new Date(data.lastUpdate).toLocaleString()}
            </>
          ) : (
            'No update time available'
          )}
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="retro-button"
          disabled={refreshing}
        >
          <RefreshCwIcon className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        luckiest={data.stats.luckiest}
        unluckiest={data.stats.unluckiest}
        mostConsistent={data.stats.mostConsistent}
        highestScoring={data.stats.highestScoring}
      />

      {/* True Standings Table */}
      <TrueStandingsTable standings={data.standings} />

      {/* Record Comparison Table */}
      <RecordComparisonTable
        trueStandings={data.standings}
        actualStandings={undefined} // Will be integrated later
      />
    </div>
  );
}
