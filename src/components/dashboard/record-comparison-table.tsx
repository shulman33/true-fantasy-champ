'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { RetroTooltip, RetroTooltipTrigger, RetroTooltipContent } from '@/components/ui/retro-tooltip';

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

interface RecordComparisonTableProps {
  trueStandings: TeamStanding[];
  actualStandings?: ActualStanding[];
  className?: string;
}

export function RecordComparisonTable({
  trueStandings,
  actualStandings,
  className,
}: RecordComparisonTableProps) {
  // For now, show placeholder for actual records
  const hasActualData = actualStandings && actualStandings.length > 0;

  const getDifferentialIcon = (diff: number) => {
    if (diff > 0) return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (diff < 0) return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-500" />;
  };

  const getDifferentialColor = (diff: number) => {
    if (diff > 0) return 'text-green-500';
    if (diff < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <Card className={cn('border-4 border-retro-green bg-black/80 backdrop-blur-sm', className)}>
      <CardHeader className="border-b-4 border-retro-green/30">
        <CardTitle className="font-press-start text-xl text-retro-green uppercase tracking-wider">
          Record Comparison
        </CardTitle>
        <p className="text-xs text-gray-400 font-mono mt-2">
          {hasActualData
            ? 'True records vs actual league standings - reveal schedule luck!'
            : 'Actual standings data coming soon...'}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-retro-green/30 hover:bg-transparent">
                <TableHead className="font-press-start text-[10px] text-retro-green">
                  RNK
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green">
                  TEAM
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green text-center">
                  ACTUAL
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-yellow text-center">
                  TRUE
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>DIFF</span>
                    <RetroTooltip>
                      <RetroTooltipTrigger asChild>
                        <button
                          className="inline-flex items-center justify-center w-4 h-4 border-2 border-retro-green rounded-sm bg-black/60 hover:bg-black/80 transition-all duration-200 hover:scale-110 active:scale-95 group"
                          type="button"
                          aria-label="Information about win differential"
                        >
                          <span className="font-press-start text-[8px] text-retro-green group-hover:brightness-125">
                            ?
                          </span>
                        </button>
                      </RetroTooltipTrigger>
                      <RetroTooltipContent side="top" align="center">
                        Win differential shows how many more (or fewer) wins a team has compared to their expected record. Expected record is calculated using true win percentage applied to actual games played. Positive numbers (green) mean lucky schedule, negative numbers (red) mean unlucky schedule.
                      </RetroTooltipContent>
                    </RetroTooltip>
                  </div>
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green text-center">
                  LUCK
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trueStandings.map((team, index) => {
                const actualTeam = hasActualData
                  ? actualStandings.find((t) => t.teamId === team.teamId)
                  : null;

                // Calculate expected record based on true win percentage
                // This normalizes the comparison: what SHOULD the record be given true performance?
                const actualGamesPlayed = actualTeam ? actualTeam.wins + actualTeam.losses : 0;
                const expectedWins = actualTeam ? Math.round(team.winPercentage * actualGamesPlayed) : 0;
                const winDiff = actualTeam ? actualTeam.wins - expectedWins : 0;

                const pctDiff = actualTeam
                  ? (actualTeam.winPercentage - team.winPercentage) * 100
                  : 0;

                // Only show luck badge if differential is significant (±2 games or more)
                const showLuckBadge = Math.abs(winDiff) >= 2;
                const luckStatus = winDiff > 0 ? 'Lucky' : 'Unlucky';

                return (
                  <TableRow
                    key={team.teamId}
                    className={cn(
                      'border-b border-retro-green/20 transition-colors',
                      'hover:bg-retro-green/10',
                      index % 2 === 0 && 'bg-retro-green/5'
                    )}
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-press-start text-xs px-2 py-1 border-retro-green text-retro-green"
                      >
                        {team.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/team/${team.teamId}`}
                        className="flex flex-col gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
                      >
                        <span className="font-bold text-white group-hover:text-retro-yellow transition-colors">
                          {team.teamName}
                        </span>
                        <span className="text-xs text-retro-green font-mono">{team.abbrev}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {hasActualData && actualTeam ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-white">
                            {actualTeam.wins}-{actualTeam.losses}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {(actualTeam.winPercentage * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs font-mono">---</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-retro-yellow">
                          {team.wins}-{team.losses}
                        </span>
                        <span className="text-xs text-retro-yellow/70 font-mono">
                          {(team.winPercentage * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {hasActualData ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            {getDifferentialIcon(winDiff)}
                            <span className={cn('font-mono font-bold', getDifferentialColor(winDiff))}>
                              {winDiff > 0 ? '+' : ''}
                              {winDiff.toFixed(0)}
                            </span>
                          </div>
                          <span className={cn('text-xs font-mono', getDifferentialColor(pctDiff))}>
                            {pctDiff > 0 ? '+' : ''}
                            {pctDiff.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs font-mono">---</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasActualData && showLuckBadge ? (
                        <Badge
                          variant={luckStatus === 'Lucky' ? 'default' : 'destructive'}
                          className={cn(
                            'font-press-start text-[10px] px-2 py-1',
                            luckStatus === 'Lucky' && 'bg-green-500/20 text-green-500 border-green-500',
                            luckStatus === 'Unlucky' && 'bg-red-500/20 text-red-500 border-red-500'
                          )}
                        >
                          {luckStatus}
                        </Badge>
                      ) : hasActualData ? (
                        <span className="text-gray-400 text-xs font-mono">-</span>
                      ) : (
                        <span className="text-gray-600 text-xs font-mono">---</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {!hasActualData && (
          <div className="p-8 text-center border-t-2 border-retro-green/30">
            <p className="text-sm text-gray-500 font-mono">
              📊 Actual league standings will be displayed here once integrated with ESPN API
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
