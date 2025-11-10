import { z } from 'zod';

// ESPN API Response Schemas
// Note: Made all nested fields optional as ESPN API returns incomplete data for some fields
const PlayerSchema = z.object({
  id: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  jersey: z.string().optional(),
  proTeamId: z.number().optional(),
  defaultPositionId: z.number().optional(),
  eligibleSlots: z.array(z.number()).optional(),
  injuryStatus: z.enum(['ACTIVE', 'QUESTIONABLE', 'DOUBTFUL', 'OUT', 'INJURY_RESERVE']).optional(),
  stats: z.array(z.object({
    scoringPeriodId: z.number().optional(),
    appliedTotal: z.number().optional(),
    projectedTotal: z.number().optional(),
  })).optional(),
}).passthrough();

const RosterEntrySchema = z.object({
  playerId: z.number().optional(),
  lineupSlotId: z.number().optional(),
  playerPoolEntry: z.object({
    player: PlayerSchema,
  }).optional(),
}).passthrough();

const TeamMatchupDataSchema = z.object({
  teamId: z.number(),
  totalPoints: z.number(),
  rosterForCurrentScoringPeriod: z.object({
    entries: z.array(RosterEntrySchema),
  }).optional(),
}).passthrough();

const ESPNMatchupSchema = z.object({
  id: z.number(),
  matchupPeriodId: z.number(),
  home: TeamMatchupDataSchema,
  away: TeamMatchupDataSchema,
  winner: z.string().optional(), // Can be 'away', 'home', 'undecided', 'AWAY', 'HOME', etc.
}).passthrough();

const LeagueSettingsSchema = z.object({
  name: z.string().optional(),
  scheduleSettings: z.object({
    divisions: z.array(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
    })).optional(),
  }).optional(),
  acquisitionSettings: z.object({
    isUsingAcquisitionBudget: z.boolean().optional(),
    acquisitionBudget: z.number().optional(),
  }).optional(),
  rosterSettings: z.object({
    lineupSlotCounts: z.record(z.string(), z.number()).optional(),
  }).optional(),
  scoringSettings: z.object({
    homeTeamBonus: z.number().optional(),
  }).optional(),
}).passthrough();

const ESPNTeamSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  abbrev: z.string().optional(),
  location: z.string().optional(),
  nickname: z.string().optional(),
  owners: z.array(z.string()).optional(),
  record: z.object({
    wins: z.number().optional(),
    losses: z.number().optional(),
    ties: z.number().optional(),
  }).optional(),
  valuesByStat: z.record(z.string(), z.number()).optional(),
  points: z.number().optional(),
  pointsAgainst: z.number().optional(),
}).passthrough();

const ESPNMemberSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const ESPNResponseSchema = z.object({
  id: z.number(),
  seasonId: z.number(),
  scoringPeriodId: z.number(),
  settings: LeagueSettingsSchema.optional(),
  teams: z.array(ESPNTeamSchema).optional().default([]),
  schedule: z.array(ESPNMatchupSchema).optional().default([]),
  members: z.array(ESPNMemberSchema).optional().default([]),
  status: z.object({
    currentMatchupPeriod: z.number(),
    latestScoringPeriod: z.number(),
    finalScoringPeriod: z.number().optional(),
  }),
});

export type ESPNResponse = z.infer<typeof ESPNResponseSchema>;
export type ESPNMatchup = z.infer<typeof ESPNMatchupSchema>;
export type TeamMatchupData = z.infer<typeof TeamMatchupDataSchema>;

// Internal data types
export interface WeeklyScore {
  teamId: number;
  week: number;
  score: number;
}

export interface WeeklyScores {
  [teamId: string]: number;
}

/**
 * ESPN Fantasy Football API Service
 * Handles all interactions with the ESPN Fantasy API
 */
export class ESPNApiService {
  private readonly baseUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
  private readonly leagueId: string;
  private readonly season: string;
  private readonly swid: string | undefined;
  private readonly espnS2: string | undefined;

  constructor(config?: {
    leagueId?: string;
    season?: string;
    swid?: string;
    espnS2?: string;
  }) {
    this.leagueId = config?.leagueId || process.env.ESPN_LEAGUE_ID || '';
    this.season = config?.season || process.env.ESPN_SEASON || '';
    this.swid = config?.swid || process.env.ESPN_SWID;
    this.espnS2 = config?.espnS2 || process.env.ESPN_S2;

    if (!this.leagueId || !this.season) {
      throw new Error('ESPN_LEAGUE_ID and ESPN_SEASON must be provided');
    }
  }

