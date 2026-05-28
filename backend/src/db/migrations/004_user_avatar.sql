-- Add avatar_url to users table for Clerk profile image sync
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
