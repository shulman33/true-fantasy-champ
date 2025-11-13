/**
 * Mock league data for demo mode
 * Provides sample fantasy football data to showcase the True Champion algorithm
 */

export interface MockTeam {
  id: string;
  name: string;
  owner: string;
  actualWins: number;
  actualLosses: number;
  trueWins: number;
  trueLosses: number;
  pointsFor: number;
  pointsAgainst: number;
  weeklyScores: number[];
}

export interface MockWeeklyMatchup {
  week: number;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
}

export const MOCK_TEAMS: MockTeam[] = [
  {
    id: "1",
    name: "Gridiron Legends",
    owner: "Alex Johnson",
    actualWins: 8,
    actualLosses: 5,
    trueWins: 91,
    trueLosses: 65,
    pointsFor: 1847,
    pointsAgainst: 1692,
    weeklyScores: [142, 156, 138, 145, 132, 168, 151, 139, 147, 155, 138, 136]
  },
  {
    id: "2",
    name: "The Comeback Kids",
    owner: "Sarah Martinez",
    actualWins: 10,
    actualLosses: 3,
    trueWins: 78,
    trueLosses: 78,
    pointsFor: 1723,
    pointsAgainst: 1589,
    weeklyScores: [128, 145, 119, 155, 138, 142, 126, 148, 139, 132, 151, 140]
  },
  {
    id: "3",
    name: "Sunday Funday",
    owner: "Mike Chen",
    actualWins: 6,
    actualLosses: 7,
    trueWins: 104,
    trueLosses: 52,
    pointsFor: 1956,
    pointsAgainst: 1745,
    weeklyScores: [165, 172, 148, 159, 145, 178, 162, 151, 168, 149, 155, 154]
  },
  {
    id: "4",
    name: "Point Chasers",
    owner: "Jordan Smith",
    actualWins: 9,
    actualLosses: 4,
    trueWins: 88,
    trueLosses: 68,
    pointsFor: 1812,
    pointsAgainst: 1678,
    weeklyScores: [148, 152, 142, 138, 155, 149, 145, 158, 141, 146, 138, 150]
  },
  {
    id: "5",
    name: "Fantasy Phenoms",
    owner: "Taylor Brown",
    actualWins: 5,
    actualLosses: 8,
    trueWins: 65,
    trueLosses: 91,
    pointsFor: 1645,
    pointsAgainst: 1798,
    weeklyScores: [125, 132, 128, 145, 119, 138, 142, 126, 135, 148, 132, 125]
  },
  {
    id: "6",
    name: "Touchdown Titans",
    owner: "Casey Wilson",
    actualWins: 7,
    actualLosses: 6,
    trueWins: 72,
    trueLosses: 84,
    pointsFor: 1689,
    pointsAgainst: 1723,
    weeklyScores: [135, 128, 142, 132, 138, 145, 129, 138, 142, 135, 128, 137]
  },
  {
    id: "7",
    name: "The Dynasty",
    owner: "Morgan Davis",
    actualWins: 11,
    actualLosses: 2,
    trueWins: 97,
    trueLosses: 59,
    pointsFor: 1889,
    pointsAgainst: 1612,
    weeklyScores: [158, 165, 145, 152, 148, 159, 142, 155, 148, 151, 146, 160]
  },
  {
    id: "8",
    name: "Playoff Bound",
    owner: "Riley Anderson",
    actualWins: 4,
    actualLosses: 9,
    trueWins: 52,
    trueLosses: 104,
    pointsFor: 1578,
    pointsAgainst: 1856,
    weeklyScores: [118, 125, 115, 132, 128, 122, 135, 119, 128, 142, 125, 129]
  }
];

export const MOCK_MATCHUPS: MockWeeklyMatchup[] = [
  // Week 1
  { week: 1, team1Id: "1", team2Id: "2", team1Score: 142, team2Score: 128 },
  { week: 1, team1Id: "3", team2Id: "4", team1Score: 165, team2Score: 148 },
  { week: 1, team1Id: "5", team2Id: "6", team1Score: 125, team2Score: 135 },
  { week: 1, team1Id: "7", team2Id: "8", team1Score: 158, team2Score: 118 },

  // Week 2
  { week: 2, team1Id: "1", team2Id: "3", team1Score: 156, team2Score: 172 },
  { week: 2, team1Id: "2", team2Id: "4", team1Score: 145, team2Score: 152 },
  { week: 2, team1Id: "5", team2Id: "7", team1Score: 132, team2Score: 165 },
  { week: 2, team1Id: "6", team2Id: "8", team1Score: 128, team2Score: 125 },

  // Week 3
  { week: 3, team1Id: "1", team2Id: "4", team1Score: 138, team2Score: 142 },
  { week: 3, team1Id: "2", team2Id: "3", team1Score: 119, team2Score: 148 },
  { week: 3, team1Id: "5", team2Id: "8", team1Score: 128, team2Score: 115 },
  { week: 3, team1Id: "6", team2Id: "7", team1Score: 142, team2Score: 145 },
];

