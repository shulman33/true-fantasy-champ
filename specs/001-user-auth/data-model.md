# Data Model: User Authentication & Authorization

**Feature**: 001-user-auth
**Date**: 2025-11-12 (Updated: 2025-11-12)
**Phase**: 1 - Design

## Overview

This document defines the data entities, relationships, and validation rules for the user authentication and authorization system. The model uses Supabase's built-in `auth.users` schema with custom tables for multi-league, multi-platform fantasy football tracking with complete user data isolation.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│   auth.users        │  (Supabase built-in)
│─────────────────────│
│ id (PK)             │
│ email (unique)      │
│ encrypted_password  │
│ email_confirmed_at  │
│ created_at          │
│ updated_at          │
│ last_sign_in_at     │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────────────────────┐
│   leagues                                │
│──────────────────────────────────────────│
│ id (PK)                                  │
│ user_id (FK) ────────────────────────────┼──── 1:N from auth.users
│ platform (espn/sleeper/yahoo)            │
│ platform_league_id                       │
│ season                                   │
│ league_name                              │
│ league_metadata (JSONB)                  │
│ credentials (JSONB, encrypted)           │
│ is_active                                │
│ last_updated                             │
└────┬─────────────────────────────────────┘
     │
     │ 1:N
     │
┌────▼─────────────────┐       ┌──────────────────────┐
│   teams              │       │   weekly_scores      │
│──────────────────────│       │──────────────────────│
│ id (PK)              │       │ id (PK)              │
│ league_id (FK) ──────┼───┐   │ league_id (FK) ──────┼───┐
│ platform_team_id     │   │   │ team_id (FK)         │   │
│ team_name            │   │   │ week                 │   │
│ team_abbrev          │   │   │ score                │   │
│ owner_name           │   │   └──────────────────────┘   │
│ avatar_url           │   │                              │
│ metadata (JSONB)     │   │                              │
└──────────┬───────────┘   │   ┌──────────────────────┐   │
           │               │   │   true_records       │   │
           │               │   │──────────────────────│   │
           │               └───┼─ league_id (FK)      │   │
           │                   │ team_id (FK) ────────┼───┘
           │                   │ season               │
           │                   │ total_wins           │
           │                   │ total_losses         │
           │                   │ weekly_records       │
           │                   │ win_percentage       │
           │                   │ rank                 │
           │                   └──────────────────────┘
           │
           │               ┌──────────────────────────┐
           │               │   actual_standings       │
           │               │──────────────────────────│
           └───────────────┼─ league_id (FK)          │
                           │ team_id (FK)             │
                           │ season                   │
                           │ wins/losses/ties         │
                           │ points_for/against       │
                           └──────────────────────────┘

                           ┌──────────────────────────┐
                           │   update_jobs            │
                           │──────────────────────────│
                           │ id (PK)                  │
                           │ league_id (FK)           │
                           │ status                   │
                           │ started_at               │
                           │ completed_at             │
                           │ error_message            │
                           │ weeks_updated            │
                           └──────────────────────────┘
```

---

## Entities

### 1. User (auth.users)

**Source**: Supabase built-in table

**Description**: Core user account managed by Supabase Auth. Handles authentication, password hashing, email verification, and session management.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (lowercased) |
| `encrypted_password` | TEXT | NULL | Bcrypt-hashed password (NULL for OAuth-only users) |
| `email_confirmed_at` | TIMESTAMP | NULL | When user verified their email |
| `confirmation_token` | TEXT | NULL | Single-use token for email verification |
| `confirmation_sent_at` | TIMESTAMP | NULL | When verification email was sent |
| `recovery_token` | TEXT | NULL | Single-use token for password reset |
| `recovery_sent_at` | TIMESTAMP | NULL | When password reset email was sent |
| `last_sign_in_at` | TIMESTAMP | NULL | Last successful login timestamp |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_users_email` on `email` (unique, for fast login lookups)
- `idx_users_confirmation_token` on `confirmation_token` (for verification)
- `idx_users_recovery_token` on `recovery_token` (for password reset)

