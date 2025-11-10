import { StatsCard } from './stats-card';
import { TrophyIcon, FrownIcon, ActivityIcon, TrendingUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamStat {
  teamId: string;
  teamName: string;
  owner?: string;
}

interface LuckyStat extends TeamStat {
  differential: number;
  actualWins: number;
  trueWins: number;
}

interface ConsistentStat extends TeamStat {
  consistency: number;
}

interface ScoringStats extends TeamStat {
  averagePoints: number;
}

interface StatsGridProps {
  luckiest?: LuckyStat | null;
  unluckiest?: LuckyStat | null;
  mostConsistent?: ConsistentStat | null;
  highestScoring?: ScoringStats | null;
  className?: string;
}

export function StatsGrid({
  luckiest,
  unluckiest,
  mostConsistent,
  highestScoring,
  className,
}: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
      {/* Luckiest Team */}
      <StatsCard
        title="Luckiest Team"
        value={luckiest ? luckiest.teamName : '---'}
        subtitle={luckiest ? luckiest.owner : undefined}
        description={
          luckiest
            ? `Schedule luck: +${luckiest.differential.toFixed(1)} wins vs true record`
            : 'Actual standings data needed to calculate luck'
        }
        variant="success"
        icon={<TrophyIcon />}
      />

      {/* Unluckiest Team */}
      <StatsCard
        title="Unluckiest Team"
        value={unluckiest ? unluckiest.teamName : '---'}
        subtitle={unluckiest ? unluckiest.owner : undefined}
        description={
          unluckiest
            ? `Schedule curse: ${unluckiest.differential.toFixed(1)} wins vs true record`
            : 'Actual standings data needed to calculate luck'
        }
        variant="destructive"
        icon={<FrownIcon />}
      />

      {/* Most Consistent */}
      <StatsCard
        title="Most Consistent"
        value={mostConsistent ? mostConsistent.teamName : '---'}
        subtitle={mostConsistent ? mostConsistent.owner : undefined}
        description={
          mostConsistent
            ? `Lowest variance: ±${mostConsistent.consistency.toFixed(1)} pts/week`
            : 'Calculating consistency metrics...'
        }
        variant="default"
        icon={<ActivityIcon />}
      />

      {/* Highest Scoring */}
      <StatsCard
        title="Highest Scoring"
        value={highestScoring ? highestScoring.teamName : '---'}
        subtitle={highestScoring ? highestScoring.owner : undefined}
        description={
          highestScoring
            ? `Average: ${highestScoring.averagePoints.toFixed(1)} pts/week`
            : 'Calculating scoring averages...'
        }
        variant="warning"
        icon={<TrendingUpIcon />}
      />
    </div>
  );
}
