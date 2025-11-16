'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';
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
import { TableFilters } from './table-filters';
import { TeamSearch } from './team-search';
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
type FilterOption = 'all' | 'top6' | 'bottom6';

export function TrueStandingsTable({ standings, className }: TrueStandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Apply filters
  const filteredStandings = sortedStandings.filter((team) => {
    // Filter by top/bottom 6
    if (filter === 'top6' && team.rank > 6) return false;
    if (filter === 'bottom6' && team.rank <= 6) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        team.teamName.toLowerCase().includes(searchLower) ||
        team.abbrev.toLowerCase().includes(searchLower) ||
        team.owner.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const filterOptions = [
    { label: 'ALL TEAMS', value: 'all' },
    { label: 'TOP 6', value: 'top6' },
    { label: 'BOTTOM 6', value: 'bottom6' },
  ];

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Card className={cn('border-4 border-retro-green bg-black/80 backdrop-blur-sm', className)}>
      <CardHeader className="border-b-4 border-retro-green/30 space-y-4 py-6">
        <div>
          <CardTitle className="font-press-start text-xl text-retro-green uppercase tracking-wider">
            True Champion Standings
          </CardTitle>
          <p className="text-xs text-muted-foreground-accessible font-mono mt-2">
            Hypothetical records if every team played all others each week
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <TeamSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search teams, owners..."
            />
          </div>
          <TableFilters
            options={filterOptions}
            activeFilter={filter}
            onFilterChange={(value) => setFilter(value as FilterOption)}
          />
        </div>
        {filteredStandings.length !== standings.length && (
          <p className="text-xs text-retro-yellow font-mono">
            Showing {filteredStandings.length} of {standings.length} teams
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-retro-green/30 hover:bg-transparent">
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors"
                  onClick={() => handleSort('rank')}
                  aria-sort={sortField === 'rank' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={`Rank, sortable column, currently ${sortField === 'rank' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('rank')}
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
                  aria-sort={sortField === 'wins' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={`Wins and Losses, sortable column, currently ${sortField === 'wins' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('wins')}
                >
                  W-L {sortField === 'wins' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('winPercentage')}
                  aria-sort={sortField === 'winPercentage' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={`Win Percentage, sortable column, currently ${sortField === 'winPercentage' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('winPercentage')}
                >
                  WIN% {sortField === 'winPercentage' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('averagePoints')}
                  aria-sort={sortField === 'averagePoints' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={`Average Points, sortable column, currently ${sortField === 'averagePoints' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('averagePoints')}
                >
                  AVG {sortField === 'averagePoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="font-press-start text-[10px] text-retro-green cursor-pointer hover:text-retro-yellow transition-colors text-right"
                  onClick={() => handleSort('totalPoints')}
                  aria-sort={sortField === 'totalPoints' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={`Total Points, sortable column, currently ${sortField === 'totalPoints' ? `sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : 'not sorted'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('totalPoints')}
                >
                  PTS {sortField === 'totalPoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStandings.map((team, index) => (
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
                        'font-press-start text-xs px-2 py-1 flex items-center gap-1',
                        team.rank === 1 &&
                          'bg-retro-yellow text-black border-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]',
                        team.rank === 2 && 'bg-gray-400 text-black border-gray-400',
                        team.rank === 3 && 'bg-amber-700 text-white border-amber-700'
                      )}
                      aria-label={`Rank ${team.rank}${team.rank === 1 ? ' - First Place' : team.rank === 2 ? ' - Second Place' : team.rank === 3 ? ' - Third Place' : ''}`}
                    >
                      {team.rank === 1 && <Trophy className="h-3 w-3" aria-hidden="true" />}
                      {team.rank === 2 && <Medal className="h-3 w-3" aria-hidden="true" />}
                      {team.rank === 3 && <Award className="h-3 w-3" aria-hidden="true" />}
                      {team.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/team/${team.teamId}`}
                      className="flex flex-col gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
                      aria-label={`View details for ${team.teamName}`}
                    >
                      <span className="font-bold text-white group-hover:text-retro-yellow transition-colors">
                        {team.teamName}
                      </span>
                      <span className="text-xs text-retro-green font-mono">{team.abbrev}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground-accessible text-sm">{team.owner}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-white">
                    {team.wins}-{team.losses}
                  </TableCell>
                  <TableCell className="text-right font-mono text-retro-yellow">
                    {(team.winPercentage * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground-accessible">
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