**Validation Rules**:
- Email must match regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password must be minimum 8 characters, contain at least one letter and one number
- Email stored in lowercase to prevent case-sensitivity issues

**Security**:
- Passwords hashed with bcrypt (12+ rounds)
- Tokens are single-use and expire (24h for verification, 1h for password reset)
- Managed by Supabase Auth, not directly accessible via API

---

### 2. League (leagues)

**Source**: Custom table

**Description**: Represents a fantasy football league tracked by a user. Supports multiple platforms (ESPN, Sleeper, Yahoo) and stores platform-specific credentials and metadata.

**Schema**:

```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('espn', 'sleeper', 'yahoo')),
  platform_league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  league_name TEXT,
  league_metadata JSONB,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(platform, platform_league_id, season)
);

CREATE INDEX idx_leagues_user_id ON leagues(user_id);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leagues"
  ON leagues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leagues"
  ON leagues FOR UPDATE
  USING (auth.uid() = user_id);
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | FK → auth.users(id), NOT NULL | Owner of this league |
| `platform` | TEXT | NOT NULL, CHECK IN ('espn', 'sleeper', 'yahoo') | Platform provider |
| `platform_league_id` | TEXT | NOT NULL | League ID from the platform |
| `season` | INTEGER | NOT NULL | Season year (e.g., 2025) |
| `league_name` | TEXT | NULL | Friendly name of the league |
| `league_metadata` | JSONB | NULL | Platform-specific settings/config |
| `credentials` | JSONB | NULL | Encrypted platform credentials (ESPN cookies, Yahoo tokens, etc.) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether league is currently tracked |
| `last_updated` | TIMESTAMPTZ | NULL | Last successful data sync |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When league was added |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Unique Constraint**: `(platform, platform_league_id, season)` - Prevents duplicate leagues across all users

**Indexes**:
- `idx_leagues_user_id` on `user_id` (for user's league list queries)

**Validation Rules**:
- Platform must be one of: 'espn', 'sleeper', 'yahoo'
- Season must be a valid year (e.g., 2000-2100)
- Platform league ID validated by attempting API call before insert
- Credentials encrypted at rest using Supabase Vault or app-level encryption

**Relationships**:
- **N:1 with auth.users** (many leagues per user)
- **1:N with teams** (one league has many teams)
- **1:N with weekly_scores** (one league has many weekly scores)
- **1:N with true_records** (one league has many true records)

**Credentials Storage** (JSONB examples):

```typescript
// ESPN credentials
{
  "swid": "{E69E2F1C-7931-47C0-B4EE-2B439DDBC136}",
  "espn_s2": "AEBxxxxxxxxxx..."
}

// Sleeper (typically no credentials needed for public leagues)
{}

// Yahoo OAuth
{
  "access_token": "xxx",
  "refresh_token": "yyy",
  "expires_at": 1699878000
}
```

**TypeScript Interface**:

```typescript
interface League {
  id: string
  user_id: string
  platform: 'espn' | 'sleeper' | 'yahoo'
  platform_league_id: string
  season: number
  league_name: string | null
  league_metadata: Record<string, any> | null
  credentials: Record<string, any> | null // Encrypted
  is_active: boolean
  last_updated: string | null
  created_at: string
  updated_at: string
}

