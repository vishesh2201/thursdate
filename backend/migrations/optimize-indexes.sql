-- Optimization: Add composite index for faster match queries
-- Run this after the initial migration

USE thursdate;

-- Add composite index for mutual match lookups
-- This speeds up queries that check if two users liked each other
ALTER TABLE user_actions 
ADD INDEX idx_mutual_check (target_user_id, user_id, action_type);

-- Add index on approval and onboarding_complete for potential matches query
ALTER TABLE users
ADD INDEX idx_potential_matches (approval, onboarding_complete, id);

-- Verify indexes
SHOW INDEX FROM user_actions;
SHOW INDEX FROM users;
