import { WeeklyScores } from './espn-api';
import type { TrueRecord, WeeklyRecord } from '@/types';

/**
 * Calculate true records for a single week
 * Each team is compared against all other teams
 * @param weeklyScores - Object mapping team IDs to scores for the week
 * @returns Object mapping team IDs to their weekly W-L record
 */
export function calculateWeeklyTrueRecords(
  weeklyScores: WeeklyScores
): Record<string, WeeklyRecord> {
  const teamIds = Object.keys(weeklyScores);
  const weeklyRecords: Record<string, WeeklyRecord> = {};

  // Initialize records for each team
  teamIds.forEach((teamId) => {
    weeklyRecords[teamId] = { wins: 0, losses: 0 };
  });

  // Compare each team against all other teams
  for (let i = 0; i < teamIds.length; i++) {
    const teamA = teamIds[i];
    const scoreA = weeklyScores[teamA];

    for (let j = 0; j < teamIds.length; j++) {
      // Don't compare team against itself
      if (i === j) continue;

      const teamB = teamIds[j];
      const scoreB = weeklyScores[teamB];

      // Record win or loss
      if (scoreA > scoreB) {
        weeklyRecords[teamA].wins++;
      } else if (scoreA < scoreB) {
        weeklyRecords[teamA].losses++;
      }
      // Ties are ignored in this implementation
    }
  }

  return weeklyRecords;
}

/**
 * Calculate cumulative true records across multiple weeks
 * @param allWeeklyScores - Array of weekly score objects
 * @returns Object mapping team IDs to their cumulative true records
 */
export function calculateSeasonTrueRecords(
  allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>
): Record<string, TrueRecord> {
  const seasonRecords: Record<string, TrueRecord> = {};

  // Process each week
  for (const { week, scores } of allWeeklyScores) {
    const weeklyRecords = calculateWeeklyTrueRecords(scores);

    // Add weekly records to season totals
    Object.entries(weeklyRecords).forEach(([teamId, weekRecord]) => {
      if (!seasonRecords[teamId]) {
        seasonRecords[teamId] = {
          teamId: parseInt(teamId),
          wins: 0,
          losses: 0,
          weeklyRecords: {},
        };
      }

      // Add weekly wins/losses to season total
      seasonRecords[teamId].wins += weekRecord.wins;
      seasonRecords[teamId].losses += weekRecord.losses;

      // Store weekly record
      seasonRecords[teamId].weeklyRecords[week] = weekRecord;
    });
  }

  return seasonRecords;
}

/**
 * Calculate statistics for a team's true record
 * @param trueRecord - The team's true record
 * @returns Calculated statistics
 */
export function calculateRecordStats(trueRecord: TrueRecord) {
  const totalGames = trueRecord.wins + trueRecord.losses;
  const winPercentage = totalGames > 0 ? trueRecord.wins / totalGames : 0;

  return {
    totalGames,
    winPercentage,
    winPercentageFormatted: (winPercentage * 100).toFixed(1) + '%',
  };
}

/**
 * Calculate average points per week for a team
 * @param allWeeklyScores - Array of weekly score objects
 * @param teamId - The team ID
 * @returns Average points per week
 */
export function calculateAveragePoints(
  allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>,
  teamId: string
): number {
  let totalPoints = 0;
  let weeksPlayed = 0;

  for (const { scores } of allWeeklyScores) {
    if (scores[teamId] !== undefined) {
      totalPoints += scores[teamId];
      weeksPlayed++;
    }
  }

  return weeksPlayed > 0 ? totalPoints / weeksPlayed : 0;
}

/**
 * Calculate consistency score (standard deviation of weekly scores)
 * Lower is more consistent
 * @param allWeeklyScores - Array of weekly score objects
 * @param teamId - The team ID
 * @returns Standard deviation of scores
 */
export function calculateConsistency(
  allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>,
  teamId: string
): number {
  const scores: number[] = [];

  for (const { scores: weekScores } of allWeeklyScores) {
    if (weekScores[teamId] !== undefined) {
      scores.push(weekScores[teamId]);
    }
  }

  if (scores.length === 0) return 0;

  // Calculate mean
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Calculate variance
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;

  // Return standard deviation
  return Math.sqrt(variance);
}

/**
 * Rank teams by their true records
 * @param trueRecords - Object mapping team IDs to true records
 * @returns Array of team IDs sorted by record (best to worst)
 */
export function rankTeamsByTrueRecord(
  trueRecords: Record<string, TrueRecord>
): Array<{ teamId: string; rank: number; record: TrueRecord }> {
  const teams = Object.entries(trueRecords).map(([teamId, record]) => ({
    teamId,
    record,
    ...calculateRecordStats(record),
  }));

  // Sort by win percentage (descending), then by total wins
  teams.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) {
      return b.winPercentage - a.winPercentage;
    }
    return b.record.wins - a.record.wins;
  });

  // Add rank
  return teams.map((team, index) => ({
    teamId: team.teamId,
    rank: index + 1,
    record: team.record,
  }));
}

/**
 * Find the luckiest team (biggest positive differential between actual and true record)
 * @param actualRecords - Object mapping team IDs to actual W-L records
 * @param trueRecords - Object mapping team IDs to true records
 * @returns Team ID and differential
 */