// Validation Schema (Zod)
export const AddLeagueSchema = z.object({
  platform: z.enum(['espn', 'sleeper', 'yahoo']),
  platform_league_id: z.string().min(1),
  season: z.number().int().min(2000).max(2100),
  league_name: z.string().optional(),
  credentials: z.record(z.any()).optional()
})
```

---

### 3. Team (teams)

**Source**: Custom table

**Description**: Represents a fantasy football team within a league. Stores team metadata from the platform.

**Schema**:

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  platform_team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_abbrev TEXT,
  owner_name TEXT,
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, platform_team_id)
);

CREATE INDEX idx_teams_league_id ON teams(league_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their leagues"
  ON teams FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `league_id` | UUID | FK → leagues(id), NOT NULL | Parent league |
| `platform_team_id` | TEXT | NOT NULL | Team ID from the platform |
| `team_name` | TEXT | NOT NULL | Team name |
| `team_abbrev` | TEXT | NULL | Team abbreviation |
| `owner_name` | TEXT | NULL | Owner's name from platform |
| `avatar_url` | TEXT | NULL | Team logo/avatar URL |
| `metadata` | JSONB | NULL | Platform-specific team data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When team was added |

**Unique Constraint**: `(league_id, platform_team_id)` - One team per league

**Indexes**:
- `idx_teams_league_id` on `league_id` (for league's team list queries)

**Relationships**:
- **N:1 with leagues** (many teams per league)
- **1:N with weekly_scores** (one team has many weekly scores)
- **1:1 with true_records** (per season)
- **1:1 with actual_standings** (per season)

**TypeScript Interface**:

```typescript
interface Team {
  id: string
  league_id: string
  platform_team_id: string
  team_name: string
  team_abbrev: string | null
  owner_name: string | null
  avatar_url: string | null
  metadata: Record<string, any> | null
  created_at: string
}
```

---

### 4. WeeklyScore (weekly_scores)

**Source**: Custom table

**Description**: Stores each team's score for each week of the season. Used to calculate true records.

**Schema**:

```sql
CREATE TABLE weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  score NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, week)
);

CREATE INDEX idx_weekly_scores_league_id ON weekly_scores(league_id);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in their leagues"
  ON weekly_scores FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `league_id` | UUID | FK → leagues(id), NOT NULL | Parent league |
| `team_id` | UUID | FK → teams(id), NOT NULL | Team that scored |
| `week` | INTEGER | NOT NULL | Week number (1-18 typically) |
| `score` | NUMERIC(10, 2) | NOT NULL | Team's score for the week |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When score was recorded |

**Unique Constraint**: `(league_id, team_id, week)` - One score per team per week

