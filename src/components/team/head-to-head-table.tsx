'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HeadToHeadTableProps {
  headToHead: Array<{
    opponentId: string;
    opponentName: string;
    opponentOwner: string;
    wins: number;
    losses: number;
    ties: number;
    winPercentage: number;
  }>;
  teamName: string;
}

type SortField = 'name' | 'wins' | 'losses' | 'winPercentage';
type SortDirection = 'asc' | 'desc';

export function HeadToHeadTable({ headToHead, teamName }: HeadToHeadTableProps) {
  const [sortField, setSortField] = useState<SortField>('winPercentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort data
  const sortedData = [...headToHead].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'name':
        aValue = a.opponentName;
        bValue = b.opponentName;
        break;
      case 'wins':
        aValue = a.wins;
        bValue = b.wins;
        break;
      case 'losses':
        aValue = a.losses;
        bValue = b.losses;
        break;
      case 'winPercentage':
        aValue = a.winPercentage;
        bValue = b.winPercentage;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Calculate totals
  const totalWins = headToHead.reduce((sum, h) => sum + h.wins, 0);
  const totalLosses = headToHead.reduce((sum, h) => sum + h.losses, 0);
  const totalGames = totalWins + totalLosses;
  const overallWinPct = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:underline"
    >
      {children}
      {sortField === field && (
        <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );

  return (
    <Card className="retro-card border-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold pixel-font">
          HEAD-TO-HEAD RECORDS
        </CardTitle>
        <CardDescription>
          {teamName}&apos;s true record against each opponent
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-sm font-semibold text-muted-foreground">TOTAL WINS</div>
            <div className="text-2xl font-bold pixel-font text-green-600">
              {totalWins}
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-sm font-semibold text-muted-foreground">TOTAL LOSSES</div>
            <div className="text-2xl font-bold pixel-font text-red-600">
              {totalLosses}
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-sm font-semibold text-muted-foreground">WIN %</div>
            <div className="text-2xl font-bold pixel-font text-retro-green">
              {overallWinPct.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-sm font-semibold text-muted-foreground">OPPONENTS</div>
            <div className="text-2xl font-bold pixel-font">
              {headToHead.length}
            </div>
          </div>
        </div>

        {/* Head-to-Head Table */}
        <div className="rounded-md border-2 border-black overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-retro-green hover:bg-retro-green/90">
                <TableHead className="text-white font-bold border-r-2 border-black">
                  <SortButton field="name">OPPONENT</SortButton>
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  <SortButton field="wins">WINS</SortButton>
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  <SortButton field="losses">LOSSES</SortButton>
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  RECORD
                </TableHead>
                <TableHead className="text-white font-bold text-center">
                  <SortButton field="winPercentage">WIN %</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((opponent) => {
                const totalGames = opponent.wins + opponent.losses + opponent.ties;
                const winPct = (opponent.winPercentage * 100);
                const isDominating = winPct >= 70;
                const isStruggling = winPct < 30;

                return (
                  <TableRow
                    key={opponent.opponentId}
                    className="border-b-2 border-black hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-semibold border-r-2 border-black">
                      <div>
                        <div className="font-bold">{opponent.opponentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {opponent.opponentOwner}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="text-green-600 pixel-font text-lg">
                        {opponent.wins}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="text-red-600 pixel-font text-lg">
                        {opponent.losses}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="pixel-font">
                        {opponent.wins}-{opponent.losses}
                        {opponent.ties > 0 && `-${opponent.ties}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          isDominating
                            ? 'default'
                            : isStruggling
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={isDominating ? 'bg-green-600' : ''}
                      >
                        {winPct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-muted rounded-md border-2 border-black">
          <h3 className="font-bold text-lg mb-2 pixel-font">HEAD-TO-HEAD INSIGHTS</h3>
          <div className="space-y-2 text-sm">
            {(() => {
              const bestMatchup = headToHead.reduce((best, curr) =>
                curr.winPercentage > best.winPercentage ? curr : best
              );
              const worstMatchup = headToHead.reduce((worst, curr) =>
                curr.winPercentage < worst.winPercentage ? curr : worst
              );

              return (
                <>
                  <p>
                    <span className="font-semibold text-green-600">Best Matchup:</span>{' '}
                    {bestMatchup.opponentName} ({bestMatchup.wins}-{bestMatchup.losses},{' '}
                    {(bestMatchup.winPercentage * 100).toFixed(1)}%)
                  </p>
                  <p>
                    <span className="font-semibold text-red-600">Worst Matchup:</span>{' '}
                    {worstMatchup.opponentName} ({worstMatchup.wins}-{worstMatchup.losses},{' '}
                    {(worstMatchup.winPercentage * 100).toFixed(1)}%)
                  </p>
                  <p>
                    <span className="font-semibold">Dominant Record:</span>{' '}
                    {headToHead.filter((h) => h.winPercentage >= 0.7).length} opponent(s) with 70%+ win rate
                  </p>
                  <p>
                    <span className="font-semibold">Struggling Against:</span>{' '}
                    {headToHead.filter((h) => h.winPercentage < 0.3).length} opponent(s) with sub-30% win rate
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
