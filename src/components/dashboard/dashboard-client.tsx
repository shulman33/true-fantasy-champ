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
  actualStandings?: Array<{
    teamId: string;
    teamName: string;
    owner: string;
    wins: number;
    losses: number;
    winPercentage: number;
  }> | null;
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
  const [fullRefreshing, setFullRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);

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

  const handleFullRefresh = async () => {
    setFullRefreshing(true);
    setRefreshStatus('Fetching ESPN data...');

    try {
      const response = await fetch('/api/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullRefresh: true }),
      });

      const result = await response.json();

      if (result.success) {
        setRefreshStatus(
          `✓ Updated ${result.weeksProcessed} weeks in ${(result.duration / 1000).toFixed(1)}s`
        );
        // Refetch dashboard data after successful ESPN update
        await fetchData();
      } else {
        setRefreshStatus(`⚠ Partial update: ${result.errors.length} error(s)`);
        setError(result.errors.join(', '));
      }

      // Clear status after 5 seconds
      setTimeout(() => setRefreshStatus(null), 5000);
    } catch (err) {
      setRefreshStatus('❌ Failed to update ESPN data');
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTimeout(() => setRefreshStatus(null), 5000);
    } finally {
      setFullRefreshing(false);
    }
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
      {/* Refresh Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-gray-400 font-mono wrap-break-word">
          {data.lastUpdate ? (
            <>
              Last updated: {new Date(data.lastUpdate).toLocaleString()}
            </>
          ) : (
            'No update time available'
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="retro-button w-full sm:w-auto shrink-0"
            disabled={refreshing || fullRefreshing}
          >
            <RefreshCwIcon className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Refresh View
          </Button>
          <Button
            onClick={handleFullRefresh}
            variant="default"
            size="sm"
            className="retro-button w-full sm:w-auto shrink-0"
            disabled={refreshing || fullRefreshing}
          >
            <RefreshCwIcon className={cn('w-4 h-4 mr-2', fullRefreshing && 'animate-spin')} />
            {fullRefreshing ? 'Updating ESPN...' : 'Full Refresh'}
          </Button>
        </div>
      </div>

      {/* Refresh Status Message */}
      {refreshStatus && (
        <div className="text-sm text-center sm:text-left text-green-400 font-mono bg-green-950/30 border border-green-500/30 rounded px-4 py-2">
          {refreshStatus}
        </div>
      )}

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
        actualStandings={data.actualStandings || undefined}
      />
    </div>
  );
}
