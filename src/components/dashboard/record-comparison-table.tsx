'use client';

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

interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  owner: string;
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
                  DIFF
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

                const winDiff = actualTeam ? actualTeam.wins - team.wins : 0;
                const pctDiff = actualTeam
                  ? (actualTeam.winPercentage - team.winPercentage) * 100
                  : 0;

                const luckStatus =
                  Math.abs(winDiff) < 1
                    ? 'Even'
                    : winDiff > 0
                    ? 'Lucky'
                    : 'Unlucky';

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
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white">{team.teamName}</span>
                        <span className="text-xs text-gray-400 font-mono">{team.owner}</span>
                      </div>
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
                      {hasActualData ? (
                        <Badge
                          variant={
                            luckStatus === 'Lucky'
                              ? 'default'
                              : luckStatus === 'Unlucky'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={cn(
                            'font-press-start text-[10px] px-2 py-1',
                            luckStatus === 'Lucky' && 'bg-green-500/20 text-green-500 border-green-500',
                            luckStatus === 'Unlucky' && 'bg-red-500/20 text-red-500 border-red-500',
                            luckStatus === 'Even' && 'bg-gray-500/20 text-gray-400 border-gray-500'
                          )}
                        >
                          {luckStatus}
                        </Badge>
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
