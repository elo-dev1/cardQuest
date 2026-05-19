-- Add boost columns to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS active_boosts JSONB DEFAULT '[]';
ALTER TABLE families ADD COLUMN IF NOT EXISTS boost_expires_at JSONB DEFAULT '{}';
