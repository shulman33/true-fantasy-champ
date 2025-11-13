import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { espnApi } from '@/services/espn-api';
import { getWeeklyScores, setWeeklyScores } from '@/lib/redis';

// Validate week parameter
const WeekParamSchema = z.object({
  week: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 18) {
      throw new Error('Week must be between 1 and 18');
    }
    return num;
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ week: string }> }
) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;

    // Validate week parameter
    const { week } = WeekParamSchema.parse(resolvedParams);

    // Try to get from cache first
    const cacheKey = `weekly_scores:${process.env.ESPN_SEASON}:${week}`;
    const cached = await getWeeklyScores(
      parseInt(process.env.ESPN_SEASON || '2025'),
      week
    );

    if (cached && Object.keys(cached).length > 0) {
      return NextResponse.json({
        week,
        scores: cached,
        source: 'cache',
      });
    }

    // If not in cache, fetch from ESPN API
    const scores = await espnApi.getWeeklyScores(week);

    // Store in cache
    await setWeeklyScores(
      parseInt(process.env.ESPN_SEASON || '2025'),
      week,
      scores
    );

    return NextResponse.json({
      week,
      scores,
      source: 'espn',
    });
  } catch (error) {
    console.error('Error fetching weekly scores:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid week parameter',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
