/**
 * Populate Redis with test data for dashboard testing
 * Run with: npx tsx scripts/populate-test-data.ts
 */

import { ESPNApiService } from '../src/services/espn-api';
import { trueChampionService } from '../src/services/true-champion';
import {
  setWeeklyScores,
  setTeamMetadata,
  setTrueRecord,
  setLastUpdate,
} from '../src/lib/redis';

async function populateTestData() {
  console.log('🚀 Starting test data population...\n');

  const season = '2025';
  const leagueId = process.env.ESPN_LEAGUE_ID || '1044648461';
  const numWeeks = 3; // Populate 3 weeks of data

  try {
    // Step 1: Generate mock weekly data
    console.log('📊 Generating mock weekly data...');
    const weeklyData = [];

    for (let week = 1; week <= numWeeks; week++) {
      const mockResponse = ESPNApiService.generateMockData(week);
      const espnService = new ESPNApiService();
      const scores = espnService.parseWeeklyScores(mockResponse);

      weeklyData.push({ week, scores });

      // Store weekly scores in Redis
      await setWeeklyScores(season, week, scores);
      console.log(`  ✓ Week ${week}: ${Object.keys(scores).length} teams`);

      // Store team metadata (only need to do this once)
      if (week === 1) {
        const teamMetadata = espnService.parseTeamMetadata(mockResponse);
        await setTeamMetadata(leagueId, teamMetadata);
        console.log(`  ✓ Team metadata stored for ${Object.keys(teamMetadata).length} teams`);
      }
    }

    // Step 2: Calculate true records
    console.log('\n🧮 Calculating true records...');
    const trueRecords = trueChampionService.recalculateSeasonRecords(weeklyData);

    // Store true records in Redis
    for (const [teamId, record] of Object.entries(trueRecords)) {
      await setTrueRecord(season, teamId, record);
    }
    console.log(`  ✓ Stored true records for ${Object.keys(trueRecords).length} teams`);

    // Step 3: Set last update timestamp
    await setLastUpdate(leagueId, new Date().toISOString());
    console.log('  ✓ Set last update timestamp');

    // Step 4: Display sample data
    console.log('\n📈 Sample True Records:');
    const sortedTeams = Object.entries(trueRecords)
      .map(([teamId, record]) => ({
        teamId,
        wins: record.wins,
        losses: record.losses,
        winPct: (record.wins / (record.wins + record.losses) * 100).toFixed(1),
      }))
      .sort((a, b) => parseFloat(b.winPct) - parseFloat(a.winPct))
      .slice(0, 5);

    sortedTeams.forEach((team, index) => {
      console.log(`  ${index + 1}. Team ${team.teamId}: ${team.wins}-${team.losses} (${team.winPct}%)`);
    });

    console.log('\n✅ Test data population complete!');
    console.log(`\n🌐 View your dashboard at: http://localhost:3000\n`);

  } catch (error) {
    console.error('❌ Error populating test data:', error);
    process.exit(1);
  }
}

// Run the script
populateTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