**Indexes**:
- `idx_weekly_scores_league_id` on `league_id` (for league's scores)
- `idx_weekly_scores_week` on `week` (for weekly queries)

**Relationships**:
- **N:1 with leagues** (many scores per league)
- **N:1 with teams** (many scores per team)

**TypeScript Interface**:

```typescript
interface WeeklyScore {
  id: string
  league_id: string
  team_id: string
  week: number
  score: number
  created_at: string
}
```

---

### 5. TrueRecord (true_records)

**Source**: Custom table

**Description**: Stores the calculated "true record" for each team - what their record would be if they played every other team each week.

**Schema**:

```sql
CREATE TABLE true_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  weekly_records JSONB,
  win_percentage NUMERIC(5, 4),
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, season)
);

CREATE INDEX idx_true_records_league_id ON true_records(league_id);

ALTER TABLE true_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view true records in their leagues"
  ON true_records FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `league_id` | UUID | FK → leagues(id), NOT NULL | Parent league |
| `team_id` | UUID | FK → teams(id), NOT NULL | Team these records belong to |
| `season` | INTEGER | NOT NULL | Season year |
| `total_wins` | INTEGER | DEFAULT 0 | Total wins across all weeks |
| `total_losses` | INTEGER | DEFAULT 0 | Total losses across all weeks |
| `weekly_records` | JSONB | NULL | Week-by-week W-L breakdown |
| `win_percentage` | NUMERIC(5, 4) | NULL | Win % (e.g., 0.6667) |
| `rank` | INTEGER | NULL | Ranking within league |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last calculation time |

**Unique Constraint**: `(league_id, team_id, season)` - One true record per team per season

**weekly_records JSONB format**:
```json
{
  "1": { "wins": 2, "losses": 1 },
  "2": { "wins": 3, "losses": 0 },
  "3": { "wins": 1, "losses": 2 }
}
```

**TypeScript Interface**:

```typescript
interface TrueRecord {
  id: string
  league_id: string
  team_id: string
  season: number
  total_wins: number
  total_losses: number
  weekly_records: Record<string, { wins: number; losses: number }> | null
  win_percentage: number | null
  rank: number | null
  updated_at: string
}
```

---

### 6. ActualStanding (actual_standings)

**Source**: Custom table

**Description**: Stores the actual league standings from the platform (as opposed to calculated true records).

**Schema**:

```sql
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

CREATE INDEX idx_actual_standings_league_id ON actual_standings(league_id);

ALTER TABLE actual_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view standings in their leagues"
  ON actual_standings FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `league_id` | UUID | FK → leagues(id), NOT NULL | Parent league |
| `team_id` | UUID | FK → teams(id), NOT NULL | Team these standings belong to |
| `season` | INTEGER | NOT NULL | Season year |
| `wins` | INTEGER | DEFAULT 0 | Actual wins from platform |
| `losses` | INTEGER | DEFAULT 0 | Actual losses from platform |
| `ties` | INTEGER | DEFAULT 0 | Actual ties (if applicable) |
| `points_for` | NUMERIC(10, 2) | DEFAULT 0 | Total points scored |
| `points_against` | NUMERIC(10, 2) | DEFAULT 0 | Total points allowed |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Unique Constraint**: `(league_id, team_id, season)` - One standing per team per season

**TypeScript Interface**:

```typescript
interface ActualStanding {
  id: string
  league_id: string
  team_id: string
  season: number
  wins: number
  losses: number
  ties: number
  points_for: number
  points_against: number
  updated_at: string
}
```

---

### 7. UpdateJob (update_jobs)

**Source**: Custom table

**Description**: Tracks background jobs for refreshing league data from platforms. Provides visibility into sync status and errors.

**Schema**:

```sql
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
```

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT gen_random_uuid() | Unique identifier |
| `league_id` | UUID | FK → leagues(id), NOT NULL | League being updated |
| `status` | TEXT | CHECK IN ('pending', 'running', 'completed', 'failed') | Job status |
| `started_at` | TIMESTAMPTZ | NULL | When job started |
| `completed_at` | TIMESTAMPTZ | NULL | When job finished |
| `error_message` | TEXT | NULL | Error details if failed |
| `weeks_updated` | INTEGER[] | NULL | Array of week numbers updated |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When job was created |

**TypeScript Interface**:

```typescript
interface UpdateJob {
  id: string
  league_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  weeks_updated: number[] | null
  created_at: string
}
```

---

## Data Isolation Strategy

### Row Level Security (RLS) Policies

**Principle**: All custom tables use RLS with policies that ensure users can only access data from leagues they own.

**Applied Policies**:

1. **leagues**: Direct user_id check
   ```sql
   USING (auth.uid() = user_id)
   ```

2. **teams, weekly_scores, true_records, actual_standings, update_jobs**: Subquery check
   ```sql
   USING (
     league_id IN (
       SELECT id FROM leagues WHERE user_id = auth.uid()
     )
   )
   ```

**Why Subquery Pattern?**
- Teams, scores, and records don't have direct user_id foreign keys
- They reference leagues, which reference users
- Subquery ensures data isolation through the league → user relationship
- PostgreSQL optimizes these subqueries efficiently

**Testing RLS**:
```sql
-- Test as User A
SET request.jwt.claims.sub = 'user-a-uuid';
SELECT * FROM teams;  -- Should only return teams from User A's leagues

-- Test as User B
SET request.jwt.claims.sub = 'user-b-uuid';
SELECT * FROM teams;  -- Should only return teams from User B's leagues

-- Verify isolation
SELECT * FROM teams WHERE league_id = '<user-a-league-id>';
-- If run as User B, should return 0 rows even though league exists
```

---

## Migration Scripts

### Initial Schema Setup

```sql
-- File: supabase/migrations/20251112000001_create_leagues.sql

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('espn', 'sleeper', 'yahoo')),
  platform_league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  league_name TEXT,
  league_metadata JSONB,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(platform, platform_league_id, season)
);

CREATE INDEX idx_leagues_user_id ON leagues(user_id);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leagues"
  ON leagues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leagues"
  ON leagues FOR UPDATE
  USING (auth.uid() = user_id);
```

```sql
-- File: supabase/migrations/20251112000002_create_teams_and_scores.sql

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  platform_team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_abbrev TEXT,
  owner_name TEXT,
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, platform_team_id)
);

CREATE INDEX idx_teams_league_id ON teams(league_id);

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

CREATE INDEX idx_weekly_scores_league_id ON weekly_scores(league_id);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in their leagues"
  ON weekly_scores FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

```sql
-- File: supabase/migrations/20251112000003_create_records_and_standings.sql

CREATE TABLE true_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  weekly_records JSONB,
  win_percentage NUMERIC(5, 4),
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, team_id, season)
);

