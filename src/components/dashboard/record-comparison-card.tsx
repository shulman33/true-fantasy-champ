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
    // Reduced glow on mobile for performance
    if (winDiff > 1) return 'border-green-500 sm:shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    if (winDiff < -1) return 'border-red-500 sm:shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    return 'border-retro-green';
  };

  return (
    <Link 
      href={`/team/${team.teamId}`}
      aria-label={`View details for ${team.teamName}, rank ${team.rank}`}
    >
      <Card
        className={cn(
          // Mobile-first: lighter border, no blur, simpler transitions
          'border-2 sm:border-4 bg-black/90 sm:bg-black/80 sm:backdrop-blur-sm',
          'transition-all duration-200',
          'hover:scale-[1.02] active:scale-[0.98]',
          'cursor-pointer group touch-manipulation',
          getLuckColor(),
          className
        )}
      >
        <CardHeader className="pb-3 p-4 sm:p-5">
          {/* Header with Rank and Team Info */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Rank Badge - Mobile optimized */}
              <Badge
                variant="outline"
                className="font-press-start text-[11px] sm:text-xs px-2 py-1 border-retro-green text-retro-green mb-2"
                aria-label={`Rank ${team.rank}`}
              >
                #{team.rank}
              </Badge>
              
              {/* Team Name - Primary focus */}
              <h3 className="font-bold text-base sm:text-lg md:text-xl text-white group-hover:text-retro-yellow transition-colors line-clamp-2 leading-snug mb-1">
                {team.teamName}
              </h3>
              
              {/* Abbreviation - Hidden on very small screens */}
              <p className="hidden xs:block text-xs sm:text-sm text-gray-400 font-mono">
                {team.abbrev}
              </p>
            </div>

            {/* Luck Badge - Improved touch target */}
            {hasActualData && showLuckBadge && (
              <Badge
                variant={luckStatus === 'Lucky' ? 'default' : 'destructive'}
                className={cn(
                  'font-press-start text-[10px] sm:text-[11px] px-2 py-1.5 sm:px-2.5 sm:py-1.5',
                  'flex items-center gap-1 shrink-0',
                  'min-h-[32px] sm:min-h-[36px]', // Touch-friendly minimum
                  luckStatus === 'Lucky' && 'bg-green-500/20 text-green-500 border-green-500',
                  luckStatus === 'Unlucky' && 'bg-red-500/20 text-red-500 border-red-500'
                )}
                aria-label={`${luckStatus} team with ${Math.abs(winDiff).toFixed(1)} win difference`}
              >
                {luckStatus === 'Lucky' ? (
                  <TrendingUpIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDownIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                )}
                <span className="hidden xs:inline">{luckStatus.toUpperCase()}</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
          {/* Record Comparison */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Actual Record */}
            <div className="bg-black/40 border-2 border-white/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400 font-mono uppercase tracking-wide">
                  Actual
                </span>
                {hasActualData && winDiff !== 0 && (
                  winDiff > 0 ? (
                    <ArrowUpIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" aria-label="Better than expected" />
                  ) : (
                    <ArrowDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" aria-label="Worse than expected" />
                  )
                )}
              </div>
              {hasActualData && actualTeam ? (
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                    {actualTeam.wins}-{actualTeam.losses}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-mono">
                    {actualTeam.winPercentage.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-base sm:text-lg text-gray-600 font-mono">---</div>
              )}
            </div>

            {/* True Record */}
            <div className="bg-retro-yellow/10 border-2 border-retro-yellow/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400 font-mono uppercase tracking-wide">
                  True
                </span>
                <TrendingUpIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-retro-yellow" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-retro-yellow font-mono">
                  {team.wins}-{team.losses}
                </div>
                <div className="text-xs sm:text-sm text-retro-yellow/70 font-mono">
                  {team.winPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Impact - Prominent on mobile */}
          {hasActualData && (
            <div className="bg-black/40 border-2 border-retro-green/30 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-400 font-mono uppercase tracking-wide mb-2">
                Schedule Luck
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {winDiff > 0 ? (
                    <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" aria-hidden="true" />
                  ) : winDiff < 0 ? (
                    <ArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" aria-hidden="true" />
                  ) : (
                    <span className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span
                    className={cn(
                      'text-base sm:text-lg md:text-xl font-bold font-mono',
                      winDiff > 0 && 'text-green-500',
                      winDiff < 0 && 'text-red-500',
                      winDiff === 0 && 'text-gray-500'
                    )}
                  >
                    {winDiff > 0 ? '+' : ''}
                    {winDiff.toFixed(1)} wins
                  </span>
                </div>
                <span
                  className={cn(
                    'text-sm sm:text-base font-mono font-semibold',
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
            <div className="text-center py-4 border-2 border-retro-green/20 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-500 font-mono">
                Actual data unavailable
              </p>
            </div>
          )}

          {/* View Details CTA */}
          <div className="text-center pt-2 border-t-2 border-retro-green/20">
            <span className="text-[11px] sm:text-xs text-retro-green group-hover:text-retro-yellow transition-colors font-press-start inline-block py-1">
              TAP TO VIEW DETAILS →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
