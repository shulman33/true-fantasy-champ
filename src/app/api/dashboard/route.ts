import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import {
  calculateRecordStats,
  calculateAveragePoints,
  calculateConsistency,
  findLuckiestTeam,
  findUnluckiestTeam,
} from '@/services/true-champion';

/**
 * GET /api/dashboard
 * Returns comprehensive dashboard data including:
 * - True standings with team metadata
 * - Actual standings for comparison
 * - Key statistics (luckiest, unluckiest, most consistent, highest scoring)
 * - Last update timestamp
 */
export async function GET(request: NextRequest) {
  try {
    const season = parseInt(process.env.ESPN_SEASON || '2025');
    const leagueId = process.env.ESPN_LEAGUE_ID || '';

    // Fetch all required data in parallel
    const [trueRecords, teamMetadata, lastUpdate, actualStandings] = await Promise.all([
      redis.getAllTrueRecords(season),
      redis.getTeamMetadata(leagueId),
      redis.getLastUpdate(leagueId),
      redis.getActualStandings(season.toString()),
    ]);

    // Check if we have data
    if (!trueRecords || Object.keys(trueRecords).length === 0) {
      return NextResponse.json(
        {
          error: 'No standings data available. Please fetch data first.',
        },
        { status: 404 }
      );
    }

    // Get current week from true records
    const firstTeamId = Object.keys(trueRecords)[0];
    const weekNumbers = Object.keys(trueRecords[firstTeamId]?.weeklyRecords || {}).map(Number);
    const currentWeek = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 1;

    // Get all weekly scores for statistics
    const weeklyScoresData = await redis.getAllWeeklyScores(
      season.toString(),
      currentWeek
    );

    // Calculate true standings with metadata and statistics
    const standings = Object.entries(trueRecords)
      .map(([teamId, record]) => {
        const metadata = teamMetadata?.[teamId] || {
          name: `Team ${teamId}`,
          owner: `Owner ${teamId}`,
          abbrev: `T${teamId}`,
        };

        const stats = calculateRecordStats(record);
        const averagePoints = calculateAveragePoints(weeklyScoresData, teamId);
        const consistency = calculateConsistency(weeklyScoresData, teamId);

        // Calculate total points from weekly scores
        let totalPoints = 0;
        for (const { scores } of weeklyScoresData) {
          if (scores[teamId]) {
            totalPoints += scores[teamId];
          }
        }

        return {
          rank: 0, // Will be set after sorting
          teamId,
          teamName: metadata.name,
          owner: metadata.owner,
          abbrev: metadata.abbrev,
          wins: record.wins,
          losses: record.losses,
          winPercentage: stats.winPercentage,
          averagePoints,
          consistency,
          totalPoints,
          weeklyRecords: record.weeklyRecords,
        };
      })
      .sort((a, b) => {
        // Sort by win percentage (descending)
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        // If tied, sort by total wins
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        // If still tied, sort by average points
        return b.averagePoints - a.averagePoints;
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    // Find key statistics manually (simplified for now without actual records)
    let mostConsistentTeam = standings[0];
    let highestScoringTeam = standings[0];

    for (const team of standings) {
      if (team.consistency < mostConsistentTeam.consistency) {
        mostConsistentTeam = team;
      }
      if (team.averagePoints > highestScoringTeam.averagePoints) {
        highestScoringTeam = team;
      }
    }

    // Calculate luck stats if we have actual standings
    let luckiestStat = null;
    let unluckiestStat = null;

    console.log('[Dashboard API] actualStandings:', actualStandings ? `${actualStandings.length} teams` : 'null');

    if (actualStandings && actualStandings.length > 0) {
      // Convert actual standings array to the format expected by luck functions
      const actualRecordsMap: Record<string, { wins: number; losses: number }> = {};
      actualStandings.forEach((standing) => {
        actualRecordsMap[standing.teamId] = {
          wins: standing.wins,
          losses: standing.losses,
        };
      });

      // Find luckiest and unluckiest teams
      const luckiest = findLuckiestTeam(actualRecordsMap, trueRecords);
      const unluckiest = findUnluckiestTeam(actualRecordsMap, trueRecords);

      // Enrich with team metadata
      if (luckiest) {
        const teamMeta = teamMetadata?.[luckiest.teamId] || {
          name: `Team ${luckiest.teamId}`,
          owner: `Owner ${luckiest.teamId}`,
        };
        luckiestStat = {
          teamId: luckiest.teamId,
          teamName: teamMeta.name,
          owner: teamMeta.owner,
          differential: luckiest.differential,
        };
      }

      if (unluckiest) {
        const teamMeta = teamMetadata?.[unluckiest.teamId] || {
          name: `Team ${unluckiest.teamId}`,
          owner: `Owner ${unluckiest.teamId}`,
        };
        unluckiestStat = {
          teamId: unluckiest.teamId,
          teamName: teamMeta.name,
          owner: teamMeta.owner,
          differential: unluckiest.differential,
        };
      }
    }

    return NextResponse.json({
      season,
      standings,
      stats: {
        luckiest: luckiestStat,
        unluckiest: unluckiestStat,
        mostConsistent: {
          teamId: mostConsistentTeam.teamId,
          teamName: mostConsistentTeam.teamName,
          owner: mostConsistentTeam.owner,
          consistency: mostConsistentTeam.consistency,
        },
        highestScoring: {
          teamId: highestScoringTeam.teamId,
          teamName: highestScoringTeam.teamName,
          owner: highestScoringTeam.owner,
          averagePoints: highestScoringTeam.averagePoints,
        },
      },
      lastUpdate,
      currentWeek,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);

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
