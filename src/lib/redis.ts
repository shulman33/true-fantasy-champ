import { Redis } from '@upstash/redis';
import { REDIS_KEYS } from '@/constants';
import type {
  WeeklyScore,
  TrueRecord,
  TeamStanding,
  Team,
} from '@/types';

// Initialize Redis client as singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    // Use Redis.fromEnv() which automatically reads UPSTASH_REDIS_REST_URL
    // and UPSTASH_REDIS_REST_TOKEN from process.env
    redisClient = Redis.fromEnv({
      // Enable automatic command batching for better performance
      enableAutoPipelining: true,
      // Configure retry logic with exponential backoff
      retry: {
        retries: 5,
        backoff: (retryCount) => Math.exp(retryCount) * 50,
      },
      // Enable read-your-writes consistency (default: true)
      readYourWrites: true,
    });
  }

  return redisClient;
}

// Weekly Scores Operations
export async function setWeeklyScores(
  season: number | string,
  week: number,
  scores: Record<string, number>
): Promise<void> {
  const client = getRedisClient();
  const key = REDIS_KEYS.WEEKLY_SCORES(season.toString(), week);
  await client.set(key, JSON.stringify(scores));
}

export async function getWeeklyScores(
  season: number | string,
  week: number
): Promise<Record<string, number> | null> {
  const client = getRedisClient();
  const key = REDIS_KEYS.WEEKLY_SCORES(season.toString(), week);
  const data = await client.get<string>(key);
  return data ? JSON.parse(data) : null;
}

// True Records Operations
export async function setTrueRecord(
  season: number | string,
  teamId: string | number,
  record: TrueRecord
): Promise<void> {
  const client = getRedisClient();
  const key = REDIS_KEYS.TRUE_RECORDS(season.toString(), teamId.toString());
  await client.set(key, JSON.stringify(record));
}

export async function getTrueRecord(
  season: number | string,
  teamId: string | number
): Promise<TrueRecord | null> {
  const client = getRedisClient();
  const key = REDIS_KEYS.TRUE_RECORDS(season.toString(), teamId.toString());
  const data = await client.get<string>(key);
  return data ? JSON.parse(data) : null;
}

export async function getAllTrueRecords(season: number | string): Promise<Record<string, TrueRecord>> {
  const client = getRedisClient();
  const pattern = `true_records:${season}:*`;
  const keys = await client.keys(pattern);

  if (!keys || keys.length === 0) {
    return {};
  }

  // Use Promise.all to trigger auto-pipelining
  // All GET commands will be batched into a single HTTP request
  const records = await Promise.all(
    keys.map(async (key) => {
      const data = await client.get<string>(key);
      const teamId = key.split(':')[2]; // Extract team ID from key
      return { teamId, data: data ? JSON.parse(data) : null };
    })
  );

  // Convert array to object keyed by team ID
  const result: Record<string, TrueRecord> = {};
  records.forEach(({ teamId, data }) => {
    if (data) {
      result[teamId] = data;
    }
  });

  return result;
}

// Actual Standings Operations
export async function setActualStandings(
  season: string,
  standings: TeamStanding[]
): Promise<void> {
  const client = getRedisClient();
  const key = REDIS_KEYS.ACTUAL_STANDINGS(season);
  await client.set(key, JSON.stringify(standings));
}

export async function getActualStandings(
  season: string
): Promise<TeamStanding[] | null> {
  const client = getRedisClient();
  const key = REDIS_KEYS.ACTUAL_STANDINGS(season);
  const data = await client.get<string>(key);
  return data ? JSON.parse(data) : null;
}

// Team Metadata Operations
export async function setTeamMetadata(
  leagueId: string,
  teams: Record<string, Partial<Team>>
): Promise<void> {
  const client = getRedisClient();
  const key = REDIS_KEYS.TEAM_METADATA(leagueId);
  await client.set(key, JSON.stringify(teams));
}

export async function getTeamMetadata(
  leagueId: string
): Promise<Record<string, Partial<Team>> | null> {
  const client = getRedisClient();
  const key = REDIS_KEYS.TEAM_METADATA(leagueId);
  const data = await client.get<string>(key);
  return data ? JSON.parse(data) : null;
}

// Last Update Timestamp
export async function setLastUpdate(
  leagueId: string,
  timestamp: string | Date = new Date()
): Promise<void> {
  const client = getRedisClient();
  const key = REDIS_KEYS.LAST_UPDATE(leagueId);
  const isoString = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  await client.set(key, isoString);
}

export async function getLastUpdate(leagueId: string): Promise<string | null> {
  const client = getRedisClient();
  const key = REDIS_KEYS.LAST_UPDATE(leagueId);
  const data = await client.get<string>(key);
  return data;
}

// Bulk operations for all weeks
export async function setAllWeeklyScores(
  season: string,
  weeklyData: Array<{ week: number; scores: Record<string, number> }>
): Promise<void> {
  const client = getRedisClient();
  const pipeline = client.pipeline();

  weeklyData.forEach(({ week, scores }) => {
    const key = REDIS_KEYS.WEEKLY_SCORES(season, week);
    pipeline.set(key, JSON.stringify(scores));
  });

  await pipeline.exec();
}

export async function getAllWeeklyScores(
  season: string,
  maxWeek: number
): Promise<Array<{ week: number; scores: Record<string, number> }>> {
  const client = getRedisClient();

  // Use Promise.all to leverage auto-pipelining
  // All GET commands will be batched automatically
  const weekPromises = Array.from({ length: maxWeek }, (_, i) => {
    const week = i + 1;
    return getWeeklyScores(season, week).then(scores => ({ week, scores }));
  });

  const results = await Promise.all(weekPromises);

  // Filter out null scores
  return results.filter((result): result is { week: number; scores: Record<string, number> } =>
    result.scores !== null
  );
}

// Clear all data for a season (useful for testing)
export async function clearSeasonData(season: string): Promise<void> {
  const client = getRedisClient();
  const patterns = [
    `weekly_scores:${season}:*`,
    `true_records:${season}:*`,
    `actual_standings:${season}`,
  ];

  for (const pattern of patterns) {
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((key) => client.del(key)));
    }
  }
}

// Error handling wrapper
export async function withRedisErrorHandling<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

// Export all operations as a single object for easier imports
export const redis = {
  getClient: getRedisClient,
  setWeeklyScores,
  getWeeklyScores,
  setTrueRecord,
  getTrueRecord,
  getAllTrueRecords,
  setActualStandings,
  getActualStandings,
  setTeamMetadata,
  getTeamMetadata,
  setLastUpdate,
  getLastUpdate,
  setAllWeeklyScores,
  getAllWeeklyScores,
  clearSeasonData,
  withErrorHandling: withRedisErrorHandling,
};
