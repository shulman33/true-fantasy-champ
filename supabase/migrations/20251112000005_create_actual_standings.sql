-- Create actual_standings table for storing actual league standings from the platform
-- This allows comparison between true records and actual standings

CREATE TABLE IF NOT EXISTS actual_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL CHECK (season >= 2000 AND season <= 2100),
  wins INTEGER DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 CHECK (losses >= 0),
  ties INTEGER DEFAULT 0 CHECK (ties >= 0),
  points_for NUMERIC(10, 2) DEFAULT 0 CHECK (points_for >= 0),
  points_against NUMERIC(10, 2) DEFAULT 0 CHECK (points_against >= 0),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One standing per team per season per league
  UNIQUE(league_id, team_id, season)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_actual_standings_league_id ON actual_standings(league_id);
CREATE INDEX IF NOT EXISTS idx_actual_standings_team_id ON actual_standings(team_id);
CREATE INDEX IF NOT EXISTS idx_actual_standings_league_season ON actual_standings(league_id, season);

-- Enable Row Level Security
ALTER TABLE actual_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view standings in their leagues
CREATE POLICY "Users can view standings in their leagues"
  ON actual_standings FOR SELECT
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert standings in their leagues
CREATE POLICY "Users can insert standings in their leagues"
  ON actual_standings FOR INSERT
  TO authenticated
  WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update standings in their leagues
CREATE POLICY "Users can update standings in their leagues"
  ON actual_standings FOR UPDATE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete standings in their leagues
CREATE POLICY "Users can delete standings in their leagues"
  ON actual_standings FOR DELETE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_actual_standings_updated_at
  BEFORE UPDATE ON actual_standings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE actual_standings IS 'Stores actual league standings from the platform for comparison with true records';
