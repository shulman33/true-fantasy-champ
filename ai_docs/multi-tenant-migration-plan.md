# True Champion: Multi-Tenant Migration Plan

**Author**: Claude Code
**Date**: 2025-11-12
**Status**: Planning Document

## Executive Summary

This document outlines the comprehensive technical strategy for migrating True Champion from a single-tenant, ESPN-only application to a multi-tenant SaaS platform supporting ESPN, Sleeper, and Yahoo Fantasy Football. The migration requires fundamental architectural changes including authentication, database restructuring, platform abstraction, and queue-based data updates.

**Estimated Timeline**: 12-16 weeks for full implementation
**Recommended Approach**: Phased migration starting with Supabase foundation, then multi-league ESPN, then additional platforms

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Platform API Research](#platform-api-research)
3. [Proposed Architecture](#proposed-architecture)
4. [Technical Migration Steps](#technical-migration-steps)
5. [Database Schema Design](#database-schema-design)
6. [Platform Adapter Pattern](#platform-adapter-pattern)
7. [Authentication & Authorization](#authentication--authorization)
8. [Data Update Orchestration](#data-update-orchestration)
9. [Frontend Changes](#frontend-changes)
10. [Migration Phases](#migration-phases)
11. [Risk Assessment](#risk-assessment)
12. [Cost & Performance Considerations](#cost--performance-considerations)

---

## Current State Analysis

### Architecture Overview

True Champion is currently a **single-tenant, ESPN-specific** Next.js 15 application with the following characteristics:

```
Current Flow:
ESPN API → ESPNApiService (singleton) → Redis → API Routes → Frontend
                                         ↑
                                    Vercel Cron
```

### Critical Limitations for Multi-Tenancy

1. **Hard-coded League ID**: `process.env.ESPN_LEAGUE_ID` referenced in 10+ files
2. **Singleton Services**: `export const espnApi = new ESPNApiService()` prevents multi-league support
3. **No Authentication**: Zero user management or authorization
4. **Redis Schema**: Keys scoped only by season, not by league or user
5. **Single Cron Job**: One scheduled update for THE league, not multiple leagues
6. **No Platform Abstraction**: ESPN-specific data structures throughout

### What Works Well

✅ **Platform-Agnostic Algorithm**: True Champion calculation logic works with any score data
✅ **Service Separation**: Clear boundaries between API, algorithm, and storage
✅ **Type Safety**: Comprehensive TypeScript types throughout
✅ **Modern Stack**: Next.js 15, React Server Components ready for scaling
✅ **Redis Simplicity**: Easy to refactor key-value patterns

---

## Platform API Research

### ESPN Fantasy Football

**Current Implementation**: ✅ Fully implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ⚠️ Cookie-based | Requires `swid` and `espn_s2` cookies from browser |
| API Stability | ⚠️ Unofficial | No official API, could break |
| Rate Limits | ⚠️ Undocumented | Unknown limits |
| Public Leagues | ✅ Supported | No auth required |
| Private Leagues | ⚠️ Cookie auth | Not scalable for multi-user SaaS |
| Webhooks | ❌ None | Must poll for updates |

**Data Available**:
- League settings and teams
- Weekly matchups and scores
- Team rosters and records
- Member information
- Current week/season status

**Integration Complexity**: 🟡 Medium (already implemented, but auth is problematic)

**Recommendation**: For multi-tenant ESPN support, consider:
1. Requiring users to provide their own cookies (stored encrypted)
2. Building an ESPN proxy service that handles authentication
3. Limiting to public leagues only (no auth required)

---

### Sleeper Fantasy Football

**Ease of Integration**: ✅ Easiest to implement

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ None required | Read-only API, no tokens needed |
| API Stability | ✅ Official | Well-documented and stable |
| Rate Limits | ✅ 1000/min | Clear guidance: stay under 1000 calls/min |
| Public Leagues | ✅ Supported | All league data accessible |
| Private Leagues | ✅ Supported | No distinction, all readable |
| Webhooks | ❌ None | Must poll for updates |

**Key Endpoints**:
```
GET /v1/league/<league_id>                    # League details
GET /v1/league/<league_id>/rosters            # All team rosters
GET /v1/league/<league_id>/matchups/<week>   # Weekly scores
GET /v1/league/<league_id>/users              # League members
GET /v1/state/nfl                             # Current week/season
```

**Data Structure**:
```json
// Matchup response
{
  "matchup_id": 1,           // Teams with same ID play each other
  "roster_id": 2,            // Team identifier
  "points": 123.45,          // Total points scored
  "starters": ["player_id"], // Starting lineup
  "players": ["player_id"]   // All rostered players
}
```

**Integration Complexity**: 🟢 Low (simplest API, no auth, clean JSON)

**Recommendation**: **Start with Sleeper** as the second platform due to:
- No authentication complexity
- Simple REST API with clean JSON responses
- No cookie management or OAuth flows
- Can validate multi-platform architecture without auth overhead

---

### Yahoo Fantasy Sports

**Ease of Integration**: ⚠️ Most complex

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ❌ OAuth required | 3-legged OAuth flow mandatory |
| API Stability | ✅ Official | Well-documented, stable |
| Rate Limits | ⚠️ Undocumented | Likely conservative limits |
| Public Leagues | ⚠️ Limited | Can access if member or public |
| Private Leagues | ⚠️ Member only | Must be league member |
| Webhooks | ❌ None | Must poll for updates |
| Response Format | ⚠️ XML | No JSON option, requires parsing |

**OAuth Flow Requirements**:
1. Register app with Yahoo Developer Network
2. Obtain consumer key/secret
3. Implement 3-legged OAuth authorization
4. Manage access tokens and refresh tokens
5. Handle token expiration and renewal

**Key Endpoints**:
```
GET /fantasy/v2/league/{league_key}/standings
GET /fantasy/v2/league/{league_key}/scoreboard;week={week}
GET /fantasy/v2/league/{league_key}/teams
```

**Data Structure**: XML responses with hierarchical structure
```xml
<fantasy_content>
  <league>
    <league_key>pnfl.l.123456</league_key>
    <standings>
      <teams>
        <team>
          <team_key>pnfl.l.123456.t.1</team_key>
          <team_points>
            <total>1234.56</total>
          </team_points>
        </team>
      </teams>
    </standings>
  </league>
</fantasy_content>
```

**Integration Complexity**: 🔴 High (OAuth, XML parsing, token management)

**Recommendation**: **Implement Yahoo last** due to:
- Complex OAuth implementation required
- XML parsing overhead
- Token refresh logic needed
- Additional user onboarding friction

---

## Proposed Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  - Multi-league dashboard   - League selector   - User profile  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                          │
│  - Auth middleware   - League authorization   - CRUD operations │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌─────────────┐ ┌─────────────────┐
│   Supabase   │ │   Redis     │ │  Queue Service  │
│              │ │             │ │   (QStash)      │
│ - Auth       │ │ - Cache     │ │                 │
│ - Postgres   │ │ - Sessions  │ │ - League updates│
│ - Storage    │ │ - Hot data  │ │ - Rate limiting │
│ - RLS        │ │             │ │ - Retries       │
└──────────────┘ └─────────────┘ └─────────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Platform Adapter Layer                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   ESPN       │  │   Sleeper    │  │   Yahoo      │          │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌─────────────┐ ┌─────────────────┐
│  ESPN API    │ │ Sleeper API │ │   Yahoo API     │
└──────────────┘ └─────────────┘ └─────────────────┘
```

### Component Responsibilities

#### Supabase (Primary Database)
- **User authentication** (Email/OAuth/Magic Links)
- **League ownership** and access control
- **User settings** and preferences
- **League metadata** (platform, league ID, credentials)
- **OAuth tokens** (encrypted) for Yahoo
- **Row-Level Security** for multi-tenant data isolation

#### Redis (Upstash)
- **Calculated data cache** (true records, standings)
- **Weekly scores** (hot data)
- **Session data** (optional)
- **Rate limiting** state

#### Queue Service (Upstash QStash)
- **Per-league update scheduling**
- **Retry logic** for failed updates
- **Rate limiting** per platform
- **Background job orchestration**

#### Platform Adapters
- **Normalize data** from different APIs
- **Handle authentication** per platform
- **Parse responses** (JSON, XML)
- **Error handling** and retries

---

## Technical Migration Steps

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Establish Supabase, authentication, and multi-tenant database structure

#### 1.1 Supabase Setup

```bash
# Install Supabase client
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Set up environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Create Supabase project** at supabase.com:
- Enable Email authentication
- Configure OAuth providers (Google)
- Set up row-level security policies

#### 1.2 Database Schema Design

Create Postgres tables in Supabase:

```sql
-- Users table (managed by Supabase Auth)
-- No manual table needed, use auth.users

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('espn', 'sleeper', 'yahoo')),
  platform_league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  league_name TEXT,
  league_metadata JSONB, -- Platform-specific settings
  credentials JSONB, -- Encrypted ESPN cookies or Yahoo tokens
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(platform, platform_league_id, season)
);

-- Enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own leagues
CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leagues"
  ON leagues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leagues"
  ON leagues FOR UPDATE
  USING (auth.uid() = user_id);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  platform_team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_abbrev TEXT,
  owner_name TEXT,
  avatar_url TEXT,
  metadata JSONB, -- Platform-specific data
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, platform_team_id)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their leagues"
  ON teams FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Weekly scores table
CREATE TABLE weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  score NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, week)
);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in their leagues"
  ON weekly_scores FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- True records table
CREATE TABLE true_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  weekly_records JSONB, -- {week: {wins, losses}}
  win_percentage NUMERIC(5, 4),
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, season)
);

ALTER TABLE true_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view true records in their leagues"
  ON true_records FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Actual standings table
CREATE TABLE actual_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points_for NUMERIC(10, 2) DEFAULT 0,
  points_against NUMERIC(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, season)
);

ALTER TABLE actual_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view standings in their leagues"
  ON actual_standings FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Update jobs table (for tracking data refresh)
CREATE TABLE update_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  weeks_updated INTEGER[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE update_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view update jobs for their leagues"
  ON update_jobs FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_leagues_user_id ON leagues(user_id);
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_weekly_scores_league_id ON weekly_scores(league_id);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week);
CREATE INDEX idx_true_records_league_id ON true_records(league_id);
CREATE INDEX idx_actual_standings_league_id ON actual_standings(league_id);
```

#### 1.3 Authentication Setup

Create `lib/supabase/` directory:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}
```

Update `middleware.ts`:
```typescript
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### 1.4 Create Authentication Pages

```typescript
// app/login/page.tsx
import { Login } from '@/components/auth/login'

export default function LoginPage() {
  return <Login />
}
```

```typescript
// components/auth/login.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (!error) {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

### Phase 2: Redis Schema Migration (Weeks 5-6)

**Goal**: Update Redis to support multi-tenant data with league scoping

#### 2.1 New Redis Key Structure

**Update `lib/redis.ts`**:

```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Multi-tenant key generators
export const RedisKeys = {
  // Weekly scores: league_id:season:week
  weeklyScores: (leagueId: string, season: number, week: number) =>
    `weekly_scores:${leagueId}:${season}:${week}`,

  // True records: league_id:season:team_id
  trueRecord: (leagueId: string, season: number, teamId: string) =>
    `true_record:${leagueId}:${season}:${teamId}`,

  // All true records for a league: league_id:season
  allTrueRecords: (leagueId: string, season: number) =>
    `true_records:${leagueId}:${season}`,

  // Actual standings: league_id:season
  actualStandings: (leagueId: string, season: number) =>
    `actual_standings:${leagueId}:${season}`,

  // Teams metadata: league_id
  teams: (leagueId: string) =>
    `teams:${leagueId}`,

  // Last update timestamp: league_id
  lastUpdate: (leagueId: string) =>
    `last_update:${leagueId}`,
}

// Helper functions with league scoping
export async function getWeeklyScores(
  leagueId: string,
  season: number,
  week: number
): Promise<Record<string, number> | null> {
  return await redis.get(RedisKeys.weeklyScores(leagueId, season, week))
}

export async function setWeeklyScores(
  leagueId: string,
  season: number,
  week: number,
  scores: Record<string, number>
): Promise<void> {
  await redis.set(RedisKeys.weeklyScores(leagueId, season, week), scores)
}

// ... similar functions for other data types
```

#### 2.2 Data Migration Script

Create migration script to move existing data to new schema:

```typescript
// scripts/migrate-redis-data.ts
import { redis, RedisKeys } from '@/lib/redis'

async function migrateRedisData() {
  const OLD_LEAGUE_ID = '1044648461'
  const SEASON = 2025
  const NEW_LEAGUE_UUID = 'your-league-uuid-from-supabase'

  console.log('Starting Redis data migration...')

  // Migrate weekly scores
  for (let week = 1; week <= 17; week++) {
    const oldKey = `weekly_scores:${SEASON}:${week}`
    const scores = await redis.get(oldKey)

    if (scores) {
      const newKey = RedisKeys.weeklyScores(NEW_LEAGUE_UUID, SEASON, week)
      await redis.set(newKey, scores)
      console.log(`Migrated week ${week} scores`)
    }
  }

  // Migrate true records
  const oldTrueRecordsKey = `true_records:${SEASON}`
  const trueRecords = await redis.get(oldTrueRecordsKey)

  if (trueRecords) {
    const newKey = RedisKeys.allTrueRecords(NEW_LEAGUE_UUID, SEASON)
    await redis.set(newKey, trueRecords)
    console.log('Migrated true records')
  }

  // Migrate actual standings
  const oldStandingsKey = `actual_standings:${SEASON}`
  const standings = await redis.get(oldStandingsKey)

  if (standings) {
    const newKey = RedisKeys.actualStandings(NEW_LEAGUE_UUID, SEASON)
    await redis.set(newKey, standings)
    console.log('Migrated actual standings')
  }

  console.log('Migration complete!')
}

migrateRedisData()
```

---

### Phase 3: Platform Adapter Pattern (Weeks 7-8)

**Goal**: Abstract platform-specific logic into adapters

#### 3.1 Define Platform Adapter Interface

```typescript
// lib/adapters/types.ts
export interface LeagueData {
  leagueId: string
  leagueName: string
  season: number
  currentWeek: number
  teams: TeamMetadata[]
  settings: LeagueSettings
}

export interface TeamMetadata {
  teamId: string
  teamName: string
  teamAbbrev: string
  ownerName: string
  avatarUrl?: string
}

export interface WeeklyScores {
  week: number
  scores: Record<string, number> // teamId -> score
}

export interface ActualStandings {
  teamId: string
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

export interface LeagueSettings {
  numTeams: number
  scoringType: string
  rosterSettings?: Record<string, any>
}

export interface PlatformAdapter {
  platform: 'espn' | 'sleeper' | 'yahoo'

  // Fetch league metadata
  fetchLeagueData(leagueId: string, season: number): Promise<LeagueData>

  // Fetch weekly scores for all teams
  fetchWeeklyScores(leagueId: string, season: number, week: number): Promise<WeeklyScores>

  // Fetch actual standings
  fetchActualStandings(leagueId: string, season: number): Promise<ActualStandings[]>

  // Get current week
  getCurrentWeek(leagueId: string, season: number): Promise<number>

  // Validate league access
  validateLeagueAccess(leagueId: string): Promise<boolean>
}

export interface AdapterConfig {
  leagueId: string
  season: number
  credentials?: {
    // ESPN
    swid?: string
    espnS2?: string
    // Yahoo
    accessToken?: string
    refreshToken?: string
  }
}
```

#### 3.2 Refactor ESPN Adapter

```typescript
// lib/adapters/espn-adapter.ts
import { PlatformAdapter, AdapterConfig, LeagueData, WeeklyScores, ActualStandings } from './types'
import { ESPNApiService } from '@/services/espn-api'

export class ESPNAdapter implements PlatformAdapter {
  public readonly platform = 'espn' as const
  private api: ESPNApiService

  constructor(config: AdapterConfig) {
    this.api = new ESPNApiService({
      leagueId: config.leagueId,
      season: config.season.toString(),
      swid: config.credentials?.swid,
      espnS2: config.credentials?.espnS2,
    })
  }

  async fetchLeagueData(leagueId: string, season: number): Promise<LeagueData> {
    const response = await this.api.fetchLeagueData()
    const teams = this.api.parseTeamMetadata(response)

    return {
      leagueId,
      leagueName: response.settings?.name || 'ESPN League',
      season,
      currentWeek: response.status.currentMatchupPeriod,
      teams: Object.entries(teams).map(([id, data]) => ({
        teamId: id,
        teamName: data.name,
        teamAbbrev: data.abbrev,
        ownerName: data.owner,
      })),
      settings: {
        numTeams: response.teams?.length || 0,
        scoringType: 'head-to-head',
      },
    }
  }

  async fetchWeeklyScores(leagueId: string, season: number, week: number): Promise<WeeklyScores> {
    const scores = await this.api.getWeeklyScores(week)
    return {
      week,
      scores,
    }
  }

  async fetchActualStandings(leagueId: string, season: number): Promise<ActualStandings[]> {
    const response = await this.api.fetchLeagueData()
    return this.api.parseActualStandings(response)
  }

  async getCurrentWeek(leagueId: string, season: number): Promise<number> {
    return await this.api.getCurrentWeek()
  }

  async validateLeagueAccess(leagueId: string): Promise<boolean> {
    try {
      await this.api.fetchLeagueData()
      return true
    } catch (error) {
      return false
    }
  }
}
```

#### 3.3 Create Sleeper Adapter

```typescript
// lib/adapters/sleeper-adapter.ts
import { PlatformAdapter, AdapterConfig, LeagueData, WeeklyScores, ActualStandings } from './types'

interface SleeperLeague {
  league_id: string
  name: string
  season: string
  total_rosters: number
  scoring_settings: Record<string, number>
}

interface SleeperRoster {
  roster_id: number
  owner_id: string
  settings: {
    wins: number
    losses: number
    ties: number
    fpts: number
    fpts_against: number
  }
}

interface SleeperUser {
  user_id: string
  display_name: string
  username: string
}

interface SleeperMatchup {
  matchup_id: number
  roster_id: number
  points: number
  starters: string[]
  players: string[]
}

interface SleeperState {
  week: number
  season: string
  season_type: string
}

export class SleeperAdapter implements PlatformAdapter {
  public readonly platform = 'sleeper' as const
  private baseUrl = 'https://api.sleeper.app/v1'
  private config: AdapterConfig

  constructor(config: AdapterConfig) {
    this.config = config
  }

  async fetchLeagueData(leagueId: string, season: number): Promise<LeagueData> {
    // Fetch league details
    const leagueResponse = await fetch(`${this.baseUrl}/league/${leagueId}`)
    const league: SleeperLeague = await leagueResponse.json()

    // Fetch rosters
    const rostersResponse = await fetch(`${this.baseUrl}/league/${leagueId}/rosters`)
    const rosters: SleeperRoster[] = await rostersResponse.json()

    // Fetch users
    const usersResponse = await fetch(`${this.baseUrl}/league/${leagueId}/users`)
    const users: SleeperUser[] = await usersResponse.json()

    // Create user map
    const userMap = new Map(users.map(u => [u.user_id, u.display_name || u.username]))

    // Map rosters to teams
    const teams = rosters.map((roster, index) => ({
      teamId: roster.roster_id.toString(),
      teamName: userMap.get(roster.owner_id) || `Team ${roster.roster_id}`,
      teamAbbrev: `T${roster.roster_id}`,
      ownerName: userMap.get(roster.owner_id) || 'Unknown',
    }))

    const currentWeek = await this.getCurrentWeek(leagueId, season)

    return {
      leagueId,
      leagueName: league.name,
      season,
      currentWeek,
      teams,
      settings: {
        numTeams: league.total_rosters,
        scoringType: 'head-to-head',
        rosterSettings: league.scoring_settings,
      },
    }
  }

  async fetchWeeklyScores(leagueId: string, season: number, week: number): Promise<WeeklyScores> {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/matchups/${week}`)
    const matchups: SleeperMatchup[] = await response.json()

    const scores: Record<string, number> = {}
    for (const matchup of matchups) {
      scores[matchup.roster_id.toString()] = matchup.points
    }

    return {
      week,
      scores,
    }
  }

  async fetchActualStandings(leagueId: string, season: number): Promise<ActualStandings[]> {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/rosters`)
    const rosters: SleeperRoster[] = await response.json()

    return rosters.map(roster => ({
      teamId: roster.roster_id.toString(),
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: roster.settings.ties,
      pointsFor: roster.settings.fpts,
      pointsAgainst: roster.settings.fpts_against,
    }))
  }

  async getCurrentWeek(leagueId: string, season: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/state/nfl`)
    const state: SleeperState = await response.json()
    return state.week
  }

  async validateLeagueAccess(leagueId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/league/${leagueId}`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}
```

#### 3.4 Create Yahoo Adapter (Stub)

```typescript
// lib/adapters/yahoo-adapter.ts
import { PlatformAdapter, AdapterConfig, LeagueData, WeeklyScores, ActualStandings } from './types'

export class YahooAdapter implements PlatformAdapter {
  public readonly platform = 'yahoo' as const
  private config: AdapterConfig

  constructor(config: AdapterConfig) {
    this.config = config
  }

  async fetchLeagueData(leagueId: string, season: number): Promise<LeagueData> {
    // TODO: Implement Yahoo OAuth and API calls
    // This will require:
    // 1. OAuth token exchange
    // 2. XML parsing
    // 3. Yahoo API v2 calls
    throw new Error('Yahoo adapter not yet implemented')
  }

  async fetchWeeklyScores(leagueId: string, season: number, week: number): Promise<WeeklyScores> {
    throw new Error('Yahoo adapter not yet implemented')
  }

  async fetchActualStandings(leagueId: string, season: number): Promise<ActualStandings[]> {
    throw new Error('Yahoo adapter not yet implemented')
  }

  async getCurrentWeek(leagueId: string, season: number): Promise<number> {
    throw new Error('Yahoo adapter not yet implemented')
  }

  async validateLeagueAccess(leagueId: string): Promise<boolean> {
    return false
  }
}
```

#### 3.5 Adapter Factory

```typescript
// lib/adapters/factory.ts
import { PlatformAdapter, AdapterConfig } from './types'
import { ESPNAdapter } from './espn-adapter'
import { SleeperAdapter } from './sleeper-adapter'
import { YahooAdapter } from './yahoo-adapter'

export function createAdapter(
  platform: 'espn' | 'sleeper' | 'yahoo',
  config: AdapterConfig
): PlatformAdapter {
  switch (platform) {
    case 'espn':
      return new ESPNAdapter(config)
    case 'sleeper':
      return new SleeperAdapter(config)
    case 'yahoo':
      return new YahooAdapter(config)
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}
```

---

### Phase 4: API Routes Refactoring (Weeks 9-10)

**Goal**: Update all API routes to support multi-tenant auth and league context

#### 4.1 Auth Middleware

```typescript
// lib/middleware/auth.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function requireAuth(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { user, supabase }
}

export async function requireLeagueAccess(
  supabase: SupabaseClient,
  userId: string,
  leagueId: string
) {
  const { data: league, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .eq('user_id', userId)
    .single()

  if (error || !league) {
    throw new Error('League not found or access denied')
  }

  return league
}
```

#### 4.2 Updated API Routes

```typescript
// app/api/leagues/[leagueId]/standings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireLeagueAccess } from '@/lib/middleware/auth'
import { redis, RedisKeys } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  // Authenticate user
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const { user, supabase } = authResult

  try {
    // Verify league access
    const league = await requireLeagueAccess(supabase, user.id, params.leagueId)

    // Fetch standings from Redis
    const standings = await redis.get(
      RedisKeys.allTrueRecords(params.leagueId, league.season)
    )

    if (!standings) {
      return NextResponse.json(
        { error: 'No data available. Please refresh league data.' },
        { status: 404 }
      )
    }

    return NextResponse.json(standings)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }
}
```

```typescript
// app/api/leagues/[leagueId]/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireLeagueAccess } from '@/lib/middleware/auth'
import { createAdapter } from '@/lib/adapters/factory'
import { updateLeagueData } from '@/services/data-updater'

export async function POST(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const { user, supabase } = authResult

  try {
    // Verify league access
    const league = await requireLeagueAccess(supabase, user.id, params.leagueId)

    // Create adapter for platform
    const adapter = createAdapter(league.platform, {
      leagueId: league.platform_league_id,
      season: league.season,
      credentials: league.credentials,
    })

    // Trigger update
    await updateLeagueData(adapter, league.id, league.season)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

### Phase 5: Data Updater Refactoring (Week 11)

**Goal**: Update data-updater service to work with platform adapters

```typescript
// services/data-updater.ts
import { PlatformAdapter } from '@/lib/adapters/types'
import { redis, RedisKeys } from '@/lib/redis'
import { createServerClient } from '@/lib/supabase/server'
import { calculateSeasonTrueRecords } from './true-champion'

export async function updateLeagueData(
  adapter: PlatformAdapter,
  leagueId: string,
  season: number
) {
  console.log(`Starting update for league ${leagueId}...`)

  const supabase = createServerClient()

  // Get current week
  const currentWeek = await adapter.getCurrentWeek(leagueId, season)

  // Fetch league data
  const leagueData = await adapter.fetchLeagueData(leagueId, season)

  // Store teams in Supabase
  for (const team of leagueData.teams) {
    await supabase
      .from('teams')
      .upsert({
        league_id: leagueId,
        platform_team_id: team.teamId,
        team_name: team.teamName,
        team_abbrev: team.teamAbbrev,
        owner_name: team.ownerName,
      })
  }

  // Fetch and store weekly scores
  const allWeeklyScores: Record<number, Record<string, number>> = {}

  for (let week = 1; week <= currentWeek; week++) {
    const weeklyScores = await adapter.fetchWeeklyScores(leagueId, season, week)

    // Store in Redis
    await redis.set(
      RedisKeys.weeklyScores(leagueId, season, week),
      weeklyScores.scores
    )

    // Store in Supabase
    for (const [teamId, score] of Object.entries(weeklyScores.scores)) {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('platform_team_id', teamId)
        .single()

      if (team) {
        await supabase
          .from('weekly_scores')
          .upsert({
            league_id: leagueId,
            team_id: team.id,
            week,
            score,
          })
      }
    }

    allWeeklyScores[week] = weeklyScores.scores
  }

  // Calculate true records
  const trueRecords = calculateSeasonTrueRecords(allWeeklyScores)

  // Store true records in Redis
  await redis.set(
    RedisKeys.allTrueRecords(leagueId, season),
    trueRecords
  )

  // Store true records in Supabase
  for (const record of trueRecords) {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('league_id', leagueId)
      .eq('platform_team_id', record.teamId)
      .single()

    if (team) {
      await supabase
        .from('true_records')
        .upsert({
          league_id: leagueId,
          team_id: team.id,
          season,
          total_wins: record.wins,
          total_losses: record.losses,
          weekly_records: record.weeklyRecords,
          win_percentage: record.winPercentage,
          rank: record.rank,
        })
    }
  }

  // Fetch and store actual standings
  const actualStandings = await adapter.fetchActualStandings(leagueId, season)

  await redis.set(
    RedisKeys.actualStandings(leagueId, season),
    actualStandings
  )

  for (const standing of actualStandings) {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('league_id', leagueId)
      .eq('platform_team_id', standing.teamId)
      .single()

    if (team) {
      await supabase
        .from('actual_standings')
        .upsert({
          league_id: leagueId,
          team_id: team.id,
          season,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          points_for: standing.pointsFor,
          points_against: standing.pointsAgainst,
        })
    }
  }

  // Update last_update timestamp
  await redis.set(RedisKeys.lastUpdate(leagueId), new Date().toISOString())

  await supabase
    .from('leagues')
    .update({ last_updated: new Date().toISOString() })
    .eq('id', leagueId)

  console.log(`Update complete for league ${leagueId}`)
}
```

---

### Phase 6: Queue-Based Updates (Week 12)

**Goal**: Replace single cron job with queue-based per-league updates

#### 6.1 Install Upstash QStash

```bash
npm install @upstash/qstash
```

Add environment variables:
```bash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key
```

#### 6.2 Create Queue Service

```typescript
// lib/queue/qstash.ts
import { Client } from '@upstash/qstash'

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function enqueueLeagueUpdate(leagueId: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/queue/update-league`

  await qstash.publishJSON({
    url,
    body: {
      leagueId,
    },
    retries: 3,
    delay: 0,
  })
}

export async function scheduleLeagueUpdate(leagueId: string, cron: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/queue/update-league`

  await qstash.schedules.create({
    destination: url,
    cron, // e.g., "0 10 * * 2" for Tuesdays at 10am
    body: JSON.stringify({ leagueId }),
  })
}
```

#### 6.3 Queue Handler Route

```typescript
// app/api/queue/update-league/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { createServerClient } from '@/lib/supabase/server'
import { createAdapter } from '@/lib/adapters/factory'
import { updateLeagueData } from '@/services/data-updater'

async function handler(request: NextRequest) {
  const supabase = createServerClient()
  const { leagueId } = await request.json()

  try {
    // Fetch league from Supabase
    const { data: league, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single()

    if (error || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    // Create update job
    const { data: job } = await supabase
      .from('update_jobs')
      .insert({
        league_id: leagueId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Create adapter and update
    const adapter = createAdapter(league.platform, {
      leagueId: league.platform_league_id,
      season: league.season,
      credentials: league.credentials,
    })

    await updateLeagueData(adapter, leagueId, league.season)

    // Mark job complete
    await supabase
      .from('update_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    // Mark job failed
    await supabase
      .from('update_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export const POST = verifySignatureAppRouter(handler)
```

#### 6.4 Update All Leagues Cron

```typescript
// app/api/cron/update-all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enqueueLeagueUpdate } from '@/lib/queue/qstash'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Get all active leagues
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id')
    .eq('is_active', true)

  if (!leagues) {
    return NextResponse.json({ message: 'No leagues to update' })
  }

  // Enqueue update for each league
  for (const league of leagues) {
    await enqueueLeagueUpdate(league.id)
  }

  return NextResponse.json({
    message: `Enqueued ${leagues.length} league updates`,
  })
}
```

Update `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/update-all",
    "schedule": "0 10 * * 2"
  }]
}
```

---

### Phase 7: Frontend Updates (Weeks 13-14)

**Goal**: Build multi-league UI with league connection flow

#### 7.1 League Connection Flow

```typescript
// app/leagues/connect/page.tsx
import { ConnectLeague } from '@/components/leagues/connect-league'

export default function ConnectLeaguePage() {
  return (
    <div>
      <h1>Connect Your Fantasy League</h1>
      <ConnectLeague />
    </div>
  )
}
```

```typescript
// components/leagues/connect-league.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ConnectLeague() {
  const [platform, setPlatform] = useState<'espn' | 'sleeper' | 'yahoo'>('sleeper')
  const [leagueId, setLeagueId] = useState('')
  const [season, setSeason] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate league access
      const validateResponse = await fetch('/api/leagues/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, leagueId, season }),
      })

      if (!validateResponse.ok) {
        throw new Error('Invalid league or access denied')
      }

      const { leagueName } = await validateResponse.json()

      // Create league in database
      const { data, error } = await supabase
        .from('leagues')
        .insert({
          platform,
          platform_league_id: leagueId,
          season,
          league_name: leagueName,
        })
        .select()
        .single()

      if (error) throw error

      // Trigger initial data fetch
      await fetch(`/api/leagues/${data.id}/refresh`, {
        method: 'POST',
      })

      router.push(`/leagues/${data.id}`)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleConnect}>
      <div>
        <label>Platform</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
          <option value="sleeper">Sleeper</option>
          <option value="espn">ESPN</option>
          <option value="yahoo" disabled>Yahoo (Coming Soon)</option>
        </select>
      </div>

      <div>
        <label>League ID</label>
        <input
          type="text"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          placeholder={platform === 'sleeper' ? '1234567890' : 'Your league ID'}
          required
        />
      </div>

      <div>
        <label>Season</label>
        <input
          type="number"
          value={season}
          onChange={(e) => setSeason(parseInt(e.target.value))}
          required
        />
      </div>

      {platform === 'espn' && (
        <div>
          <p>For private ESPN leagues, you'll need to provide cookies after connecting.</p>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Connecting...' : 'Connect League'}
      </button>
    </form>
  )
}
```

#### 7.2 Multi-League Dashboard

```typescript
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeagueList } from '@/components/dashboard/league-list'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1>My Leagues</h1>
      <LeagueList leagues={leagues || []} />
      <a href="/leagues/connect">Connect New League</a>
    </div>
  )
}
```

```typescript
// components/dashboard/league-list.tsx
'use client'

import Link from 'next/link'

interface League {
  id: string
  platform: string
  league_name: string
  season: number
  last_updated: string
}

export function LeagueList({ leagues }: { leagues: League[] }) {
  return (
    <div>
      {leagues.map((league) => (
        <div key={league.id}>
          <Link href={`/leagues/${league.id}`}>
            <h3>{league.league_name}</h3>
            <p>
              {league.platform.toUpperCase()} • {league.season}
            </p>
            <p>
              Last updated: {new Date(league.last_updated).toLocaleString()}
            </p>
          </Link>
        </div>
      ))}
    </div>
  )
}
```

#### 7.3 League-Specific Dashboard

```typescript
// app/leagues/[leagueId]/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { requireLeagueAccess } from '@/lib/middleware/auth'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function LeaguePage({
  params,
}: {
  params: { leagueId: string }
}) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  try {
    const league = await requireLeagueAccess(supabase, user.id, params.leagueId)

    return (
      <div>
        <h1>{league.league_name}</h1>
        <DashboardClient leagueId={params.leagueId} />
      </div>
    )
  } catch (error) {
    redirect('/dashboard')
  }
}
```

---

### Phase 8: Yahoo Integration (Weeks 15-16)

**Goal**: Complete Yahoo OAuth and adapter implementation

#### 8.1 Yahoo OAuth Setup

Register app at https://developer.yahoo.com/apps/

Add to environment:
```bash
YAHOO_CLIENT_ID=your_client_id
YAHOO_CLIENT_SECRET=your_client_secret
YAHOO_REDIRECT_URI=https://yourdomain.com/api/auth/yahoo/callback
```

#### 8.2 OAuth Routes

```typescript
// app/api/auth/yahoo/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth')
  authUrl.searchParams.set('client_id', process.env.YAHOO_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', process.env.YAHOO_REDIRECT_URI!)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('language', 'en-us')

  return NextResponse.redirect(authUrl.toString())
}
```

```typescript
// app/api/auth/yahoo/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const supabase = createServerClient()

  if (!code) {
    return NextResponse.redirect('/dashboard?error=oauth_failed')
  }

  // Exchange code for token
  const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: process.env.YAHOO_REDIRECT_URI!,
      code,
    }),
  })

  const tokens = await tokenResponse.json()

  // Store tokens in session/database
  // TODO: Associate with league being connected

  return NextResponse.redirect('/leagues/connect?platform=yahoo&oauth_success=true')
}
```

#### 8.3 Complete Yahoo Adapter

```typescript
// lib/adapters/yahoo-adapter.ts
import { PlatformAdapter, AdapterConfig, LeagueData, WeeklyScores, ActualStandings } from './types'
import { XMLParser } from 'fast-xml-parser'

export class YahooAdapter implements PlatformAdapter {
  public readonly platform = 'yahoo' as const
  private baseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2'
  private config: AdapterConfig
  private parser: XMLParser

  constructor(config: AdapterConfig) {
    this.config = config
    this.parser = new XMLParser()
  }

  private async fetchXML(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.config.credentials?.accessToken}`,
        'Accept': 'application/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.statusText}`)
    }

    const xml = await response.text()
    return this.parser.parse(xml)
  }

  async fetchLeagueData(leagueId: string, season: number): Promise<LeagueData> {
    const leagueKey = `nfl.l.${leagueId}` // Simplified, may need game_id
    const data = await this.fetchXML(`/league/${leagueKey}/teams`)

    // Parse XML structure
    const league = data.fantasy_content.league
    const teams = Array.isArray(league.teams.team)
      ? league.teams.team
      : [league.teams.team]

    return {
      leagueId,
      leagueName: league.name,
      season,
      currentWeek: league.current_week,
      teams: teams.map((team: any) => ({
        teamId: team.team_key.split('.').pop(),
        teamName: team.name,
        teamAbbrev: team.team_key.split('.').pop(),
        ownerName: team.managers?.manager?.nickname || 'Unknown',
      })),
      settings: {
        numTeams: league.num_teams,
        scoringType: league.scoring_type,
      },
    }
  }

  async fetchWeeklyScores(leagueId: string, season: number, week: number): Promise<WeeklyScores> {
    const leagueKey = `nfl.l.${leagueId}`
    const data = await this.fetchXML(`/league/${leagueKey}/scoreboard;week=${week}`)

    const matchups = data.fantasy_content.league.scoreboard.matchups.matchup
    const scores: Record<string, number> = {}

    for (const matchup of Array.isArray(matchups) ? matchups : [matchups]) {
      const teams = matchup.teams.team
      for (const team of Array.isArray(teams) ? teams : [teams]) {
        const teamId = team.team_key.split('.').pop()
        scores[teamId] = parseFloat(team.team_points.total)
      }
    }

    return { week, scores }
  }

  async fetchActualStandings(leagueId: string, season: number): Promise<ActualStandings[]> {
    const leagueKey = `nfl.l.${leagueId}`
    const data = await this.fetchXML(`/league/${leagueKey}/standings`)

    const teams = data.fantasy_content.league.standings.teams.team

    return (Array.isArray(teams) ? teams : [teams]).map((team: any) => ({
      teamId: team.team_key.split('.').pop(),
      wins: parseInt(team.team_standings.outcome_totals.wins),
      losses: parseInt(team.team_standings.outcome_totals.losses),
      ties: parseInt(team.team_standings.outcome_totals.ties),
      pointsFor: parseFloat(team.team_points.total),
      pointsAgainst: 0, // May not be available
    }))
  }

  async getCurrentWeek(leagueId: string, season: number): Promise<number> {
    const leagueKey = `nfl.l.${leagueId}`
    const data = await this.fetchXML(`/league/${leagueKey}`)
    return parseInt(data.fantasy_content.league.current_week)
  }

  async validateLeagueAccess(leagueId: string): Promise<boolean> {
    try {
      await this.fetchLeagueData(leagueId, new Date().getFullYear())
      return true
    } catch (error) {
      return false
    }
  }
}
```

Install XML parser:
```bash
npm install fast-xml-parser
```

---

## Database Schema Design

### Supabase Tables (Summary)

```
users (managed by Supabase Auth)
  ├── id (UUID, PK)
  ├── email
  └── ... (Supabase managed)

leagues
  ├── id (UUID, PK)
  ├── user_id (FK → users.id)
  ├── platform (espn|sleeper|yahoo)
  ├── platform_league_id (TEXT)
  ├── season (INTEGER)
  ├── league_name (TEXT)
  ├── credentials (JSONB, encrypted)
  ├── last_updated (TIMESTAMPTZ)
  └── is_active (BOOLEAN)

teams
  ├── id (UUID, PK)
  ├── league_id (FK → leagues.id)
  ├── platform_team_id (TEXT)
  ├── team_name (TEXT)
  └── owner_name (TEXT)

weekly_scores
  ├── id (UUID, PK)
  ├── league_id (FK → leagues.id)
  ├── team_id (FK → teams.id)
  ├── week (INTEGER)
  └── score (NUMERIC)

true_records
  ├── id (UUID, PK)
  ├── league_id (FK → leagues.id)
  ├── team_id (FK → teams.id)
  ├── total_wins (INTEGER)
  ├── total_losses (INTEGER)
  └── weekly_records (JSONB)

actual_standings
  ├── id (UUID, PK)
  ├── league_id (FK → leagues.id)
  ├── team_id (FK → teams.id)
  ├── wins/losses/ties (INTEGER)
  └── points_for/against (NUMERIC)

update_jobs
  ├── id (UUID, PK)
  ├── league_id (FK → leagues.id)
  ├── status (pending|running|completed|failed)
  └── error_message (TEXT)
```

### Redis Schema (Summary)

```
# Weekly scores by league
weekly_scores:{leagueId}:{season}:{week} = {teamId: score}

# True records by league
true_records:{leagueId}:{season} = [...records]

# Actual standings by league
actual_standings:{leagueId}:{season} = [...standings]

# Team metadata by league
teams:{leagueId} = {teamId: metadata}

# Last update timestamp
last_update:{leagueId} = ISO timestamp
```

---

## Risk Assessment

### High Risk Areas

1. **ESPN Cookie Authentication**
   - **Risk**: Cookie-based auth doesn't scale for multi-user SaaS
   - **Mitigation**:
     - Option A: Limit to public ESPN leagues only
     - Option B: Require users to provide their own cookies (stored encrypted)
     - Option C: Build ESPN proxy service

2. **Data Migration**
   - **Risk**: Redis schema changes could lose existing data
   - **Mitigation**: Write thorough migration scripts with backups

3. **Rate Limiting**
   - **Risk**: Hitting platform API limits with multiple leagues
   - **Mitigation**: Implement queue with exponential backoff

4. **Yahoo OAuth Complexity**
   - **Risk**: OAuth flow adds significant implementation overhead
   - **Mitigation**: Use proven OAuth libraries, implement last

5. **Supabase RLS Performance**
   - **Risk**: RLS policies may slow queries with large datasets
   - **Mitigation**: Proper indexing, use Redis for hot data

### Medium Risk Areas

6. **Token Management** (Yahoo)
7. **Queue System Failures**
8. **Platform API Changes**
9. **Data Consistency** (Postgres vs Redis)
10. **User Onboarding Friction**

---

## Cost & Performance Considerations

### Supabase Costs

**Free Tier**:
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- Social OAuth providers

**Pro Tier** ($25/month):
- 8GB database
- 100GB file storage
- 100,000 monthly active users

**Estimate**: Start on free tier, upgrade at ~50 users

### Upstash Redis Costs

**Free Tier**:
- 10,000 commands/day
- 256MB storage

**Pay-as-you-go**: $0.2 per 100,000 commands

**Estimate**: ~$5-10/month for 100 leagues

### Upstash QStash Costs

**Free Tier**:
- 500 messages/day

**Pay-as-you-go**: $1 per 100,000 messages

**Estimate**: ~$2/month for weekly updates (100 leagues)

### Total Estimated Costs (100 active leagues)

- Supabase: $25/month
- Redis: $10/month
- QStash: $2/month
- Vercel: $20/month (Hobby+ for cron)
- **Total**: ~$57/month

### Performance Optimizations

1. **Redis as Cache Layer**: Keep hot data (standings, scores) in Redis
2. **Postgres for Source of Truth**: Use Supabase for durable storage
3. **RLS Indexing**: Index `user_id` and `league_id` columns
4. **Queue Rate Limiting**: Throttle platform API calls
5. **CDN Caching**: Cache static assets and API responses where possible

---

## Migration Timeline

### Phase 1: Foundation (Weeks 1-4)
- ✅ Supabase setup
- ✅ Database schema
- ✅ Authentication
- ✅ RLS policies

### Phase 2: Redis Migration (Weeks 5-6)
- ✅ Update Redis key structure
- ✅ Data migration scripts
- ✅ Update Redis helper functions

### Phase 3: Platform Abstraction (Weeks 7-8)
- ✅ Define adapter interface
- ✅ Refactor ESPN adapter
- ✅ Create Sleeper adapter
- ✅ Adapter factory

### Phase 4: API Refactoring (Weeks 9-10)
- ✅ Auth middleware
- ✅ Update all API routes
- ✅ League authorization

### Phase 5: Data Updater (Week 11)
- ✅ Refactor data-updater for adapters
- ✅ Update algorithm integration

### Phase 6: Queue System (Week 12)
- ✅ QStash setup
- ✅ Queue handlers
- ✅ Per-league scheduling

### Phase 7: Frontend (Weeks 13-14)
- ✅ League connection flow
- ✅ Multi-league dashboard
- ✅ League switcher UI

### Phase 8: Yahoo Integration (Weeks 15-16)
- ✅ OAuth implementation
- ✅ Yahoo adapter
- ✅ XML parsing

### Total: 16 weeks

---

## Recommendations Summary

### Immediate Next Steps

1. **Start with Supabase setup** (Phase 1)
   - Create Supabase project
   - Design and implement database schema
   - Set up authentication

2. **Implement Sleeper adapter** (Phase 3)
   - Easiest to implement (no auth)
   - Validates multi-platform architecture
   - Quick win for users

3. **Migrate Redis schema** (Phase 2)
   - Critical for multi-tenancy
   - Can be done in parallel with Supabase

4. **Build queue system early** (Phase 6)
   - Essential for scalability
   - Prevents API rate limit issues

### Platform Implementation Order

1. **Sleeper** (Week 8) - Easiest, no auth
2. **ESPN** (Already done, refactor for multi-tenant)
3. **Yahoo** (Week 16) - Most complex, OAuth + XML

### Critical Success Factors

✅ **Start with solid authentication** (Supabase Auth)
✅ **Proper RLS policies** prevent data leakage
✅ **Queue-based updates** enable scale
✅ **Platform abstraction** makes adding new platforms easy
✅ **Redis for performance** keeps app fast
✅ **Postgres for durability** ensures data safety

---

## Conclusion

Migrating True Champion to a multi-tenant, multi-platform SaaS is achievable within 12-16 weeks. The current codebase has strong foundations (algorithm, service separation, types) but requires fundamental changes:

1. **Authentication & Authorization** (Supabase)
2. **Database Restructuring** (Postgres + Redis)
3. **Platform Abstraction** (Adapter pattern)
4. **Queue-Based Updates** (QStash)
5. **Multi-League UI** (Frontend overhaul)

**Recommended Approach**: Phased migration starting with Supabase foundation, then Sleeper (easiest), then ESPN refactoring, then Yahoo (most complex).

The True Champion algorithm itself is **ready for multi-platform use** - it's the surrounding infrastructure that needs modernization for multi-tenant SaaS architecture.

**Start with Phase 1 (Supabase + Auth) to establish the foundation for all subsequent work.**