export const MOCK_LEAGUE_INFO = {
  name: "Demo League 2025",
  season: 2025,
  currentWeek: 13,
  totalTeams: 8,
  lastUpdated: "2025-01-08T10:00:00Z"
};

/**
 * Calculate statistics for demo display in StatsGrid format
 */
export function calculateMockStats() {
  // Find luckiest team (biggest positive differential)
  let luckiestTeam = MOCK_TEAMS[0];
  let maxLuckDiff = -Infinity;

  // Find unluckiest team (biggest negative differential)
  let unluckiestTeam = MOCK_TEAMS[0];
  let maxUnluckDiff = Infinity;

  // Find most consistent (lowest score variance)
  let mostConsistent = MOCK_TEAMS[0];
  let lowestVariance = Infinity;

  // Find highest scoring
  let highestScoring = MOCK_TEAMS[0];
  let maxAvgPoints = 0;

  MOCK_TEAMS.forEach(team => {
    // Luck differential in wins (actual wins - proportional true wins)
    const totalGames = team.actualWins + team.actualLosses;
    const trueWinPct = team.trueWins / (team.trueWins + team.trueLosses);
    const expectedWins = trueWinPct * totalGames;
    const winDiff = team.actualWins - expectedWins;

    if (winDiff > maxLuckDiff) {
      maxLuckDiff = winDiff;
      luckiestTeam = team;
    }

    if (winDiff < maxUnluckDiff) {
      maxUnluckDiff = winDiff;
      unluckiestTeam = team;
    }

    // Consistency (calculate standard deviation of weekly scores)
    const avgScore = team.weeklyScores.reduce((a, b) => a + b, 0) / team.weeklyScores.length;
    const variance = team.weeklyScores.reduce((sum, score) => {
      return sum + Math.pow(score - avgScore, 2);
    }, 0) / team.weeklyScores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < lowestVariance) {
      lowestVariance = stdDev;
      mostConsistent = team;
    }

    // Highest average scoring
    const teamAvgPoints = team.weeklyScores.reduce((a, b) => a + b, 0) / team.weeklyScores.length;
    if (teamAvgPoints > maxAvgPoints) {
      maxAvgPoints = teamAvgPoints;
      highestScoring = team;
    }
  });

  // Calculate differential for luckiest/unluckiest
  const luckiestTotalGames = luckiestTeam.actualWins + luckiestTeam.actualLosses;
  const luckiestTrueWinPct = luckiestTeam.trueWins / (luckiestTeam.trueWins + luckiestTeam.trueLosses);
  const luckiestExpectedWins = luckiestTrueWinPct * luckiestTotalGames;
  const luckiestDiff = luckiestTeam.actualWins - luckiestExpectedWins;

  const unluckiestTotalGames = unluckiestTeam.actualWins + unluckiestTeam.actualLosses;
  const unluckiestTrueWinPct = unluckiestTeam.trueWins / (unluckiestTeam.trueWins + unluckiestTeam.trueLosses);
  const unluckiestExpectedWins = unluckiestTrueWinPct * unluckiestTotalGames;
  const unluckiestDiff = unluckiestTeam.actualWins - unluckiestExpectedWins;

  return {
    luckiest: {
      teamId: luckiestTeam.id,
      teamName: luckiestTeam.name,
      owner: luckiestTeam.owner,
      abbrev: luckiestTeam.name.substring(0, 3).toUpperCase(),
      differential: luckiestDiff,
      actualWins: luckiestTeam.actualWins,
      trueWins: luckiestTeam.trueWins,
    },
    unluckiest: {
      teamId: unluckiestTeam.id,
      teamName: unluckiestTeam.name,
      owner: unluckiestTeam.owner,
      abbrev: unluckiestTeam.name.substring(0, 3).toUpperCase(),
      differential: unluckiestDiff,
      actualWins: unluckiestTeam.actualWins,
      trueWins: unluckiestTeam.trueWins,
    },
    mostConsistent: {
      teamId: mostConsistent.id,
      teamName: mostConsistent.name,
      owner: mostConsistent.owner,
      abbrev: mostConsistent.name.substring(0, 3).toUpperCase(),
      consistency: lowestVariance,
    },
    highestScoring: {
      teamId: highestScoring.id,
      teamName: highestScoring.name,
      owner: highestScoring.owner,
      abbrev: highestScoring.name.substring(0, 3).toUpperCase(),
      averagePoints: maxAvgPoints,
    }
  };
}

/**
 * Get standings sorted by true record
 */
export function getMockStandings() {
  return [...MOCK_TEAMS].sort((a, b) => {
    const aWinPct = a.trueWins / (a.trueWins + a.trueLosses);
    const bWinPct = b.trueWins / (b.trueWins + b.trueLosses);

    if (aWinPct !== bWinPct) {
      return bWinPct - aWinPct;
    }

    // Tiebreaker: points for
    return b.pointsFor - a.pointsFor;
  });
}

/**
 * Get team by ID
 */
export function getMockTeam(teamId: string) {
  return MOCK_TEAMS.find(team => team.id === teamId);
}
