'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrophyIcon, TrendingUpIcon } from 'lucide-react';

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

interface TeamStandingsCardProps {
  team: TeamStanding;
  className?: string;
}

export function TeamStandingsCard({ team, className }: TeamStandingsCardProps) {
  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <TrophyIcon className="w-4 h-4" />;
    }
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.3)]';
    if (rank === 2) return 'border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.2)]';
    if (rank === 3) return 'border-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.2)]';
    return 'border-retro-green';
  };

  return (
    <Link href={`/team/${team.teamId}`}>
      <Card
        className={cn(
          'border-4 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer group',
          getRankColor(team.rank),
          className
        )}
      >
        <CardHeader className="pb-3">
          {/* Rank and Team Info */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={getRankBadgeVariant(team.rank)}
                className={cn(
                  'font-press-start text-xs px-2 py-1 flex items-center gap-1',
                  team.rank === 1 &&
                    'bg-retro-yellow text-black border-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]',
                  team.rank === 2 && 'bg-gray-400 text-black border-gray-400',
                  team.rank === 3 && 'bg-amber-700 text-white border-amber-700'
                )}
              >
                {getRankIcon(team.rank)}
                <span>#{team.rank}</span>
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="font-press-start text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 truncate max-w-[80px] bg-retro-green/20 text-retro-green border-retro-green"
            >
              {team.abbrev}
            </Badge>
          </div>

          {/* Team Name */}
          <div className="mt-3">
            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-retro-yellow transition-colors line-clamp-2">
              {team.teamName}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-1">{team.owner}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Primary Stat - True Record */}
          <div className="bg-retro-green/10 border-2 border-retro-green/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono uppercase">True Record</span>
              <TrendingUpIcon className="w-3 h-3 text-retro-green" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">
                {team.wins}-{team.losses}
              </span>
              <span className="text-lg text-retro-yellow font-mono">
                {(team.winPercentage * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Average Points */}
            <div className="bg-black/40 border border-retro-green/20 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Avg Pts</div>
              <div className="text-lg font-bold text-gray-300 font-mono">
                {team.averagePoints.toFixed(1)}
              </div>
            </div>

            {/* Total Points */}
            <div className="bg-black/40 border border-retro-green/20 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Total</div>
              <div className="text-lg font-bold text-retro-green font-mono">
                {team.totalPoints.toFixed(0)}
              </div>
            </div>
          </div>

          {/* View Details Link */}
          <div className="text-center pt-2 border-t border-retro-green/20">
            <span className="text-xs text-retro-green group-hover:text-retro-yellow transition-colors font-press-start">
              VIEW DETAILS →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
