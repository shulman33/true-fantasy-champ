// ESPN API Response Types
// Based on ESPN Fantasy Football API v3 structure

export interface ESPNApiResponse {
  id: number;
  scoringPeriodId: number;
  seasonId: number;
  settings: LeagueSettings;
  teams: ESPNTeam[];
  schedule: ESPNMatchup[];
  members: ESPNMember[];
  status: {
    currentMatchupPeriod: number;
    finalScoringPeriod: number;
    latestScoringPeriod: number;
  };
}

export interface LeagueSettings {
  name: string;
  scheduleSettings?: {
    divisions?: Array<{
      id?: number;
      name?: string;
    }>;
  };
  acquisitionSettings?: {
    isUsingAcquisitionBudget?: boolean;
    acquisitionBudget?: number;
  };
  rosterSettings?: {
    lineupSlotCounts?: Record<string, number>;
  };
  scoringSettings?: {
    homeTeamBonus?: number;
  };
}

export interface ESPNTeam {
  id: number;
  name: string;
  abbrev: string;
  location?: string;
  nickname?: string;
  owners?: string[]; // Member IDs
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  valuesByStat?: Record<string, number>;
  points: number;
  pointsAgainst: number;
}

export interface ESPNMatchup {
  id: number;
  matchupPeriodId: number; // Week number
  away: TeamMatchupData;
  home: TeamMatchupData;
  winner?: 'away' | 'home' | 'undecided';
}

export interface TeamMatchupData {
  teamId: number;
  totalPoints: number;
  rosterForCurrentScoringPeriod?: {
    entries: RosterEntry[];
  };
}

export interface RosterEntry {
  playerId: number;
  lineupSlotId: number;
  playerPoolEntry?: {
    player: Player;
  };
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  jersey?: string;
  proTeamId: number;
  defaultPositionId: number;
  eligibleSlots: number[];
  injuryStatus?: 'ACTIVE' | 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'INJURY_RESERVE';
  stats?: Array<{
    scoringPeriodId: number;
    appliedTotal: number;
    projectedTotal: number;
  }>;
}

export interface ESPNMember {
  id: string;
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
