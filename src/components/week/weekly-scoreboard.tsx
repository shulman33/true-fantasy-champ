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
        <div className="rounded-md border border-primary/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 border-primary/50 hover:bg-primary/20">
                <TableHead className="text-primary font-bold w-16 md:w-20">
                  Rank
                </TableHead>
                <TableHead className="text-primary font-bold">Team</TableHead>
                <TableHead className="text-primary font-bold hidden md:table-cell">
                  Owner
                </TableHead>
                <TableHead className="text-primary font-bold text-right">
                  Score
                </TableHead>
                <TableHead className="text-primary font-bold text-right hidden sm:table-cell">
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
                        <div className="font-bold text-sm md:text-base">
                          {entry.teamName}
                        </div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {entry.owner}
                        </div>
                      </Link>
                    </TableCell>

                    {/* Owner (hidden on mobile) */}
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {entry.owner}
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-right font-bold text-lg md:text-xl">
                      <span className="text-primary">{entry.score.toFixed(2)}</span>
                    </TableCell>

                    {/* True Record for this week (hidden on mobile) */}
                    <TableCell className="text-right hidden sm:table-cell">
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

        {/* Mobile-friendly legend */}
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>
            <Trophy className="h-3 w-3 inline text-accent" /> Weekly champion
          </p>
          <p className="sm:hidden">
            Tap team names to view detailed performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
