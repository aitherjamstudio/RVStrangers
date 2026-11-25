-- Migration 0004: Add interests JSON array column to profiles
ALTER TABLE profiles ADD COLUMN interests TEXT DEFAULT '[]';
