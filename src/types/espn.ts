// ESPN API Response Types
// Based on ESPN Fantasy Football API v3 structure

export interface ESPNApiResponse {
  id: number;
  scoringPeriodId: number;
  seasonId: number;
  teams: ESPNTeam[];
  schedule: ESPNMatchup[];
  members: ESPNMember[];
  status: {
    currentMatchupPeriod: number;
    finalScoringPeriod: number;
    latestScoringPeriod: number;
  };
}

export interface ESPNTeam {
  id: number;
  abbrev: string;
  location: string;
  nickname: string;
  owners: string[]; // Member IDs
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      percentage: number;
    };
  };
  valuesByStat: Record<string, number>;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface ESPNMatchup {
  id: number;
  matchupPeriodId: number; // Week number
  away?: {
    teamId: number;
    totalPoints: number;
  };
  home?: {
    teamId: number;
    totalPoints: number;
  };
  winner?: 'away' | 'home' | 'undecided';
}

export interface ESPNMember {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

// Helper types for processing ESPN data
export interface ProcessedMatchup {
  week: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'tie';
}
