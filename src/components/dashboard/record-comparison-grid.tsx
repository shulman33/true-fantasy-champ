'use client';

import { useState } from 'react';
import { RecordComparisonCard } from './record-comparison-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
  wins: number;
  losses: number;
  winPercentage: number;
}

interface ActualStanding {
  teamId: string;
  teamName: string;
  owner: string;
  wins: number;
  losses: number;
  winPercentage: number;
}

interface RecordComparisonGridProps {
  trueStandings: TeamStanding[];
  actualStandings?: ActualStanding[];
  className?: string;
}

type FilterOption = 'all' | 'lucky' | 'unlucky' | 'neutral';

export function RecordComparisonGrid({
  trueStandings,
  actualStandings,
  className,
}: RecordComparisonGridProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const hasActualData = actualStandings && actualStandings.length > 0;

  // Calculate win differentials for filtering
  const teamsWithDiff = trueStandings.map((team) => {
    const actualTeam = hasActualData
      ? actualStandings.find((t) => t.teamId === team.teamId) || null
      : null;

    const actualGamesPlayed = actualTeam ? actualTeam.wins + actualTeam.losses : 0;
    const expectedWins = actualTeam ? Math.round(team.winPercentage * actualGamesPlayed) : 0;
    const winDiff = actualTeam ? actualTeam.wins - expectedWins : 0;

    return {
      team,
      actualTeam,
      winDiff,
    };
  });

  // Filter teams based on luck status
  const filteredTeams = teamsWithDiff.filter(({ winDiff }) => {
    if (filter === 'lucky') return winDiff >= 2;
    if (filter === 'unlucky') return winDiff <= -2;
    if (filter === 'neutral') return Math.abs(winDiff) < 2;
    return true;
  });

  return (
    <Card className={cn('border-4 border-retro-green bg-black/80 backdrop-blur-sm', className)}>
      <CardHeader className="border-b-4 border-retro-green/30">
        <CardTitle className="font-press-start text-base sm:text-xl text-retro-green uppercase tracking-wider">
          Record Comparison
        </CardTitle>
        <p className="text-xs text-gray-400 font-mono mt-2">
          {hasActualData
            ? 'True records vs actual league standings - reveal schedule luck!'
            : 'Actual standings data coming soon...'}
        </p>

        {/* Filter Buttons */}
        {hasActualData && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px]',
                filter === 'all'
                  ? 'bg-retro-green text-black border-retro-green'
                  : 'bg-black/60 text-retro-green border-retro-green/30'
              )}
            >
              ALL TEAMS
            </Button>
            <Button
              variant={filter === 'lucky' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('lucky')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px]',
                filter === 'lucky'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-black/60 text-green-500 border-green-500/30'
              )}
            >
              LUCKY (+2)
            </Button>
            <Button
              variant={filter === 'unlucky' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unlucky')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px]',
                filter === 'unlucky'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-black/60 text-red-500 border-red-500/30'
              )}
            >
              UNLUCKY (-2)
            </Button>
            <Button
              variant={filter === 'neutral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('neutral')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px]',
                filter === 'neutral'
                  ? 'bg-gray-500 text-white border-gray-500'
                  : 'bg-black/60 text-gray-500 border-gray-500/30'
              )}
            >
              NEUTRAL (±1)
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {hasActualData ? (
          <>
            {/* Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map(({ team, actualTeam }) => (
                <RecordComparisonCard key={team.teamId} team={team} actualTeam={actualTeam} />
              ))}
            </div>

            {/* No Results */}
            {filteredTeams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 font-mono text-sm">
                  No teams match the current filter
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 font-mono">
              📊 Actual league standings will be displayed here once integrated with ESPN API
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
