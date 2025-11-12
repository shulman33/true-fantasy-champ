-- Create leagues table for multi-user, multi-platform fantasy football tracking
-- This table stores user-league associations with platform-specific credentials

CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('espn', 'sleeper', 'yahoo')),
  platform_league_id TEXT NOT NULL,
  season INTEGER NOT NULL CHECK (season >= 2000 AND season <= 2100),
  league_name TEXT,
  league_metadata JSONB,
  credentials JSONB,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique leagues across all users
  UNIQUE(platform, platform_league_id, season)
);

-- Create index for efficient user league lookups
CREATE INDEX IF NOT EXISTS idx_leagues_user_id ON leagues(user_id);

-- Create index for platform + league ID lookups
CREATE INDEX IF NOT EXISTS idx_leagues_platform_league_id ON leagues(platform, platform_league_id);

-- Enable Row Level Security
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own leagues
CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own leagues
CREATE POLICY "Users can insert own leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own leagues
CREATE POLICY "Users can update own leagues"
  ON leagues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own leagues
CREATE POLICY "Users can delete own leagues"
  ON leagues FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE leagues IS 'Stores user-league associations for multi-platform fantasy football tracking with RLS-enforced data isolation';
