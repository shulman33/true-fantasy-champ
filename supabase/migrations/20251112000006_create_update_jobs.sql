-- Create update_jobs table for tracking background data refresh jobs
-- Provides visibility into sync status and errors

CREATE TABLE IF NOT EXISTS update_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  weeks_updated INTEGER[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_update_jobs_league_id ON update_jobs(league_id);
CREATE INDEX IF NOT EXISTS idx_update_jobs_status ON update_jobs(status);
CREATE INDEX IF NOT EXISTS idx_update_jobs_created_at ON update_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_update_jobs_league_status ON update_jobs(league_id, status);

-- Enable Row Level Security
ALTER TABLE update_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view update jobs for their leagues
CREATE POLICY "Users can view update jobs for their leagues"
  ON update_jobs FOR SELECT
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert update jobs for their leagues
CREATE POLICY "Users can insert update jobs for their leagues"
  ON update_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update update jobs for their leagues
CREATE POLICY "Users can update update jobs for their leagues"
  ON update_jobs FOR UPDATE
  TO authenticated
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE update_jobs IS 'Tracks background jobs for refreshing league data from fantasy platforms';
