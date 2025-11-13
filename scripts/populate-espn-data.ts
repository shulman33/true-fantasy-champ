/**
 * Populate Redis with real ESPN data for weeks 1-9
 * Run with: npx tsx scripts/populate-espn-data.ts
 */

import { ESPNApiService } from '../src/services/espn-api';
import { trueChampionService } from '../src/services/true-champion';
import {
  setWeeklyScores,
  setTeamMetadata,
  setTrueRecord,
  setActualStandings,
  setLastUpdate,
  getTeamMetadata,
  getActualStandings,
} from '../src/lib/redis';

async function populateESPNData() {
  console.log('🏈 Starting ESPN data population...\n');

  const season = process.env.ESPN_SEASON || '2025';
  const leagueId = process.env.ESPN_LEAGUE_ID || '1044648461';
  const maxWeek = 9; // Populate weeks 1-9

  try {
    const espnService = new ESPNApiService();

    // Step 1: Fetch and store weekly data
    console.log('📊 Fetching weekly scores from ESPN API...');
    const weeklyData = [];

    for (let week = 1; week <= maxWeek; week++) {
      console.log(`  Fetching Week ${week}...`);

      try {
        // Fetch data from ESPN API
        const response = await espnService.fetchWeeklyData(week);
        const scores = espnService.parseWeeklyScores(response);

        // Store weekly scores in Redis
        await setWeeklyScores(season, week, scores);

        weeklyData.push({ week, scores });
        console.log(`  ✓ Week ${week}: ${Object.keys(scores).length} teams, scores stored`);

        // Store team metadata (only need to do this once)
        if (week === 1) {
          const teamMetadata = espnService.parseTeamMetadata(response);
          await setTeamMetadata(leagueId, teamMetadata);
          console.log(`  ✓ Team metadata stored for ${Object.keys(teamMetadata).length} teams`);
        }

        // Add a small delay between requests to be respectful to ESPN API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ❌ Error fetching Week ${week}:`, error instanceof Error ? error.message : error);
        // Continue with next week even if one fails
      }
    }

    // Step 1.5: Fetch and store actual standings
    // Don't pass a week to get season-to-date standings
    console.log('\n📋 Fetching actual standings from ESPN...');
    const leagueData = await espnService.fetchLeagueData();
    const actualStandings = espnService.parseActualStandings(leagueData);
    console.log('  Sample standing:', JSON.stringify(actualStandings[0], null, 2));
    await setActualStandings(season, actualStandings);
    console.log(`  ✓ Stored actual standings for ${actualStandings.length} teams`);

    // Verify we can retrieve it
    const retrieved = await getActualStandings(season);
    console.log(`  ✓ Verified retrieval: ${retrieved ? retrieved.length : 'null'} teams`);

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
    console.log('\n📈 Top 5 Teams by True Record:');
    const teamMetadata = await getTeamMetadata(leagueId);
    const sortedTeams = Object.entries(trueRecords)
      .map(([teamId, record]) => {
        const metadata = teamMetadata?.[teamId] || { name: `Team ${teamId}`, owner: '', abbrev: '' };
        return {
          teamId,
          name: metadata.name,
          owner: metadata.owner,
          wins: record.wins,
          losses: record.losses,
          winPct: (record.wins / (record.wins + record.losses) * 100).toFixed(1),
        };
      })
      .sort((a, b) => parseFloat(b.winPct) - parseFloat(a.winPct))
      .slice(0, 5);

    sortedTeams.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.name} (${team.owner}): ${team.wins}-${team.losses} (${team.winPct}%)`);
    });

    console.log('\n✅ ESPN data population complete!');
    console.log(`\n🌐 View your dashboard at: http://localhost:3001\n`);

  } catch (error) {
    console.error('❌ Error populating ESPN data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
populateESPNData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
