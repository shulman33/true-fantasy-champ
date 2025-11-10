'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingDown, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface WeeklyStatsProps {
  highestScore: {
    teamId: string;
    teamName: string;
    owner: string;
    score: number;
  };
  lowestScore: {
    teamId: string;
    teamName: string;
    owner: string;
    score: number;
  };
  averageScore: number;
  medianScore: number;
  totalTeams: number;
}

export function WeeklyStats({
  highestScore,
  lowestScore,
  averageScore,
  medianScore,
  totalTeams,
}: WeeklyStatsProps) {
  const scoreDifference = highestScore.score - lowestScore.score;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Highest Score Card */}
      <Card className="retro-card bg-background/95 border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base uppercase tracking-wider">
            <Trophy className="h-5 w-5 text-accent" />
            Highest Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/team/${highestScore.teamId}`}
            className="block hover:text-primary transition-colors"
          >
            <div className="text-3xl md:text-4xl font-bold text-primary text-retro mb-2">
              {highestScore.score.toFixed(2)}
            </div>
            <div className="text-sm md:text-base text-foreground font-bold truncate">
              {highestScore.teamName}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground truncate">
              {highestScore.owner}
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Lowest Score Card */}
      <Card className="retro-card bg-background/95 border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base uppercase tracking-wider">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Lowest Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/team/${lowestScore.teamId}`}
            className="block hover:text-primary transition-colors"
          >
            <div className="text-3xl md:text-4xl font-bold text-destructive text-retro mb-2">
              {lowestScore.score.toFixed(2)}
            </div>
            <div className="text-sm md:text-base text-foreground font-bold truncate">
              {lowestScore.teamName}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground truncate">
              {lowestScore.owner}
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Average Score Card */}
      <Card className="retro-card bg-background/95 border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base uppercase tracking-wider">
            <Target className="h-5 w-5 text-primary" />
            Average Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl md:text-4xl font-bold text-foreground text-retro mb-2">
            {averageScore.toFixed(2)}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            Median: {medianScore.toFixed(2)}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {totalTeams} teams
          </div>
        </CardContent>
      </Card>

      {/* Biggest Blowout Card */}
      <Card className="retro-card bg-background/95 border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)] transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base uppercase tracking-wider">
            <BarChart3 className="h-5 w-5 text-accent" />
            Score Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl md:text-4xl font-bold text-accent text-retro mb-2">
            {scoreDifference.toFixed(2)}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            High to Low Difference
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {highestScore.score.toFixed(1)} - {lowestScore.score.toFixed(1)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
