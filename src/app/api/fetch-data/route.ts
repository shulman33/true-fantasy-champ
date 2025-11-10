import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { espnApi } from '@/services/espn-api';
import { redis } from '@/lib/redis';

// Request body schema
const FetchDataRequestSchema = z.object({
  week: z.number().min(1).max(18).optional(),
  forceRefresh: z.boolean().optional().default(false),
});

/**
 * POST /api/fetch-data
 * Manually trigger data refresh from ESPN API
 * Body: { week?: number, forceRefresh?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { week, forceRefresh } = FetchDataRequestSchema.parse(body);

    const season = parseInt(process.env.ESPN_SEASON || '2025');
    let targetWeek = week;

    // If no week specified, get current week
    if (!targetWeek) {
      targetWeek = await espnApi.getCurrentWeek();
    }

    // Check if we need to refresh
    if (!forceRefresh) {
      const cached = await redis.getWeeklyScores(season, targetWeek);
      if (cached && Object.keys(cached).length > 0) {
        return NextResponse.json({
          message: 'Data already up to date',
          week: targetWeek,
          scores: cached,
          refreshed: false,
        });
      }
    }

    // Fetch from ESPN API
    const scores = await espnApi.getWeeklyScores(targetWeek);

    // Store in Redis
    await redis.setWeeklyScores(season, targetWeek, scores);

    // Update last update timestamp
    await redis.setLastUpdate(
      process.env.ESPN_LEAGUE_ID || '',
      new Date().toISOString()
    );

    return NextResponse.json({
      message: 'Data refreshed successfully',
      week: targetWeek,
      scores,
      refreshed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in fetch-data endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
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

/**
 * GET /api/fetch-data
 * Get information about the last data refresh
 */
export async function GET(request: NextRequest) {
  try {
    const leagueId = process.env.ESPN_LEAGUE_ID || '';
    const lastUpdate = await redis.getLastUpdate(leagueId);
    const currentWeek = await espnApi.getCurrentWeek();

    return NextResponse.json({
      lastUpdate,
      currentWeek,
      season: process.env.ESPN_SEASON,
      leagueId,
    });
  } catch (error) {
    console.error('Error getting fetch-data info:', error);

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
