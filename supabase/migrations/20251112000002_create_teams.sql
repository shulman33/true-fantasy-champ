-- Create teams table for fantasy football team data
-- Teams belong to leagues and are automatically filtered by RLS based on league ownership

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  platform_team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_abbrev TEXT,
  owner_name TEXT,
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One team per league (unique by platform team ID within league)
  UNIQUE(league_id, platform_team_id)
);

-- Create index for efficient league team lookups
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view teams in their leagues
-- This uses a subquery to check if the league belongs to the authenticated user
CREATE POLICY "Users can view teams in their leagues"
  ON teams FOR SELECT
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert teams in their leagues
CREATE POLICY "Users can insert teams in their leagues"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update teams in their leagues
CREATE POLICY "Users can update teams in their leagues"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete teams in their leagues
CREATE POLICY "Users can delete teams in their leagues"
  ON teams FOR DELETE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE teams IS 'Stores fantasy football team data with RLS ensuring users can only access teams from their own leagues';