export function findLuckiestTeam(
  actualRecords: Record<string, { wins: number; losses: number }>,
  trueRecords: Record<string, TrueRecord>
): { teamId: string; differential: number } | null {
  let maxDiff = -Infinity;
  let luckiestTeam: string | null = null;

  Object.keys(trueRecords).forEach((teamId) => {
    if (!actualRecords[teamId]) return;

    const actualWinPct =
      actualRecords[teamId].wins /
      (actualRecords[teamId].wins + actualRecords[teamId].losses);

    const trueWinPct =
      trueRecords[teamId].wins /
      (trueRecords[teamId].wins + trueRecords[teamId].losses);

    const diff = actualWinPct - trueWinPct;

    if (diff > maxDiff) {
      maxDiff = diff;
      luckiestTeam = teamId;
    }
  });

  if (luckiestTeam === null) return null;

  return {
    teamId: luckiestTeam,
    differential: maxDiff,
  };
}

/**
 * Find the unluckiest team (biggest negative differential between actual and true record)
 * @param actualRecords - Object mapping team IDs to actual W-L records
 * @param trueRecords - Object mapping team IDs to true records
 * @returns Team ID and differential
 */
export function findUnluckiestTeam(
  actualRecords: Record<string, { wins: number; losses: number }>,
  trueRecords: Record<string, TrueRecord>
): { teamId: string; differential: number } | null {
  let minDiff = Infinity;
  let unluckiestTeam: string | null = null;

  Object.keys(trueRecords).forEach((teamId) => {
    if (!actualRecords[teamId]) return;

    const actualWinPct =
      actualRecords[teamId].wins /
      (actualRecords[teamId].wins + actualRecords[teamId].losses);

    const trueWinPct =
      trueRecords[teamId].wins /
      (trueRecords[teamId].wins + trueRecords[teamId].losses);

    const diff = actualWinPct - trueWinPct;

    if (diff < minDiff) {
      minDiff = diff;
      unluckiestTeam = teamId;
    }
  });

  if (unluckiestTeam === null) return null;

  return {
    teamId: unluckiestTeam,
    differential: minDiff,
  };
}

/**
 * Find the most consistent team (lowest standard deviation)
 * @param allWeeklyScores - Array of weekly score objects
 * @param trueRecords - Object mapping team IDs to true records
 * @returns Team ID and consistency score
 */
export function findMostConsistentTeam(
  allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>,
  trueRecords: Record<string, TrueRecord>
): { teamId: string; consistency: number } | null {
  let lowestStdDev = Infinity;
  let mostConsistentTeam: string | null = null;

  Object.keys(trueRecords).forEach((teamId) => {
    const stdDev = calculateConsistency(allWeeklyScores, teamId);

    if (stdDev < lowestStdDev) {
      lowestStdDev = stdDev;
      mostConsistentTeam = teamId;
    }
  });

  if (mostConsistentTeam === null) return null;

  return {
    teamId: mostConsistentTeam,
    consistency: lowestStdDev,
  };
}

/**
 * Find the highest scoring team (best average)
 * @param allWeeklyScores - Array of weekly score objects
 * @param trueRecords - Object mapping team IDs to true records
 * @returns Team ID and average score
 */
export function findHighestScoringTeam(
  allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>,
  trueRecords: Record<string, TrueRecord>
): { teamId: string; averageScore: number } | null {
  let highestAverage = -Infinity;
  let highestScoringTeam: string | null = null;

  Object.keys(trueRecords).forEach((teamId) => {
    const average = calculateAveragePoints(allWeeklyScores, teamId);

    if (average > highestAverage) {
      highestAverage = average;
      highestScoringTeam = teamId;
    }
  });

  if (highestScoringTeam === null) return null;

  return {
    teamId: highestScoringTeam,
    averageScore: highestAverage,
  };
}

/**
 * True Champion Service Class
 * Manages the calculation and storage of true champion data
 */
export class TrueChampionService {
  /**
   * Process weekly data and calculate true records
   * @param weeklyScores - Scores for a specific week
   * @param week - Week number
   * @returns Calculated weekly true records
   */
  processWeeklyData(
    weeklyScores: WeeklyScores,
    week: number
  ): Record<string, WeeklyRecord> {
    return calculateWeeklyTrueRecords(weeklyScores);
  }

  /**
   * Recalculate all season records from weekly data
   * @param allWeeklyScores - Array of all weekly scores
   * @returns Complete season true records
   */
  recalculateSeasonRecords(
    allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>
  ): Record<string, TrueRecord> {
    return calculateSeasonTrueRecords(allWeeklyScores);
  }

  /**
   * Get comprehensive season statistics
   * @param allWeeklyScores - Array of all weekly scores
   * @param trueRecords - Calculated true records
   * @param actualRecords - Actual league records (optional)
   * @returns Complete statistics object
   */
  getSeasonStatistics(
    allWeeklyScores: Array<{ week: number; scores: WeeklyScores }>,
    trueRecords: Record<string, TrueRecord>,
    actualRecords?: Record<string, { wins: number; losses: number }>
  ) {
    const rankings = rankTeamsByTrueRecord(trueRecords);
    const mostConsistent = findMostConsistentTeam(allWeeklyScores, trueRecords);
    const highestScoring = findHighestScoringTeam(allWeeklyScores, trueRecords);

    const stats: any = {
      rankings,
      mostConsistent,
      highestScoring,
    };

    // Only calculate luck stats if actual records are provided
    if (actualRecords) {
      stats.luckiest = findLuckiestTeam(actualRecords, trueRecords);
      stats.unluckiest = findUnluckiestTeam(actualRecords, trueRecords);
    }

    return stats;
  }
}

// Export singleton instance
export const trueChampionService = new TrueChampionService();
