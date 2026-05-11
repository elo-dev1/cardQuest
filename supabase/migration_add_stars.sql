-- Add stars column to collection table for card upgrades
-- Run this in Supabase SQL Editor

ALTER TABLE collection ADD COLUMN IF NOT EXISTS stars INT DEFAULT 0;