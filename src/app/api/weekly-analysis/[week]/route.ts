import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRedisClient } from '@/lib/redis';
import type { WeeklyScore, MatchupResult } from '@/types/team';

const WeekParamSchema = z.object({
  week: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 18;
  }, {
    message: 'Week must be a number between 1 and 18',
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ week: string }> }
) {
  try {
    // Await and validate params (Next.js 15 pattern)
    const resolvedParams = await params;
    const validation = WeekParamSchema.safeParse(resolvedParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid week parameter', details: validation.error.issues },
        { status: 400 }
      );
    }

    const weekNumber = parseInt(validation.data.week, 10);
    const season = process.env.ESPN_SEASON || '2025';
    const redis = getRedisClient();

    // Fetch weekly scores from Redis
    const weeklyScoresKey = `weekly_scores:${season}:${weekNumber}`;
    const weeklyScoresData = await redis.get<Record<string, number>>(weeklyScoresKey);

    if (!weeklyScoresData || Object.keys(weeklyScoresData).length === 0) {
      return NextResponse.json(
        { error: `No data available for week ${weekNumber}` },
        { status: 404 }
      );
    }

    // Fetch team metadata
    const leagueId = process.env.ESPN_LEAGUE_ID || '1044648461';
    const teamsKey = `teams:${leagueId}`;
    const teamsData = await redis.get<Record<string, { name: string; owner: string; abbrev: string }>>(teamsKey);

    // Transform scores into WeeklyScore array
    const scores: WeeklyScore[] = Object.entries(weeklyScoresData).map(([teamId, score]) => ({
      teamId,
      week: weekNumber,
      score,
    }));

    // Sort scores to calculate rankings
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);

    // Calculate statistics
    const scoreValues = scores.map(s => s.score);
    const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / scoreValues.length;

    const sortedScoreValues = [...scoreValues].sort((a, b) => a - b);
    const medianScore =
      sortedScoreValues.length % 2 === 0
        ? (sortedScoreValues[sortedScoreValues.length / 2 - 1] +
            sortedScoreValues[sortedScoreValues.length / 2]) /
          2
        : sortedScoreValues[Math.floor(sortedScoreValues.length / 2)];

    const highestScore = sortedScores[0];
    const lowestScore = sortedScores[sortedScores.length - 1];

    // Generate matchup matrix (all vs all)
    const matchupMatrix: MatchupResult[] = [];
    for (let i = 0; i < scores.length; i++) {
      for (let j = i + 1; j < scores.length; j++) {
        const team1 = scores[i];
        const team2 = scores[j];

        let winner: string;
        if (team1.score > team2.score) {
          winner = team1.teamId;
        } else if (team2.score > team1.score) {
          winner = team2.teamId;
        } else {
          winner = 'tie';
        }

        matchupMatrix.push({
          week: weekNumber,
          team1Id: team1.teamId,
          team2Id: team2.teamId,
          team1Score: team1.score,
          team2Score: team2.score,
          winner,
        });
      }
    }

    // Enrich scores with team metadata and rankings
    const enrichedScores = sortedScores.map((score, index) => {
      const teamMeta = teamsData?.[score.teamId];
      return {
        ...score,
        rank: index + 1,
        teamName: teamMeta?.name || `Team ${score.teamId}`,
        owner: teamMeta?.owner || 'Unknown',
        abbrev: teamMeta?.abbrev || score.teamId,
      };
    });

    // Enrich highest/lowest scores
    const highestScoreMeta = teamsData?.[highestScore.teamId];
    const lowestScoreMeta = teamsData?.[lowestScore.teamId];

    const response = {
      week: weekNumber,
      season: parseInt(season, 10),
      scores: enrichedScores,
      highestScore: {
        ...highestScore,
        teamName: highestScoreMeta?.name || `Team ${highestScore.teamId}`,
        owner: highestScoreMeta?.owner || 'Unknown',
      },
      lowestScore: {
        ...lowestScore,
        teamName: lowestScoreMeta?.name || `Team ${lowestScore.teamId}`,
        owner: lowestScoreMeta?.owner || 'Unknown',
      },
      averageScore: Math.round(averageScore * 100) / 100,
      medianScore: Math.round(medianScore * 100) / 100,
      matchupMatrix,
      totalTeams: scores.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching weekly analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly analysis data' },
      { status: 500 }
    );
  }
}
