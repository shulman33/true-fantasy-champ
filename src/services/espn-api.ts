import { z } from 'zod';

// ESPN API Response Schemas
const ESPNTeamSchema = z.object({
  teamId: z.number(),
  totalPoints: z.number(),
  cumulativeScore: z.object({
    wins: z.number(),
    losses: z.number(),
    ties: z.number().optional(),
  }).optional(),
});

const ESPNMatchupSchema = z.object({
  id: z.number(),
  matchupPeriodId: z.number(),
  home: ESPNTeamSchema,
  away: ESPNTeamSchema,
  winner: z.enum(['HOME', 'AWAY', 'UNDECIDED']).optional(),
});

const ESPNResponseSchema = z.object({
  id: z.number(),
  seasonId: z.number(),
  scoringPeriodId: z.number(),
  schedule: z.array(ESPNMatchupSchema),
  status: z.object({
    currentMatchupPeriod: z.number(),
    latestScoringPeriod: z.number(),
    finalScoringPeriod: z.number(),
  }),
});

export type ESPNResponse = z.infer<typeof ESPNResponseSchema>;
export type ESPNMatchup = z.infer<typeof ESPNMatchupSchema>;
export type ESPNTeam = z.infer<typeof ESPNTeamSchema>;

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

    const params = new URLSearchParams({
      view: 'mMatchup',
      view2: 'mScoreboard',
      scoringPeriodId: week.toString(),
    });

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
   * Generate mock data for development/testing
   * @param week - The week number
   * @returns Mock ESPN response
   */
  static generateMockData(week: number): ESPNResponse {
    const teamIds = Array.from({ length: 12 }, (_, i) => i + 1);
    const schedule: ESPNMatchup[] = [];

    // Create 6 matchups (12 teams / 2)
    for (let i = 0; i < teamIds.length; i += 2) {
      schedule.push({
        id: i / 2 + 1,
        matchupPeriodId: week,
        home: {
          teamId: teamIds[i],
          totalPoints: Math.floor(Math.random() * 60) + 90, // 90-150 points
        },
        away: {
          teamId: teamIds[i + 1],
          totalPoints: Math.floor(Math.random() * 60) + 90, // 90-150 points
        },
        winner: Math.random() > 0.5 ? 'HOME' : 'AWAY',
      });
    }

    return {
      id: 1044648461,
      seasonId: 2025,
      scoringPeriodId: week,
      schedule,
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
