// League configuration
export const LEAGUE_ID = process.env.ESPN_LEAGUE_ID || '1044648461';
export const SEASON = process.env.ESPN_SEASON || '2025';

// ESPN API endpoints
export const ESPN_API_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';

// Redis key prefixes
export const REDIS_KEYS = {
  WEEKLY_SCORES: (season: string, week: number) => `weekly_scores:${season}:${week}`,
  TRUE_RECORDS: (season: string, teamId: string) => `true_records:${season}:${teamId}`,
  ACTUAL_STANDINGS: (season: string) => `actual_standings:${season}`,
  TEAM_METADATA: (leagueId: string) => `teams:${leagueId}`,
  LAST_UPDATE: (leagueId: string) => `last_update:${leagueId}`,
} as const;

// App configuration
export const APP_CONFIG = {
  CURRENT_WEEK: 1, // Will be dynamically updated
  TOTAL_WEEKS: 14, // Regular season weeks
  PLAYOFF_WEEKS: [15, 16, 17], // Playoff weeks to potentially exclude
  CACHE_TTL: 60 * 60 * 24, // 24 hours in seconds
} as const;

// Retro Bowl color palette
export const COLORS = {
  FIELD_GREEN: '#2D5016',
  GRASS_DARK: '#1F3810',
  GRASS_LIGHT: '#3A6B1F',
  SCOREBOARD_GOLD: '#FFD700',
  PIXEL_WHITE: '#FFFFFF',
  PIXEL_BLACK: '#000000',
  WIN_GREEN: '#00FF00',
  LOSS_RED: '#FF0000',
} as const;
