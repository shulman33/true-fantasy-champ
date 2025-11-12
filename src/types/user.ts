/**
 * User Type Definitions
 *
 * Types for user management and multi-league functionality
 */

/**
 * Fantasy football platform types
 */
export type Platform = 'espn' | 'sleeper' | 'yahoo'

/**
 * League data from database
 */
export interface League {
  id: string
  userId: string
  platform: Platform
  platformLeagueId: string
  season: number
  leagueName: string | null
  leagueMetadata: Record<string, unknown> | null
  credentials: Record<string, unknown> | null
  isActive: boolean
  lastUpdated: string | null
  createdAt: string
  updatedAt: string
}

/**
 * League with team count and update status
 */
export interface LeagueWithStats extends League {
  teamCount: number
  lastUpdateStatus: 'success' | 'failed' | 'pending' | 'never'
  lastUpdateError: string | null
}

/**
 * Add league payload
 */
export interface AddLeaguePayload {
  platform: Platform
  platformLeagueId: string
  season: number
  leagueName?: string
  credentials?: Record<string, unknown>
}

/**
 * Add league result
 */
export interface AddLeagueResult {
  success: boolean
  league?: League
  error?: string
}

/**
 * Update league payload
 */
export interface UpdateLeaguePayload {
  leagueName?: string
  credentials?: Record<string, unknown>
  isActive?: boolean
}

/**
 * Update league result
 */
export interface UpdateLeagueResult {
  success: boolean
  league?: League
  error?: string
}

/**
 * Remove league result
 */
export interface RemoveLeagueResult {
  success: boolean
  error?: string
}

/**
 * Sync league data payload
 */
export interface SyncLeaguePayload {
  leagueId: string
  forceRefresh?: boolean
}

/**
 * Sync league data result
 */
export interface SyncLeagueResult {
  success: boolean
  jobId?: string
  error?: string
}

/**
 * User's leagues list
 */
export interface UserLeagues {
  leagues: LeagueWithStats[]
  total: number
}

/**
 * League selector state (for UI)
 */
export interface LeagueSelectorState {
  selectedLeagueId: string | null
  availableLeagues: League[]
  loading: boolean
}

/**
 * User preferences
 */
export interface UserPreferences {
  defaultLeagueId: string | null
  theme: 'light' | 'dark' | 'system'
  emailNotifications: boolean
  weeklyDigest: boolean
}

/**
 * User account data
 */
export interface UserAccount {
  id: string
  email: string
  emailConfirmed: boolean
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSignInAt: string | null
  preferences: UserPreferences
}

/**
 * User dashboard data
 */
export interface UserDashboard {
  user: UserAccount
  leagues: LeagueWithStats[]
  selectedLeague: League | null
  recentActivity: ActivityItem[]
}

/**
 * Activity item types
 */
export type ActivityType =
  | 'league_added'
  | 'league_synced'
  | 'league_removed'
  | 'data_updated'
  | 'true_records_calculated'

/**
 * Activity item
 */
export interface ActivityItem {
  id: string
  type: ActivityType
  leagueId: string | null
  leagueName: string | null
  message: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * User statistics
 */
export interface UserStatistics {
  totalLeagues: number
  activeLeagues: number
  totalTeams: number
  lastSyncDate: Date | null
  accountAge: number // days since account creation
}

/**
 * League credentials by platform
 */
export interface ESPNCredentials {
  swid: string
  espn_s2: string
}

export interface YahooCredentials {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface SleeperCredentials {
  // Sleeper typically doesn't require credentials for public leagues
  // But we can store user preferences here
  userId?: string
}

export type LeagueCredentials = ESPNCredentials | YahooCredentials | SleeperCredentials

/**
 * Type guard for ESPN credentials
 */
export function isESPNCredentials(
  credentials: Record<string, unknown>
): credentials is ESPNCredentials {
  return 'swid' in credentials && 'espn_s2' in credentials
}

/**
 * Type guard for Yahoo credentials
 */
export function isYahooCredentials(
  credentials: Record<string, unknown>
): credentials is YahooCredentials {
  return (
    'access_token' in credentials &&
    'refresh_token' in credentials &&
    'expires_at' in credentials
  )
}

/**
 * Type guard for Sleeper credentials
 */
export function isSleeperCredentials(
  credentials: Record<string, unknown>
): credentials is SleeperCredentials {
  // Sleeper credentials are optional, so this is always true for now
  return true
}

/**
 * Helper to get platform display name
 */
export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    espn: 'ESPN Fantasy',
    sleeper: 'Sleeper',
    yahoo: 'Yahoo Fantasy',
  }
  return names[platform]
}

/**
 * Helper to validate season year
 */
export function isValidSeason(season: number): boolean {
  const currentYear = new Date().getFullYear()
  return season >= 2000 && season <= currentYear + 1
}
