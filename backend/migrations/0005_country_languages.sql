-- Migration 0005: Add country of residence and matchmaking languages JSON array to profiles
ALTER TABLE profiles ADD COLUMN country TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN matchmaking_languages TEXT DEFAULT '["English"]';
