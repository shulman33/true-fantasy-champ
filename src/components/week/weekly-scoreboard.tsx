'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';

interface ScoreEntry {
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
  week: number;
  score: number;
  rank: number;
}

interface WeeklyScoreboardProps {
  scores: ScoreEntry[];
  week: number;
}

export function WeeklyScoreboard({ scores, week }: WeeklyScoreboardProps) {
  const [sortedScores] = useState<ScoreEntry[]>(() => {
    // Already sorted by rank from API, but ensure it
    return [...scores].sort((a, b) => a.rank - b.rank);
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-accent inline mr-1" />;
      case 2:
        return <Medal className="h-4 w-4 text-muted-foreground inline mr-1" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600 inline mr-1" />;
      default:
        return null;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="retro-card bg-background/95">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl uppercase tracking-wider flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Week {week} Scoreboard
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          All teams ranked by their weekly score
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile View - Card Layout */}
        <div className="md:hidden space-y-3">
          {sortedScores.map((entry) => {
            const wins = scores.length - entry.rank;
            const losses = entry.rank - 1;

            return (
              <Link key={entry.teamId} href={`/team/${entry.teamId}`}>
                <div
                  className={`border-2 rounded-lg p-3 transition-all hover:shadow-lg ${
                    entry.rank === 1
                      ? 'border-retro-yellow bg-retro-yellow/5'
                      : entry.rank === 2
                      ? 'border-gray-400 bg-gray-400/5'
                      : entry.rank === 3
                      ? 'border-amber-600 bg-amber-600/5'
                      : 'border-primary/30 bg-background/50'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <Badge
                        variant={getRankBadgeVariant(entry.rank)}
                        className={`font-press-start text-xs px-2 py-1 ${
                          entry.rank === 1
                            ? 'bg-retro-yellow text-black border-retro-yellow'
                            : entry.rank === 2
                            ? 'bg-gray-400 text-black border-gray-400'
                            : entry.rank === 3
                            ? 'bg-amber-600 text-white border-amber-600'
                            : ''
                        }`}
                      >
                        #{entry.rank}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10">
                      {entry.abbrev}
                    </Badge>
                  </div>

                  {/* Team Info */}
                  <div className="mb-2">
                    <h3 className="font-bold text-base line-clamp-1">{entry.teamName}</h3>
                    <p className="text-xs text-muted-foreground">Owner: {entry.owner}</p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                    <div>
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className="text-xl font-bold text-retro-green pixel-font">
                        {entry.score.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Record</div>
                      <div className="text-sm font-bold">
                        {wins}-{losses}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop View - Table Layout */}
        <div className="hidden md:block rounded-md border border-primary/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 border-primary/50 hover:bg-primary/20">
                <TableHead className="text-primary font-bold w-16 md:w-20">
                  Rank
                </TableHead>
                <TableHead className="text-primary font-bold">Team</TableHead>
                <TableHead className="text-primary font-bold">
                  Owner
                </TableHead>
                <TableHead className="text-primary font-bold text-right">
                  Score
                </TableHead>
                <TableHead className="text-primary font-bold text-right">
                  Record
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedScores.map((entry) => {
                const wins = scores.length - entry.rank;
                const losses = entry.rank - 1;

                return (
                  <TableRow
                    key={entry.teamId}
                    className={`border-primary/30 hover:bg-primary/5 transition-colors ${
                      entry.rank === 1 ? 'bg-accent/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-1">
                        {getRankIcon(entry.rank)}
                        <Badge
                          variant={getRankBadgeVariant(entry.rank)}
                          className="retro-button min-w-[2.5rem] justify-center"
                        >
                          {entry.rank}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Team Name */}
                    <TableCell>
                      <Link
                        href={`/team/${entry.teamId}`}
                        className="hover:text-primary transition-colors"
                      >
                        <div className="font-bold">{entry.teamName}</div>
                      </Link>
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="text-muted-foreground">
                      {entry.owner}
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-right font-bold text-xl">
                      <span className="text-primary">{entry.score.toFixed(2)}</span>
                    </TableCell>

                    {/* True Record for this week */}
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {wins}-{losses}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-primary/30 text-xs text-muted-foreground space-y-1">
          <p>
            <Trophy className="h-3 w-3 inline text-accent" /> Weekly champion
          </p>
          <p className="md:hidden">
            Tap cards to view detailed team performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
