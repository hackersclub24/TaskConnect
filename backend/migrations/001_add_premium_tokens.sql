-- Migration: Add premium tokens and is_premium fields to users table
-- Date: 2026-03-26

-- Add premium_tokens column
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_tokens INTEGER NOT NULL DEFAULT 0;

-- Add is_premium column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='users' AND column_name IN ('premium_tokens', 'is_premium');
