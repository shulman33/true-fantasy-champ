import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import {
  calculateRecordStats,
  calculateAveragePoints,
  calculateConsistency,
} from '@/services/true-champion';

/**
 * GET /api/team/[teamId]
 * Returns detailed team data including:
 * - Team metadata (name, owner)
 * - True record with weekly breakdown
 * - Actual record (if available)
 * - Week-by-week performance
 * - Head-to-head records against each opponent
 * - Statistics (average, consistency, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const season = parseInt(process.env.ESPN_SEASON || '2025');
    const leagueId = process.env.ESPN_LEAGUE_ID || '';

    // Fetch all required data in parallel
    const [trueRecords, teamMetadata, actualStandings] = await Promise.all([
      redis.getAllTrueRecords(season),
      redis.getTeamMetadata(leagueId),
      redis.getActualStandings(season.toString()),
    ]);

    // Check if team exists
    if (!trueRecords || !trueRecords[teamId]) {
      return NextResponse.json(
        {
          error: `Team ${teamId} not found`,
        },
        { status: 404 }
      );
    }

    const teamRecord = trueRecords[teamId];
    const metadata = teamMetadata?.[teamId] || {
      name: `Team ${teamId}`,
      owner: `Owner ${teamId}`,
      abbrev: `T${teamId}`,
    };

    // Get current week from weekly records
    const weekNumbers = Object.keys(teamRecord.weeklyRecords).map(Number).sort((a, b) => a - b);
    const currentWeek = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 1;

    // Get all weekly scores for statistics and weekly breakdown
    const weeklyScoresData = await redis.getAllWeeklyScores(
      season.toString(),
      currentWeek
    );

    // Calculate statistics
    const stats = calculateRecordStats(teamRecord);
    const averagePoints = calculateAveragePoints(weeklyScoresData, teamId);
    const consistency = calculateConsistency(weeklyScoresData, teamId);

    // Build week-by-week performance breakdown
    const weeklyPerformance = weeklyScoresData.map(({ week, scores }) => {
      const score = scores[teamId] || 0;
      const weekRecord = teamRecord.weeklyRecords[week] || { wins: 0, losses: 0 };

      // Calculate rank for this week (how many teams scored higher)
      const teamScores = Object.values(scores);
      const rank = teamScores.filter(s => s > score).length + 1;

      return {
        week,
        score,
        wins: weekRecord.wins,
        losses: weekRecord.losses,
        rank,
        totalTeams: teamScores.length,
      };
    });

    // Calculate head-to-head records against each opponent
    const headToHead: Record<string, {
      opponentId: string;
      wins: number;
      losses: number;
      ties: number;
    }> = {};

    // Initialize head-to-head records for all opponents
    const allTeamIds = Object.keys(trueRecords).filter(id => id !== teamId);
    allTeamIds.forEach(opponentId => {
      headToHead[opponentId] = {
        opponentId,
        wins: 0,
        losses: 0,
        ties: 0,
      };
    });

    // Calculate head-to-head by comparing scores each week
    weeklyScoresData.forEach(({ week, scores }) => {
      const teamScore = scores[teamId];
      if (teamScore === undefined) return;

      allTeamIds.forEach(opponentId => {
        const opponentScore = scores[opponentId];
        if (opponentScore === undefined) return;

        if (teamScore > opponentScore) {
          headToHead[opponentId].wins++;
        } else if (teamScore < opponentScore) {
          headToHead[opponentId].losses++;
        } else {
          headToHead[opponentId].ties++;
        }
      });
    });

    // Enrich head-to-head with opponent metadata
    const headToHeadArray = Object.values(headToHead).map(record => {
      const opponentMeta = teamMetadata?.[record.opponentId] || {
        name: `Team ${record.opponentId}`,
        owner: `Owner ${record.opponentId}`,
        abbrev: `T${record.opponentId}`,
      };

      const totalGames = record.wins + record.losses + record.ties;
      const winPercentage = totalGames > 0 ? record.wins / totalGames : 0;

      return {
        ...record,
        opponentName: opponentMeta.name,
        opponentOwner: opponentMeta.owner,
        winPercentage,
      };
    }).sort((a, b) => b.winPercentage - a.winPercentage);

    // Get actual record for this team if available
    const actualRecord = actualStandings?.find(s => s.teamId === teamId);

    let actualRecordData = null;
    let recordDifferential = null;

    if (actualRecord) {
      const actualTotalGames = actualRecord.wins + actualRecord.losses + actualRecord.ties;
      const actualWinPct = actualTotalGames > 0 ? actualRecord.wins / actualTotalGames : 0;

      actualRecordData = {
        wins: actualRecord.wins,
        losses: actualRecord.losses,
        ties: actualRecord.ties,
        winPercentage: actualWinPct,
      };

      // Calculate differential between actual and true records
      recordDifferential = {
        wins: actualRecord.wins - teamRecord.wins,
        losses: actualRecord.losses - teamRecord.losses,
        winPercentage: actualWinPct - stats.winPercentage,
      };
    }

    // Calculate total points
    let totalPoints = 0;
    weeklyScoresData.forEach(({ scores }) => {
      if (scores[teamId]) {
        totalPoints += scores[teamId];
      }
    });

    return NextResponse.json({
      teamId,
      teamName: metadata.name,
      owner: metadata.owner,
      abbrev: metadata.abbrev,
      trueRecord: {
        wins: teamRecord.wins,
        losses: teamRecord.losses,
        winPercentage: stats.winPercentage,
        totalGames: stats.totalGames,
      },
      actualRecord: actualRecordData,
      recordDifferential,
      statistics: {
        averagePoints,
        consistency,
        totalPoints,
        weeksPlayed: weeklyPerformance.length,
      },
      weeklyPerformance,
      headToHead: headToHeadArray,
      season,
      currentWeek,
    });
  } catch (error) {
    console.error('Error fetching team data:', error);

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
