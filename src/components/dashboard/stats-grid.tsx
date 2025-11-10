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
        tooltipContent="Compares actual vs true win percentages. This team's actual record is better than if they played everyone each week—they've benefited from favorable scheduling! Calculated as: (actual wins ÷ total games) - (true wins ÷ total matchups)"
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
        tooltipContent="This team has the biggest negative win differential. Their actual win percentage is lower than their true record—they've had tough luck with their schedule and would have more wins if they played everyone each week."
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
        tooltipContent="Calculated using standard deviation of weekly scores. Lower values mean more predictable scoring week-to-week. Formula: √(Σ(score - mean)² ÷ weeks played). Lower is better!"
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
        tooltipContent="Simple average of all weekly point totals. Formula: total points ÷ weeks played. This team puts up the biggest numbers on average!"
      />
    </div>
  );
}