CREATE INDEX idx_true_records_league_id ON true_records(league_id);

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

CREATE INDEX idx_actual_standings_league_id ON actual_standings(league_id);

ALTER TABLE actual_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view standings in their leagues"
  ON actual_standings FOR SELECT
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );
```

```sql
-- File: supabase/migrations/20251112000004_create_update_jobs.sql

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
```

---

## Type Generation

**Command**:
```bash
supabase gen types typescript --linked > src/types/database.ts
```

**Generated Types** (example):
```typescript
export interface Database {
  public: {
    Tables: {
      leagues: {
        Row: {
          id: string
          user_id: string
          platform: 'espn' | 'sleeper' | 'yahoo'
          platform_league_id: string
          season: number
          league_name: string | null
          league_metadata: Record<string, any> | null
          credentials: Record<string, any> | null
          is_active: boolean
          last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'espn' | 'sleeper' | 'yahoo'
          platform_league_id: string
          season: number
          league_name?: string | null
          league_metadata?: Record<string, any> | null
          credentials?: Record<string, any> | null
          is_active?: boolean
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          // ... similar to Insert but all fields optional
        }
      }
      teams: {
        // ... similar structure
      }
      weekly_scores: {
        // ... similar structure
      }
      true_records: {
        // ... similar structure
      }
      actual_standings: {
        // ... similar structure
      }
      update_jobs: {
        // ... similar structure
      }
    }
  }
}
```

---

## Summary

**Total Custom Tables**: 6 (leagues, teams, weekly_scores, true_records, actual_standings, update_jobs)
**Supabase Built-In Tables Used**: 2 (auth.users, auth.sessions)
**RLS Policies**: 6 (one per custom table, using subquery pattern for non-league tables)
**Indexes**: 8 total (optimized for user-scoped and league-scoped queries)
**Data Isolation Method**: Multi-layered (RLS subqueries + Middleware + Service Layer)
**Multi-Platform Support**: YES (espn, sleeper, yahoo via platform column)

**Key Design Decisions**:
1. **Single `leagues` table** instead of `user_leagues` - more flexible for multi-platform
2. **JSONB for metadata and credentials** - supports platform-specific differences without schema changes
3. **Subquery RLS pattern** - ensures data isolation through league ownership
4. **Separate tables for true records vs actual standings** - cleaner data model, easier to compare
5. **Update jobs table** - provides visibility into background sync processes

**Next Steps**:
1. Run migrations in Supabase Dashboard or via CLI
2. Generate TypeScript types
3. Update API contracts to use `leagues` table instead of `user_leagues`
4. Implement platform adapters (ESPN, Sleeper, Yahoo)
5. Update services to work with new multi-platform schema
