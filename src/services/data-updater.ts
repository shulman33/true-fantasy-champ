/**
 * Data Updater Service
 * Handles fetching ESPN data and updating Redis cache
 * Shared logic used by cron jobs, API endpoints, and scripts
 */

import { ESPNApiService } from './espn-api';
import { trueChampionService } from './true-champion';
import { redis } from '../lib/redis';

export interface UpdateOptions {
  maxWeek?: number; // Auto-detect current week if not provided
  forceRefresh?: boolean; // Bypass any caching
  onProgress?: (message: string) => void; // Progress callback for logging
}

export interface UpdateResult {
  success: boolean;
  weeksProcessed: number;
  teamsUpdated: number;
  errors: string[];
  duration: number;
  lastUpdate: string;
}

/**
 * Updates all ESPN data for the current season
 * Follows the same flow as scripts/populate-espn-data.ts
 */
export async function updateAllData(
  options: UpdateOptions = {}
): Promise<UpdateResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let weeksProcessed = 0;
  let teamsUpdated = 0;

  const season = process.env.ESPN_SEASON || '2025';
  const leagueId = process.env.ESPN_LEAGUE_ID || '1044648461';

  const log = (message: string) => {
    console.log(message);
    options.onProgress?.(message);
  };

  try {
    const espnService = new ESPNApiService();

    // Determine max week to fetch
    let maxWeek = options.maxWeek;
    if (!maxWeek) {
      log('🔍 Detecting current week from ESPN...');
      try {
        maxWeek = await espnService.getCurrentWeek();
        log(`  ✓ Current week: ${maxWeek}`);
      } catch (error) {
        const errorMsg = `Failed to detect current week: ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
        log(`  ❌ ${errorMsg}`);
        // Default to week 18 if detection fails
        maxWeek = 18;
        log(`  ℹ️  Defaulting to week ${maxWeek}`);
      }
    }

    // Step 1: Fetch and store weekly data
    log('📊 Fetching weekly scores from ESPN API...');
    const weeklyData = [];

    for (let week = 1; week <= maxWeek; week++) {
      log(`  Fetching Week ${week}...`);

      try {
        // Fetch data from ESPN API
        const response = await espnService.fetchWeeklyData(week);
        const scores = espnService.parseWeeklyScores(response);

        // Store weekly scores in Redis
        await redis.setWeeklyScores(season, week, scores);

        weeklyData.push({ week, scores });
        weeksProcessed++;
        log(
          `  ✓ Week ${week}: ${Object.keys(scores).length} teams, scores stored`
        );

        // Store team metadata (only need to do this once)
        if (week === 1) {
          const teamMetadata = espnService.parseTeamMetadata(response);
          await redis.setTeamMetadata(leagueId, teamMetadata);
          teamsUpdated = Object.keys(teamMetadata).length;
          log(
            `  ✓ Team metadata stored for ${Object.keys(teamMetadata).length} teams`
          );
        }

        // Add a small delay between requests to be respectful to ESPN API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const errorMsg = `Error fetching Week ${week}: ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
        log(`  ❌ ${errorMsg}`);
        // Continue with next week even if one fails
      }
    }

    // Step 2: Fetch and store actual standings
    log('📋 Fetching actual standings from ESPN...');
    try {
      const leagueData = await espnService.fetchLeagueData();
      const actualStandings = espnService.parseActualStandings(leagueData);
      await redis.setActualStandings(season, actualStandings);
      log(`  ✓ Stored actual standings for ${actualStandings.length} teams`);
    } catch (error) {
      const errorMsg = `Error fetching actual standings: ${error instanceof Error ? error.message : error}`;
      errors.push(errorMsg);
      log(`  ❌ ${errorMsg}`);
    }

    // Step 3: Calculate true records
    if (weeklyData.length > 0) {
      log('🧮 Calculating true records...');
      try {
        const trueRecords =
          trueChampionService.recalculateSeasonRecords(weeklyData);

        // Store true records in Redis
        for (const [teamId, record] of Object.entries(trueRecords)) {
          await redis.setTrueRecord(season, teamId, record);
        }
        log(
          `  ✓ Stored true records for ${Object.keys(trueRecords).length} teams`
        );
      } catch (error) {
        const errorMsg = `Error calculating true records: ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
        log(`  ❌ ${errorMsg}`);
      }
    } else {
      const errorMsg = 'No weekly data available to calculate true records';
      errors.push(errorMsg);
      log(`  ⚠️  ${errorMsg}`);
    }

    // Step 4: Set last update timestamp
    const lastUpdate = new Date().toISOString();
    await redis.setLastUpdate(leagueId, lastUpdate);
    log('  ✓ Set last update timestamp');

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    log(
      `\n${success ? '✅' : '⚠️'} Update ${success ? 'complete' : 'completed with errors'} in ${(duration / 1000).toFixed(2)}s`
    );
    if (errors.length > 0) {
      log(`  ${errors.length} error(s) encountered`);
    }

    return {
      success,
      weeksProcessed,
      teamsUpdated,
      errors,
      duration,
      lastUpdate,
    };
  } catch (error) {
    const errorMsg = `Fatal error during update: ${error instanceof Error ? error.message : error}`;
    errors.push(errorMsg);
    log(`❌ ${errorMsg}`);

    return {
      success: false,
      weeksProcessed,
      teamsUpdated,
      errors,
      duration: Date.now() - startTime,
      lastUpdate: new Date().toISOString(),
    };
  }
}
