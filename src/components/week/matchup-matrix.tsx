'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3x3, Info } from 'lucide-react';
import Link from 'next/link';

interface MatchupResult {
  week: number;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  winner: string;
}

interface ScoreEntry {
  teamId: string;
  teamName: string;
  owner: string;
  abbrev: string;
  score: number;
  rank: number;
}

interface MatchupMatrixProps {
  matchupMatrix: MatchupResult[];
  scores: ScoreEntry[];
  week: number;
}

export function MatchupMatrix({ matchupMatrix, scores, week }: MatchupMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ team1: string; team2: string } | null>(
    null
  );

  // Create a lookup map for scores
  const scoreMap = new Map(scores.map((s) => [s.teamId, s]));

  // Create a map for quick matchup lookup
  const matchupMap = new Map<string, MatchupResult>();
  matchupMatrix.forEach((matchup) => {
    const key1 = `${matchup.team1Id}-${matchup.team2Id}`;
    const key2 = `${matchup.team2Id}-${matchup.team1Id}`;
    matchupMap.set(key1, matchup);
    matchupMap.set(key2, matchup);
  });

  // Sort teams by rank for consistent display
  const sortedTeams = [...scores].sort((a, b) => a.rank - b.rank);

  const getMatchupResult = (team1Id: string, team2Id: string): MatchupResult | null => {
    if (team1Id === team2Id) return null;
    return matchupMap.get(`${team1Id}-${team2Id}`) || null;
  };

  const getCellContent = (team1Id: string, team2Id: string) => {
    if (team1Id === team2Id) {
      return { type: 'self', text: '-', className: 'bg-muted/50' };
    }

    const matchup = getMatchupResult(team1Id, team2Id);
    if (!matchup) {
      return { type: 'none', text: '-', className: 'bg-muted/20' };
    }

    const isTeam1 = matchup.team1Id === team1Id;
    const teamScore = isTeam1 ? matchup.team1Score : matchup.team2Score;
    const opponentScore = isTeam1 ? matchup.team2Score : matchup.team1Score;

    const isWin = matchup.winner === team1Id;
    const isTie = matchup.winner === 'tie';

    if (isTie) {
      return {
        type: 'tie',
        text: 'T',
        className: 'bg-muted/30 text-muted-foreground',
        score: `${teamScore.toFixed(1)} - ${opponentScore.toFixed(1)}`,
      };
    }

    return {
      type: isWin ? 'win' : 'loss',
      text: isWin ? 'W' : 'L',
      className: isWin
        ? 'bg-primary/20 text-primary font-bold'
        : 'bg-destructive/20 text-destructive',
      score: `${teamScore.toFixed(1)} - ${opponentScore.toFixed(1)}`,
    };
  };

  return (
    <Card className="retro-card bg-background/95">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl uppercase tracking-wider flex items-center gap-2">
          <Grid3x3 className="h-6 w-6 text-primary" />
          Hypothetical Matchup Matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Shows what would happen if each team played every other team this week.
            Hover over cells for scores.
          </span>
        </p>
      </CardHeader>
      <CardContent>
        {/* Desktop View - Full Matrix */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="border border-primary/50 rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="border border-primary/30 p-2 text-primary font-bold sticky left-0 bg-primary/10 z-10">
                      Team
                    </th>
                    {sortedTeams.map((team) => (
                      <th
                        key={team.teamId}
                        className="border border-primary/30 p-2 text-primary font-bold text-center min-w-[3rem]"
                        title={team.teamName}
                      >
                        {team.abbrev}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((rowTeam) => (
                    <tr key={rowTeam.teamId} className="hover:bg-primary/5">
                      <td className="border border-primary/30 p-2 font-bold sticky left-0 bg-background/95 z-10">
                        <Link
                          href={`/team/${rowTeam.teamId}`}
                          className="hover:text-primary transition-colors block truncate max-w-[150px]"
                          title={rowTeam.teamName}
                        >
                          {rowTeam.abbrev}
                        </Link>
                      </td>
                      {sortedTeams.map((colTeam) => {
                        const cellData = getCellContent(rowTeam.teamId, colTeam.teamId);
                        const isHovered =
                          hoveredCell?.team1 === rowTeam.teamId &&
                          hoveredCell?.team2 === colTeam.teamId;

                        return (
                          <td
                            key={colTeam.teamId}
                            className={`border border-primary/30 p-2 text-center font-bold transition-all ${cellData.className} ${
                              isHovered ? 'ring-2 ring-primary scale-110' : ''
                            }`}
                            onMouseEnter={() =>
                              setHoveredCell({ team1: rowTeam.teamId, team2: colTeam.teamId })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            title={cellData.score || undefined}
                          >
                            {cellData.text}
                            {isHovered && cellData.score && (
                              <div className="absolute bg-background border-2 border-primary p-2 rounded-md shadow-lg text-xs whitespace-nowrap z-20 -mt-10 left-1/2 transform -translate-x-1/2">
                                {cellData.score}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View - List Format */}
        <div className="lg:hidden space-y-4">
          {sortedTeams.map((team) => {
            const wins = sortedTeams.filter(
              (opponent) =>
                opponent.teamId !== team.teamId &&
                getMatchupResult(team.teamId, opponent.teamId)?.winner === team.teamId
            ).length;
            const losses = sortedTeams.filter(
              (opponent) =>
                opponent.teamId !== team.teamId &&
                getMatchupResult(team.teamId, opponent.teamId)?.winner === opponent.teamId
            ).length;
            const ties = sortedTeams.filter(
              (opponent) =>
                opponent.teamId !== team.teamId &&
                getMatchupResult(team.teamId, opponent.teamId)?.winner === 'tie'
            ).length;

            return (
              <div
                key={team.teamId}
                className="border border-primary/50 rounded-md p-4 bg-background/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      href={`/team/${team.teamId}`}
                      className="font-bold text-base hover:text-primary transition-colors"
                    >
                      {team.teamName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{team.owner}</div>
                    <div className="text-sm mt-1">
                      Score: <span className="font-bold text-primary">{team.score.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="retro-button">
                    #{team.rank}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Record:</span>
                    <span className="font-bold">
                      {wins}-{losses}
                      {ties > 0 && `-${ties}`}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/20 text-primary text-xs px-2 py-0.5">
                      {wins}W
                    </Badge>
                    <Badge variant="outline" className="bg-destructive/20 text-destructive text-xs px-2 py-0.5">
                      {losses}L
                    </Badge>
                    {ties > 0 && (
                      <Badge variant="outline" className="bg-muted/30 text-xs px-2 py-0.5">
                        {ties}T
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-primary/30 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 border border-primary/50 rounded flex items-center justify-center font-bold text-primary">
              W
            </div>
            <span className="text-muted-foreground">Win</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-destructive/20 border border-primary/50 rounded flex items-center justify-center font-bold text-destructive">
              L
            </div>
            <span className="text-muted-foreground">Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted/30 border border-primary/50 rounded flex items-center justify-center font-bold text-muted-foreground">
              T
            </div>
            <span className="text-muted-foreground">Tie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted/50 border border-primary/50 rounded flex items-center justify-center text-muted-foreground">
              -
            </div>
            <span className="text-muted-foreground">Same Team</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