  /**
   * Fetch weekly data from ESPN API
   * @param week - The week number to fetch data for
   * @returns Parsed ESPN API response
   */
  async fetchWeeklyData(week: number): Promise<ESPNResponse> {
    const url = `${this.baseUrl}/seasons/${this.season}/segments/0/leagues/${this.leagueId}`;

    const params = new URLSearchParams();
    params.append('view', 'mMatchupScore');
    params.append('view', 'mScoreboard');
    params.append('scoringPeriodId', week.toString());

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add authentication cookies if provided (for private leagues)
    if (this.swid && this.espnS2) {
      headers['Cookie'] = `swid=${this.swid}; espn_s2=${this.espnS2}`;
    }

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers,
        cache: 'no-store', // Don't cache API responses
      });

      if (!response.ok) {
        throw new Error(
          `ESPN API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Validate response with Zod
      const validatedData = ESPNResponseSchema.parse(data);

      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('ESPN API response validation failed:', error.issues);
        throw new Error('Invalid ESPN API response format');
      }

      if (error instanceof Error) {
        console.error('ESPN API fetch error:', error.message);
        throw error;
      }

      throw new Error('Unknown error fetching ESPN data');
    }
  }

  /**
   * Parse ESPN API response to extract weekly scores
   * @param response - ESPN API response
   * @returns Object mapping team IDs to scores
   */
  parseWeeklyScores(response: ESPNResponse): WeeklyScores {
    const scores: WeeklyScores = {};

    // Extract scores from matchups
    for (const matchup of response.schedule) {
      // Filter matchups for the current scoring period
      if (matchup.matchupPeriodId === response.scoringPeriodId) {
        scores[matchup.home.teamId.toString()] = matchup.home.totalPoints;
        scores[matchup.away.teamId.toString()] = matchup.away.totalPoints;
      }
    }

    return scores;
  }

  /**
   * Fetch and parse weekly scores in one call
   * @param week - The week number to fetch data for
   * @returns Object mapping team IDs to scores
   */
  async getWeeklyScores(week: number): Promise<WeeklyScores> {
    const data = await this.fetchWeeklyData(week);
    return this.parseWeeklyScores(data);
  }

  /**
   * Get current week number from ESPN API
   * @returns Current week number
   */
  async getCurrentWeek(): Promise<number> {
    const url = `${this.baseUrl}/seasons/${this.season}/segments/0/leagues/${this.leagueId}`;

    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (this.swid && this.espnS2) {
      headers['Cookie'] = `swid=${this.swid}; espn_s2=${this.espnS2}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          `ESPN API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const validatedData = ESPNResponseSchema.parse(data);

      return validatedData.status.currentMatchupPeriod;
    } catch (error) {
      console.error('Error fetching current week:', error);
      throw error;
    }
  }

  /**
   * Parse team metadata from ESPN API response
   * @param response - ESPN API response
   * @returns Object mapping team IDs to team metadata
   */
  parseTeamMetadata(response: ESPNResponse): Record<string, { name: string; owner: string; abbrev: string }> {
    const teamMetadata: Record<string, { name: string; owner: string; abbrev: string }> = {};

    if (!response.teams) {
      return teamMetadata;
    }

    // Create a map of member IDs to names
    const memberMap = new Map<string, string>();
    for (const member of response.members) {
      const fullName = member.firstName && member.lastName
        ? `${member.firstName} ${member.lastName}`
        : member.firstName || member.lastName || `Owner ${member.id}`;
      memberMap.set(member.id, fullName);
    }

    // Extract team metadata
    for (const team of response.teams) {
      const teamName = team.name || team.location && team.nickname
        ? `${team.location} ${team.nickname}`
        : `Team ${team.id}`;

      // Get owner name from first owner ID
      const ownerId = team.owners?.[0];
      const ownerName = ownerId ? memberMap.get(ownerId) || `Owner ${ownerId}` : `Owner ${team.id}`;

      teamMetadata[team.id.toString()] = {
        name: teamName,
        owner: ownerName,
        abbrev: team.abbrev || `T${team.id}`,
      };
    }

    return teamMetadata;
  }

  /**
   * Parse actual standings from ESPN API response
   * @param response - ESPN API response
   * @returns Array of team standings with actual records
   */
  parseActualStandings(response: ESPNResponse): Array<{
    teamId: string;
    wins: number;
    losses: number;
    ties: number;
    points: number;
    pointsAgainst: number;
  }> {
    if (!response.teams) {
      return [];
    }

    return response.teams.map(team => ({
      teamId: team.id.toString(),
      wins: team.record?.wins ?? 0,
      losses: team.record?.losses ?? 0,
      ties: team.record?.ties ?? 0,
      points: team.points ?? 0,
      pointsAgainst: team.pointsAgainst ?? 0,
    }));
  }

  /**
   * Generate mock data for development/testing
   * @param week - The week number
   * @returns Mock ESPN response
   */
  static generateMockData(week: number): ESPNResponse {
    const teamIds = Array.from({ length: 12 }, (_, i) => i + 1);
    const schedule: ESPNMatchup[] = [];

    // Create 6 matchups (12 teams / 2)
    for (let i = 0; i < teamIds.length; i += 2) {
      const homePoints = Math.floor(Math.random() * 60) + 90; // 90-150 points
      const awayPoints = Math.floor(Math.random() * 60) + 90; // 90-150 points

      schedule.push({
        id: i / 2 + 1,
        matchupPeriodId: week,
        home: {
          teamId: teamIds[i],
          totalPoints: homePoints,
        },
        away: {
          teamId: teamIds[i + 1],
          totalPoints: awayPoints,
        },
        winner: homePoints > awayPoints ? 'home' : homePoints < awayPoints ? 'away' : 'undecided',
      });
    }

    // Mock team names (retro football themed)
    const teamNames = [
      { location: 'Pixel', nickname: 'Panthers', abbrev: 'PIX' },
      { location: '8-Bit', nickname: 'Bears', abbrev: '8BB' },
      { location: 'Retro', nickname: 'Rockets', abbrev: 'RET' },
      { location: 'Classic', nickname: 'Crusaders', abbrev: 'CLS' },
      { location: 'Arcade', nickname: 'Aces', abbrev: 'ARC' },
      { location: 'Digital', nickname: 'Dragons', abbrev: 'DIG' },
      { location: 'Vintage', nickname: 'Vikings', abbrev: 'VIN' },
      { location: 'Legacy', nickname: 'Lions', abbrev: 'LEG' },
      { location: 'Throwback', nickname: 'Titans', abbrev: 'THR' },
      { location: 'Old School', nickname: 'Owls', abbrev: 'OLD' },
      { location: 'Timeless', nickname: 'Tigers', abbrev: 'TIM' },
      { location: 'Nostalgic', nickname: 'Knights', abbrev: 'NOS' },
    ];

    const ownerNames = [
      { firstName: 'Sam', lastName: 'Smith' },
      { firstName: 'Jordan', lastName: 'Johnson' },
      { firstName: 'Taylor', lastName: 'Williams' },
      { firstName: 'Morgan', lastName: 'Brown' },
      { firstName: 'Casey', lastName: 'Davis' },
      { firstName: 'Riley', lastName: 'Miller' },
      { firstName: 'Alex', lastName: 'Wilson' },
      { firstName: 'Jamie', lastName: 'Moore' },
      { firstName: 'Drew', lastName: 'Taylor' },
      { firstName: 'Blake', lastName: 'Anderson' },
      { firstName: 'Quinn', lastName: 'Thomas' },
      { firstName: 'Avery', lastName: 'Jackson' },
    ];

    // Generate mock members
    const members = teamIds.map((id, index) => ({
      id: `member-${id}`,
      firstName: ownerNames[index].firstName,
      lastName: ownerNames[index].lastName,
    }));

    // Generate mock teams
    const teams = teamIds.map((id, index) => ({
      id,
      name: `${teamNames[index].location} ${teamNames[index].nickname}`,
      abbrev: teamNames[index].abbrev,
      location: teamNames[index].location,
      nickname: teamNames[index].nickname,
      owners: [`member-${id}`],
      record: {
        wins: Math.floor(Math.random() * 10),
        losses: Math.floor(Math.random() * 10),
        ties: 0,
      },
      points: Math.floor(Math.random() * 1000) + 500,
      pointsAgainst: Math.floor(Math.random() * 1000) + 500,
    }));

    return {
      id: 1044648461,
      seasonId: 2025,
      scoringPeriodId: week,
      settings: {
        name: 'Mock Fantasy League',
      },
      teams,
      schedule,
      members,
      status: {
        currentMatchupPeriod: week,
        latestScoringPeriod: week,
        finalScoringPeriod: 17,
      },
    };
  }
}

// Export singleton instance
export const espnApi = new ESPNApiService();
