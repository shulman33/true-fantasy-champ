import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TeamOverviewProps {
  teamData: {
    teamName: string;
    owner: string;
    abbrev: string;
    trueRecord: {
      wins: number;
      losses: number;
      winPercentage: number;
      totalGames: number;
    };
    actualRecord: {
      wins: number;
      losses: number;
      ties: number;
      winPercentage: number;
    } | null;
    recordDifferential: {
      wins: number;
      losses: number;
      winPercentage: number;
    } | null;
    statistics: {
      averagePoints: number;
      consistency: number;
      totalPoints: number;
      weeksPlayed: number;
    };
  };
}

export function TeamOverview({ teamData }: TeamOverviewProps) {
  const { teamName, owner, trueRecord, actualRecord, recordDifferential, statistics } = teamData;

  // Format win percentage
  const formatWinPct = (pct: number) => (pct * 100).toFixed(1) + '%';

  // Determine if team is lucky or unlucky
  const isLucky = recordDifferential && recordDifferential.winPercentage > 0.05;
  const isUnlucky = recordDifferential && recordDifferential.winPercentage < -0.05;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Team Info Card */}
      <Card className="retro-card border-4">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-xl md:text-2xl font-bold text-retro-green">
            {teamName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Owner: {owner}</p>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {/* True Record */}
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2">TRUE RECORD</h3>
            <div className="text-2xl md:text-3xl font-bold pixel-font">
              {trueRecord.wins}-{trueRecord.losses}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {formatWinPct(trueRecord.winPercentage)} Win Rate
            </p>
          </div>

          {/* Actual Record (if available) */}
          {actualRecord && (
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2">ACTUAL RECORD</h3>
              <div className="text-xl md:text-2xl font-bold">
                {actualRecord.wins}-{actualRecord.losses}
                {actualRecord.ties > 0 && `-${actualRecord.ties}`}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {formatWinPct(actualRecord.winPercentage)} Win Rate
              </p>
            </div>
          )}

          {/* Luck Indicator */}
          {recordDifferential && (
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2">LUCK INDEX</h3>
              <div className="flex items-center gap-2">
                {isLucky && (
                  <Badge variant="default" className="bg-green-600 text-xs md:text-sm">
                    Lucky (+{formatWinPct(recordDifferential.winPercentage)})
                  </Badge>
                )}
                {isUnlucky && (
                  <Badge variant="destructive" className="text-xs md:text-sm">
                    Unlucky ({formatWinPct(recordDifferential.winPercentage)})
                  </Badge>
                )}
                {!isLucky && !isUnlucky && (
                  <Badge variant="secondary" className="text-xs md:text-sm">
                    Neutral ({formatWinPct(recordDifferential.winPercentage)})
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Stats Card */}
      <Card className="retro-card border-4">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-base md:text-lg font-bold">SCORING STATS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">AVERAGE POINTS</h3>
            <div className="text-2xl md:text-3xl font-bold pixel-font text-retro-green">
              {statistics.averagePoints.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">per week</p>
          </div>

          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">TOTAL POINTS</h3>
            <div className="text-xl md:text-2xl font-bold">
              {statistics.totalPoints.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              across {statistics.weeksPlayed} weeks
            </p>
          </div>

          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">CONSISTENCY</h3>
            <div className="text-xl md:text-2xl font-bold">
              {statistics.consistency.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              standard deviation (lower is better)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Record Analysis Card */}
      <Card className="retro-card border-4 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-base md:text-lg font-bold">RECORD ANALYSIS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">TOTAL MATCHUPS</h3>
            <div className="text-2xl md:text-3xl font-bold pixel-font">
              {trueRecord.totalGames}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              hypothetical games played
            </p>
          </div>

          {actualRecord && recordDifferential && (
            <>
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">WIN DIFFERENTIAL</h3>
                <div className={`text-xl md:text-2xl font-bold ${recordDifferential.wins >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {recordDifferential.wins >= 0 ? '+' : ''}{recordDifferential.wins}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {recordDifferential.wins >= 0 ? 'more' : 'fewer'} wins than deserved
                </p>
              </div>

              <div>
                <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-1">SCHEDULE IMPACT</h3>
                <div className="text-xs md:text-sm">
                  {isLucky && (
                    <p className="text-green-600 font-semibold">
                      Benefited from favorable matchups
                    </p>
                  )}
                  {isUnlucky && (
                    <p className="text-red-600 font-semibold">
                      Hurt by tough schedule
                    </p>
                  )}
                  {!isLucky && !isUnlucky && (
                    <p className="text-muted-foreground">
                      Minimal schedule impact
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
