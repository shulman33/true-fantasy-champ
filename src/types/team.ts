// Internal Application Types for Teams and Records

export interface Team {
  id: string;
  name: string; // Full name (location + nickname)
  abbrev: string;
  owner: string;
  actualRecord: Record;
  trueRecord: TrueRecord;
}

export interface Record {
  wins: number;
  losses: number;
  ties: number;
  percentage: number;
}

export interface WeeklyScore {
  teamId: string;
  week: number;
  score: number;
  opponentId?: string; // Actual opponent that week
  actualResult?: 'win' | 'loss' | 'tie';
}

export interface TrueRecord {
  teamId: number;
  wins: number; // Total wins across all weeks
  losses: number; // Total losses across all weeks
  weeklyRecords: { [week: number]: WeeklyRecord }; // Keyed by week number
}

export interface WeeklyRecord {
  wins: number; // Number of teams beaten that week
  losses: number; // Number of teams lost to that week
}

export interface WeeklyTrueRecord {
  week: number;
  score: number;
  wins: number; // Number of teams beaten that week
  losses: number; // Number of teams lost to that week
  rank: number; // Ranking for that week based on score
}

export interface MatchupResult {
  week: number;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  winner: string; // teamId of winner, or 'tie'
}

export interface SeasonStandings {
  season: string;
  teams: TeamStanding[];
  lastUpdated: Date;
}

export interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  owner: string;
  trueRecord: Record;
  actualRecord: Record;
  recordDifferential: {
    wins: number; // Difference in wins
    losses: number; // Difference in losses
    percentage: number; // Difference in win %
  };
  averageScore: number;
  totalPoints: number;
  consistency: number;
  luckIndex: number; // Positive = lucky, negative = unlucky
}

export interface HeadToHeadRecord {
  teamId: string;
  opponentId: string;
  wins: number;
  losses: number;
  ties: number;
  averageScoreDifferential: number;
}

export interface WeeklyAnalysis {
  week: number;
  scores: WeeklyScore[];
  highestScore: WeeklyScore;
  lowestScore: WeeklyScore;
  averageScore: number;
  medianScore: number;
  matchupMatrix: MatchupResult[];
}
