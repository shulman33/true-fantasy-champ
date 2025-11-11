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

interface WeeklyPerformanceTableProps {
  weeklyPerformance: Array<{
    week: number;
    score: number;
    wins: number;
    losses: number;
    rank: number;
    totalTeams: number;
  }>;
  teamName: string;
}

export function WeeklyPerformanceTable({ weeklyPerformance, teamName }: WeeklyPerformanceTableProps) {
  // Calculate average wins per week
  const avgWins = weeklyPerformance.reduce((sum, w) => sum + w.wins, 0) / weeklyPerformance.length;

  return (
    <Card className="retro-card border-4">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-lg md:text-2xl font-bold pixel-font">
          WEEK-BY-WEEK BREAKDOWN
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {teamName}&apos;s performance across all weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile: Card Layout */}
        <div className="md:hidden space-y-3">
          {weeklyPerformance.map((week) => {
            const totalGames = week.wins + week.losses;
            const winPct = totalGames > 0 ? (week.wins / totalGames) * 100 : 0;
            const isGreatWeek = winPct >= 75;
            const isPoorWeek = winPct < 40;

            return (
              <div
                key={week.week}
                className="bg-muted/50 rounded-md border-2 border-black p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="pixel-font text-lg font-bold">Week {week.week}</span>
                  <Badge
                    variant={week.rank <= 3 ? 'default' : 'secondary'}
                    className={`${week.rank <= 3 ? 'bg-retro-green' : ''} text-xs`}
                  >
                    #{week.rank} of {week.totalTeams}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-retro-green pixel-font font-bold text-sm">
                      {week.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Record</span>
                    <span className="pixel-font font-bold text-sm">
                      {week.wins}-{week.losses}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Win %</span>
                    <Badge
                      variant={
                        isGreatWeek
                          ? 'default'
                          : isPoorWeek
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={`${isGreatWeek ? 'bg-green-600' : ''} text-xs px-2 py-0.5`}
                    >
                      {winPct.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block rounded-md border-2 border-black overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-retro-green hover:bg-retro-green/90">
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  WEEK
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  SCORE
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  RANK
                </TableHead>
                <TableHead className="text-white font-bold text-center border-r-2 border-black">
                  TRUE W-L
                </TableHead>
                <TableHead className="text-white font-bold text-center">
                  WIN %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyPerformance.map((week) => {
                const totalGames = week.wins + week.losses;
                const winPct = totalGames > 0 ? (week.wins / totalGames) * 100 : 0;

                // Determine if this was a good or bad week
                const isGreatWeek = winPct >= 75;
                const isPoorWeek = winPct < 40;

                return (
                  <TableRow
                    key={week.week}
                    className="border-b-2 border-black hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="pixel-font text-lg">
                        {week.week}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="text-retro-green pixel-font text-lg">
                        {week.score.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-black">
                      <Badge
                        variant={week.rank <= 3 ? 'default' : 'secondary'}
                        className={week.rank <= 3 ? 'bg-retro-green' : ''}
                      >
                        #{week.rank} of {week.totalTeams}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold border-r-2 border-black">
                      <span className="pixel-font text-lg">
                        {week.wins}-{week.losses}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          isGreatWeek
                            ? 'default'
                            : isPoorWeek
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={isGreatWeek ? 'bg-green-600' : ''}
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

        {/* Summary Stats */}
        <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-2 md:p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-xs md:text-sm font-semibold text-muted-foreground">AVG SCORE</div>
            <div className="text-base md:text-xl font-bold pixel-font text-retro-green">
              {(weeklyPerformance.reduce((sum, w) => sum + w.score, 0) / weeklyPerformance.length).toFixed(2)}
            </div>
          </div>
          <div className="text-center p-2 md:p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-xs md:text-sm font-semibold text-muted-foreground">AVG WINS</div>
            <div className="text-base md:text-xl font-bold pixel-font">
              {avgWins.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-2 md:p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-xs md:text-sm font-semibold text-muted-foreground">BEST WEEK</div>
            <div className="text-base md:text-xl font-bold pixel-font">
              Week {weeklyPerformance.reduce((best, w) => w.score > best.score ? w : best).week}
            </div>
          </div>
          <div className="text-center p-2 md:p-3 bg-muted rounded-md border-2 border-black">
            <div className="text-xs md:text-sm font-semibold text-muted-foreground">WORST WEEK</div>
            <div className="text-base md:text-xl font-bold pixel-font">
              Week {weeklyPerformance.reduce((worst, w) => w.score < worst.score ? w : worst).week}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
