'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PerformanceChartProps {
  weeklyPerformance: Array<{
    week: number;
    score: number;
    wins: number;
    losses: number;
    rank: number;
  }>;
}

export function PerformanceChart({ weeklyPerformance }: PerformanceChartProps) {
  if (weeklyPerformance.length === 0) {
    return null;
  }

  // Transform data for Recharts format
  const chartData = weeklyPerformance.map((week) => {
    const totalGames = week.wins + week.losses;
    const winPct = totalGames > 0 ? (week.wins / totalGames) * 100 : 0;
    return {
      week: week.week,
      score: week.score,
      wins: week.wins,
      losses: week.losses,
      winPct,
      isWinningWeek: winPct >= 50,
    };
  });

  // Calculate average score for reference line
  const avgScore = weeklyPerformance.reduce((sum, w) => sum + w.score, 0) / weeklyPerformance.length;

  // Custom dot component to color-code by win percentage
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const fillColor = payload.isWinningWeek ? '#22c55e' : '#ef4444';

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={fillColor}
        stroke="#000"
        strokeWidth={2}
      />
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-4 border-black p-3 shadow-lg text-black">
          <p className="font-bold text-sm mb-1 text-black">Week {data.week}</p>
          <p className="text-sm text-black">Score: <span className="font-bold">{data.score.toFixed(1)}</span></p>
          <p className="text-sm text-black">Record: <span className="font-bold">{data.wins}-{data.losses}</span></p>
          <p className="text-sm text-black">Win %: <span className="font-bold">{data.winPct.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="retro-card border-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold pixel-font">
          PERFORMANCE TREND
        </CardTitle>
        <CardDescription>
          Weekly scoring trends and consistency
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-white p-2 sm:p-4 rounded-lg border-4 border-black">
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: '500px', width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                >
              {/* Grid */}
              <CartesianGrid stroke="#ccc" strokeDasharray="4 4" />

              {/* X-Axis */}
              <XAxis
                dataKey="week"
                tickFormatter={(week) => `W${week}`}
                stroke="#000"
                tick={{ fill: '#000', fontSize: 12 }}
                height={40}
              />

              {/* Y-Axis */}
              <YAxis
                stroke="#000"
                tick={{ fill: '#000', fontSize: 12 }}
                width={60}
                label={{
                  value: 'POINTS',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '14px', fontWeight: 'bold', fill: '#000' },
                }}
              />

              {/* Tooltip */}
              <Tooltip content={<CustomTooltip />} />

              {/* Average line */}
              <ReferenceLine
                y={avgScore}
                stroke="#2D5016"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: 'AVG',
                  position: 'right',
                  fill: '#2D5016',
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
              />

              {/* Score line */}
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2D5016"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 8, stroke: '#000', strokeWidth: 2 }}
                animationDuration={800}
              />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 justify-center text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 shrink-0 rounded-full bg-green-500 border-2 border-black"></div>
            <span className="font-semibold">Winning Week (&gt;50% wins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 shrink-0 rounded-full bg-red-500 border-2 border-black"></div>
            <span className="font-semibold">Losing Week (&lt;50% wins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 shrink-0 bg-retro-green border-dashed"></div>
            <span className="font-semibold">Season Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
