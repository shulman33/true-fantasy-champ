/**
 * Debug script to see raw ESPN API response
 * Run with: npx tsx scripts/debug-espn-response.ts
 */

import { ESPNApiService } from '../src/services/espn-api';

async function debugESPNResponse() {
  try {
    const espnService = new ESPNApiService();

    console.log('Fetching Week 1 data...\n');
    const response = await espnService.fetchWeeklyData(1);

    console.log('=== LEAGUE INFO ===');
    console.log('League ID:', response.id);
    console.log('Season:', response.seasonId);
    console.log('Scoring Period:', response.scoringPeriodId);
    console.log('League Name:', response.settings?.name);

    console.log('\n=== MEMBERS ===');
    response.members.slice(0, 3).forEach(member => {
      console.log(`Member ${member.id}:`, member.firstName, member.lastName);
    });

    console.log('\n=== TEAMS ===');
    response.teams.slice(0, 3).forEach(team => {
      console.log(`\nTeam ${team.id}:`);
      console.log('  name:', team.name);
      console.log('  location:', team.location);
      console.log('  nickname:', team.nickname);
      console.log('  abbrev:', team.abbrev);
      console.log('  owners:', team.owners);
      console.log('  record:', team.record);
    });

    console.log('\n=== SCHEDULE (First 2 matchups) ===');
    response.schedule.slice(0, 2).forEach(matchup => {
      console.log(`\nMatchup ${matchup.id} (Week ${matchup.matchupPeriodId}):`);
      console.log('  Home:', matchup.home.teamId, '-', matchup.home.totalPoints, 'pts');
      console.log('  Away:', matchup.away.teamId, '-', matchup.away.totalPoints, 'pts');
      console.log('  Winner:', matchup.winner);
    });

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

debugESPNResponse()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
