'use client';

import { useState } from 'react';
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

interface TeamStanding {
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
}

interface TrueStandingsTableProps {
  standings: TeamStanding[];
  className?: string;
}

type SortField = 'rank' | 'wins' | 'winPercentage' | 'averagePoints' | 'totalPoints';
type SortDirection = 'asc' | 'desc';

export function TrueStandingsTable({ standings, className }: TrueStandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStandings = [...standings].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aValue > bValue ? 1 : -1) * multiplier;
  });

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Card className={cn('border-4 border-retro-green bg-black/80 backdrop-blur-sm', className)}>
      <CardHeader className="border-b-4 border-retro-green/30">
        <CardTitle className="font-press-start text-xl text-retro-green uppercase tracking-wider">
          True Champion Standings
        </CardTitle>
        <p className="text-xs text-gray-400 font-mono mt-2">
          Hypothetical records if every team played all others each week
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-retro-green/30 hover:bg-transparent">
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors"
                  onClick={() => handleSort('rank')}
                >
                  RNK {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green">
                  TEAM
                </TableHead>
                <TableHead className="font-press-start text-[10px] text-retro-green">
                  OWNER
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('wins')}
                >
                  W-L {sortField === 'wins' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('winPercentage')}
                >
                  WIN% {sortField === 'winPercentage' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('averagePoints')}
                >
                  AVG {sortField === 'averagePoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('totalPoints')}
                >
                  PTS {sortField === 'totalPoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStandings.map((team, index) => (
                <TableRow
                  key={team.teamId}
                  className={cn(
                    'border-b border-retro-green/20 transition-colors',
                    'hover:bg-retro-green/10',
                    index % 2 === 0 && 'bg-retro-green/5'
                  )}
                >
                  <TableCell className="font-bold">
                    <Badge
                      variant={getRankBadgeVariant(team.rank)}
                      className={cn(
                        'font-press-start text-xs px-2 py-1',
                        team.rank === 1 &&
                          'bg-retro-yellow text-black border-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]',
                        team.rank === 2 && 'bg-gray-400 text-black border-gray-400',
                        team.rank === 3 && 'bg-amber-700 text-white border-amber-700'
                      )}
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
                  <TableCell className="text-gray-300 text-sm">{team.owner}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-white">
                    {team.wins}-{team.losses}
                  </TableCell>
                  <TableCell className="text-right font-mono text-retro-yellow">
                    {(team.winPercentage * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-300">
                    {team.averagePoints.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-retro-green">
                    {team.totalPoints.toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
