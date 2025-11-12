-- Create weekly_scores table for storing team scores by week
-- Used to calculate true champion records

CREATE TABLE IF NOT EXISTS weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 18),
  score NUMERIC(10, 2) NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One score per team per week per league
  UNIQUE(league_id, team_id, week)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_scores_league_id ON weekly_scores(league_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_team_id ON weekly_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_week ON weekly_scores(week);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_league_week ON weekly_scores(league_id, week);

-- Enable Row Level Security
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view scores in their leagues
CREATE POLICY "Users can view scores in their leagues"
  ON weekly_scores FOR SELECT
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert scores in their leagues
CREATE POLICY "Users can insert scores in their leagues"
  ON weekly_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update scores in their leagues
CREATE POLICY "Users can update scores in their leagues"
  ON weekly_scores FOR UPDATE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete scores in their leagues
CREATE POLICY "Users can delete scores in their leagues"
  ON weekly_scores FOR DELETE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE weekly_scores IS 'Stores weekly team scores for true champion calculation with RLS-enforced league isolation';
