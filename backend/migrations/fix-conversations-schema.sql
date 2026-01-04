-- Fix conversations table column naming to match application code
-- This migration renames user1_id/user2_id to user_id_1/user_id_2

-- Note: This file contains ALTER statements that may fail if columns already have correct names
-- The migration runner will ignore "Unknown column" errors

-- Rename user1_id to user_id_1 (will fail silently if already renamed)
ALTER TABLE conversations CHANGE COLUMN user1_id user_id_1 INT NOT NULL;

-- Rename user2_id to user_id_2 (will fail silently if already renamed)
ALTER TABLE conversations CHANGE COLUMN user2_id user_id_2 INT NOT NULL;

-- Drop old unique constraint if it exists (will fail silently if doesn't exist)
ALTER TABLE conversations DROP INDEX unique_conversation;

-- Recreate unique constraint with correct column names
ALTER TABLE conversations ADD UNIQUE KEY unique_conversation (user_id_1, user_id_2);
