-- Migration: Add profile_image_url column to users table for Cloudinary integration
-- Date: 2026-03-26

-- Add profile_image_url column
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500) DEFAULT NULL;

-- Verify column was added
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='users' AND column_name='profile_image_url';
