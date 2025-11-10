'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Calculate chart dimensions and data
  const maxScore = Math.max(...weeklyPerformance.map((w) => w.score));
  const minScore = Math.min(...weeklyPerformance.map((w) => w.score));
  const scoreRange = maxScore - minScore || 100; // Prevent division by zero
  const padding = scoreRange * 0.1; // 10% padding

  const chartHeight = 300;
  const chartWidth = 800;
  const chartPadding = { top: 20, right: 40, bottom: 40, left: 60 };
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;

  // Calculate scale factors
  const yMin = minScore - padding;
  const yMax = maxScore + padding;
  const yRange = yMax - yMin;

  // Generate points for the score line
  const scorePoints = weeklyPerformance.map((week, index) => {
    const x = chartPadding.left + (index / (weeklyPerformance.length - 1 || 1)) * innerWidth;
    const y = chartPadding.top + innerHeight - ((week.score - yMin) / yRange) * innerHeight;
    return { x, y, week };
  });

  // Create SVG path for the line
  const scorePath = scorePoints
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `L ${point.x},${point.y}`;
    })
    .join(' ');

  // Generate Y-axis labels (5 ticks)
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => {
    const value = yMin + (yRange / 4) * i;
    const y = chartPadding.top + innerHeight - ((value - yMin) / yRange) * innerHeight;
    return { value, y };
  });

  // Calculate average score for reference line
  const avgScore = weeklyPerformance.reduce((sum, w) => sum + w.score, 0) / weeklyPerformance.length;
  const avgY = chartPadding.top + innerHeight - ((avgScore - yMin) / yRange) * innerHeight;

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
        <div className="w-full overflow-x-auto">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="border-4 border-black bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            style={{ minWidth: `${chartWidth}px` }}
          >
            {/* Grid lines */}
            {yAxisTicks.map((tick, i) => (
              <line
                key={`grid-${i}`}
                x1={chartPadding.left}
                y1={tick.y}
                x2={chartWidth - chartPadding.right}
                y2={tick.y}
                stroke="#ddd"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Average line */}
            <line
              x1={chartPadding.left}
              y1={avgY}
              x2={chartWidth - chartPadding.right}
              y2={avgY}
              stroke="#2D5016"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
            <text
              x={chartWidth - chartPadding.right + 5}
              y={avgY + 4}
              fill="#2D5016"
              fontSize="12"
              fontWeight="bold"
            >
              AVG
            </text>

            {/* Score line */}
            <path
              d={scorePath}
              fill="none"
              stroke="#2D5016"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {scorePoints.map((point, index) => {
              const week = weeklyPerformance[index];
              const totalGames = week.wins + week.losses;
              const winPct = totalGames > 0 ? (week.wins / totalGames) * 100 : 0;

              return (
                <g key={`point-${index}`}>
                  {/* Point circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill={winPct >= 50 ? '#22c55e' : '#ef4444'}
                    stroke="#000"
                    strokeWidth="2"
                  />
                  {/* Week label below */}
                  <text
                    x={point.x}
                    y={chartHeight - chartPadding.bottom + 20}
                    textAnchor="middle"
                    fill="#000"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    W{week.week}
                  </text>
                </g>
              );
            })}

            {/* Y-axis */}
            <line
              x1={chartPadding.left}
              y1={chartPadding.top}
              x2={chartPadding.left}
              y2={chartHeight - chartPadding.bottom}
              stroke="#000"
              strokeWidth="3"
            />

            {/* Y-axis labels */}
            {yAxisTicks.map((tick, i) => (
              <text
                key={`y-label-${i}`}
                x={chartPadding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fill="#000"
                fontSize="12"
                fontWeight="bold"
              >
                {tick.value.toFixed(0)}
              </text>
            ))}

            {/* X-axis */}
            <line
              x1={chartPadding.left}
              y1={chartHeight - chartPadding.bottom}
              x2={chartWidth - chartPadding.right}
              y2={chartHeight - chartPadding.bottom}
              stroke="#000"
              strokeWidth="3"
            />

            {/* Axis labels */}
            <text
              x={chartPadding.left - 45}
              y={chartHeight / 2}
              textAnchor="middle"
              fill="#000"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, ${chartPadding.left - 45}, ${chartHeight / 2})`}
            >
              POINTS
            </text>
            <text
              x={chartWidth / 2}
              y={chartHeight - 5}
              textAnchor="middle"
              fill="#000"
              fontSize="14"
              fontWeight="bold"
            >
              WEEK
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-black"></div>
            <span className="font-semibold">Winning Week (&gt;50% wins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-black"></div>
            <span className="font-semibold">Losing Week (&lt;50% wins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-retro-green border-dashed"></div>
            <span className="font-semibold">Season Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
