'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

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

interface RecordComparisonCardProps {
  team: TeamStanding;
  actualTeam: ActualStanding | null;
  className?: string;
}

export function RecordComparisonCard({ team, actualTeam, className }: RecordComparisonCardProps) {
  // Calculate win differential
  const actualGamesPlayed = actualTeam ? actualTeam.wins + actualTeam.losses : 0;
  const expectedWins = actualTeam ? Math.round(team.winPercentage * actualGamesPlayed) : 0;
  const winDiff = actualTeam ? actualTeam.wins - expectedWins : 0;
  const pctDiff = actualTeam ? (actualTeam.winPercentage - team.winPercentage) * 100 : 0;

  // Determine luck status
  const showLuckBadge = Math.abs(winDiff) >= 2;
  const luckStatus = winDiff > 0 ? 'Lucky' : 'Unlucky';
  const hasActualData = actualTeam !== null;

  const getLuckColor = () => {
    if (winDiff > 1) return 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    if (winDiff < -1) return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    return 'border-retro-green';
  };

  return (
    <Link href={`/team/${team.teamId}`}>
      <Card
        className={cn(
          'border-4 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer group',
          getLuckColor(),
          className
        )}
      >
        <CardHeader className="pb-2 p-3 sm:p-4">
          {/* Header with Rank and Team Info */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge
                variant="outline"
                className="font-press-start text-[9px] px-1.5 py-0.5 border-retro-green text-retro-green mb-1.5"
              >
                #{team.rank}
              </Badge>
              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-retro-yellow transition-colors line-clamp-2 leading-tight">
                {team.teamName}
              </h3>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{team.abbrev}</p>
            </div>

            {/* Luck Badge */}
            {hasActualData && showLuckBadge && (
              <Badge
                variant={luckStatus === 'Lucky' ? 'default' : 'destructive'}
                className={cn(
                  'font-press-start text-[8px] px-1.5 py-0.5 flex items-center gap-0.5',
                  luckStatus === 'Lucky' && 'bg-green-500/20 text-green-500 border-green-500',
                  luckStatus === 'Unlucky' && 'bg-red-500/20 text-red-500 border-red-500'
                )}
              >
                {luckStatus === 'Lucky' ? <TrendingUpIcon className="w-2.5 h-2.5" /> : <TrendingDownIcon className="w-2.5 h-2.5" />}
                {luckStatus.toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-2 sm:p-4 sm:pt-2">
          {/* Record Comparison */}
          <div className="grid grid-cols-2 gap-2">
            {/* Actual Record */}
            <div className="bg-black/40 border-2 border-white/20 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase">Actual</span>
                {hasActualData && winDiff !== 0 && (
                  winDiff > 0 ? (
                    <ArrowUpIcon className="w-2.5 h-2.5 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-2.5 h-2.5 text-red-500" />
                  )
                )}
              </div>
              {hasActualData && actualTeam ? (
                <div className="space-y-0.5">
                  <div className="text-base sm:text-lg font-bold text-white font-mono">
                    {actualTeam.wins}-{actualTeam.losses}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {actualTeam.winPercentage.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 font-mono">---</div>
              )}
            </div>

            {/* True Record */}
            <div className="bg-retro-yellow/10 border-2 border-retro-yellow/30 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase">True</span>
                <TrendingUpIcon className="w-2.5 h-2.5 text-retro-yellow" />
              </div>
              <div className="space-y-0.5">
                <div className="text-base sm:text-lg font-bold text-retro-yellow font-mono">
                  {team.wins}-{team.losses}
                </div>
                <div className="text-[10px] text-retro-yellow/70 font-mono">
                  {team.winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Win Differential */}
          {hasActualData && (
            <div className="bg-black/40 border border-retro-green/20 rounded-lg p-2">
              <div className="text-[9px] text-gray-500 font-mono uppercase mb-1">
                Schedule Impact
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {winDiff > 0 ? (
                    <ArrowUpIcon className="w-3 h-3 text-green-500" />
                  ) : winDiff < 0 ? (
                    <ArrowDownIcon className="w-3 h-3 text-red-500" />
                  ) : (
                    <span className="w-3 h-3" />
                  )}
                  <span
                    className={cn(
                      'text-sm sm:text-base font-bold font-mono',
                      winDiff > 0 && 'text-green-500',
                      winDiff < 0 && 'text-red-500',
                      winDiff === 0 && 'text-gray-500'
                    )}
                  >
                    {winDiff > 0 ? '+' : ''}
                    {winDiff.toFixed(0)} wins
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm font-mono',
                    pctDiff > 0 && 'text-green-500',
                    pctDiff < 0 && 'text-red-500',
                    pctDiff === 0 && 'text-gray-500'
                  )}
                >
                  {pctDiff > 0 ? '+' : ''}
                  {pctDiff.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!hasActualData && (
            <div className="text-center py-3 border border-retro-green/20 rounded-lg">
              <p className="text-[10px] text-gray-500 font-mono">Actual data unavailable</p>
            </div>
          )}

          {/* View Details Link */}
          <div className="text-center pt-1.5 border-t border-retro-green/20">
            <span className="text-[9px] sm:text-[10px] text-retro-green group-hover:text-retro-yellow transition-colors font-press-start">
              VIEW DETAILS →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
