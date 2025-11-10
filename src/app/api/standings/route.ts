import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

/**
 * GET /api/standings
 * Returns current true standings for all teams
 */
export async function GET(request: NextRequest) {
  try {
    const season = parseInt(process.env.ESPN_SEASON || '2025');

    // Get all true records for the season
    const trueRecords = await redis.getAllTrueRecords(season);

    if (!trueRecords || Object.keys(trueRecords).length === 0) {
      return NextResponse.json(
        {
          error: 'No standings data available. Please fetch data first.',
        },
        { status: 404 }
      );
    }

    // Calculate win percentages and sort by record
    const standings = Object.entries(trueRecords)
      .map(([teamId, record]) => ({
        teamId: parseInt(teamId),
        wins: record.wins,
        losses: record.losses,
        winPercentage:
          record.wins + record.losses > 0
            ? record.wins / (record.wins + record.losses)
            : 0,
        weeklyRecords: record.weeklyRecords,
      }))
      .sort((a, b) => {
        // Sort by win percentage (descending)
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        // If tied, sort by total wins
        return b.wins - a.wins;
      });

    // Get last update time
    const lastUpdate = await redis.getLastUpdate(
      process.env.ESPN_LEAGUE_ID || ''
    );

    return NextResponse.json({
      season,
      standings,
      lastUpdate,
    });
  } catch (error) {
    console.error('Error fetching standings:', error);

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
