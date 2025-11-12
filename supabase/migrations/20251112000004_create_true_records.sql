-- Create true_records table for storing calculated "true champion" records
-- This table stores what each team's record would be if they played every other team each week

CREATE TABLE IF NOT EXISTS true_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season INTEGER NOT NULL CHECK (season >= 2000 AND season <= 2100),
  total_wins INTEGER DEFAULT 0 CHECK (total_wins >= 0),
  total_losses INTEGER DEFAULT 0 CHECK (total_losses >= 0),
  weekly_records JSONB,
  win_percentage NUMERIC(5, 4) CHECK (win_percentage >= 0 AND win_percentage <= 1),
  rank INTEGER CHECK (rank > 0),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One true record per team per season per league
  UNIQUE(league_id, team_id, season)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_true_records_league_id ON true_records(league_id);
CREATE INDEX IF NOT EXISTS idx_true_records_team_id ON true_records(team_id);
CREATE INDEX IF NOT EXISTS idx_true_records_league_season ON true_records(league_id, season);
CREATE INDEX IF NOT EXISTS idx_true_records_rank ON true_records(league_id, season, rank);

-- Enable Row Level Security
ALTER TABLE true_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view true records in their leagues
CREATE POLICY "Users can view true records in their leagues"
  ON true_records FOR SELECT
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert true records in their leagues
CREATE POLICY "Users can insert true records in their leagues"
  ON true_records FOR INSERT
  TO authenticated
  WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update true records in their leagues
CREATE POLICY "Users can update true records in their leagues"
  ON true_records FOR UPDATE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete true records in their leagues
CREATE POLICY "Users can delete true records in their leagues"
  ON true_records FOR DELETE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_true_records_updated_at
  BEFORE UPDATE ON true_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE true_records IS 'Stores calculated true champion records showing what each team''s record would be playing everyone each week';
