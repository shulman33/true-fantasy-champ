'use client';

import { useState } from 'react';
import { TeamStandingsCard } from './team-standings-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUpDownIcon } from 'lucide-react';

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

interface TeamStandingsGridProps {
  standings: TeamStanding[];
  className?: string;
}

type SortField = 'rank' | 'wins' | 'winPercentage' | 'averagePoints' | 'totalPoints';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'top6' | 'bottom6';

export function TeamStandingsGrid({ standings, className }: TeamStandingsGridProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const sortedStandings = [...standings].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aValue > bValue ? 1 : -1) * multiplier;
  });

  const filteredStandings = sortedStandings.filter((team) => {
    if (filter === 'top6') return team.rank <= 6;
    if (filter === 'bottom6') return team.rank > 6;
    return true;
  });

  const getSortLabel = (field: SortField): string => {
    const labels: Record<SortField, string> = {
      rank: 'Rank',
      wins: 'Wins',
      winPercentage: 'Win %',
      averagePoints: 'Avg Points',
      totalPoints: 'Total Points',
    };
    return labels[field];
  };

  return (
    <Card className={cn('border-4 border-retro-green bg-black/80 backdrop-blur-sm', className)}>
      <CardHeader className="border-b-4 border-retro-green/30">
        <CardTitle className="font-press-start text-base sm:text-xl text-retro-green uppercase tracking-wider">
          True Champion Standings
        </CardTitle>
        <p className="text-xs text-gray-400 font-mono mt-2">
          Hypothetical records if every team played all others each week
        </p>

        {/* Mobile Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Sort Dropdown */}
          <div className="flex-1">
            <Select
              value={sortField}
              onValueChange={(value) => handleSort(value as SortField)}
            >
              <SelectTrigger className="w-full bg-black/60 border-retro-green/30 text-white font-mono text-xs">
                <div className="flex items-center gap-2">
                  <ArrowUpDownIcon className="w-3 h-3" />
                  <SelectValue placeholder="Sort by..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-retro-green/30">
                <SelectItem value="rank" className="text-white font-mono">
                  Rank {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SelectItem>
                <SelectItem value="wins" className="text-white font-mono">
                  Wins {sortField === 'wins' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SelectItem>
                <SelectItem value="winPercentage" className="text-white font-mono">
                  Win % {sortField === 'winPercentage' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SelectItem>
                <SelectItem value="averagePoints" className="text-white font-mono">
                  Avg Points {sortField === 'averagePoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SelectItem>
                <SelectItem value="totalPoints" className="text-white font-mono">
                  Total Points {sortField === 'totalPoints' && (sortDirection === 'asc' ? '↑' : '↓')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px] flex-1 sm:flex-none',
                filter === 'all'
                  ? 'bg-retro-green text-black border-retro-green'
                  : 'bg-black/60 text-retro-green border-retro-green/30'
              )}
            >
              ALL
            </Button>
            <Button
              variant={filter === 'top6' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('top6')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px] flex-1 sm:flex-none',
                filter === 'top6'
                  ? 'bg-retro-yellow text-black border-retro-yellow'
                  : 'bg-black/60 text-retro-yellow border-retro-yellow/30'
              )}
            >
              TOP 6
            </Button>
            <Button
              variant={filter === 'bottom6' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('bottom6')}
              className={cn(
                'font-press-start text-[8px] sm:text-[10px] flex-1 sm:flex-none',
                filter === 'bottom6'
                  ? 'bg-retro-red text-white border-retro-red'
                  : 'bg-black/60 text-retro-red border-retro-red/30'
              )}
            >
              BOT 6
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStandings.map((team) => (
            <TeamStandingsCard key={team.teamId} team={team} />
          ))}
        </div>

        {/* No Results */}
        {filteredStandings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-mono text-sm">No teams match the current filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
