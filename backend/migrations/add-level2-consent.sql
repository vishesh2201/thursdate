-- Migration: Add Level 2 consent columns to conversations table
-- This enables per-match consent for Level 2 profile sharing

-- Add Level 2 consent columns (similar to Level 3)
ALTER TABLE conversations 
ADD COLUMN level2_user1_consent BOOLEAN DEFAULT FALSE COMMENT 'User 1 consented to share Level 2 with this match';

ALTER TABLE conversations 
ADD COLUMN level2_user2_consent BOOLEAN DEFAULT FALSE COMMENT 'User 2 consented to share Level 2 with this match';

-- For users who have already completed Level 2 in existing matches,
-- automatically grant consent (backward compatibility)
UPDATE conversations 
SET level2_user1_consent = TRUE 
WHERE level2_user1_completed = TRUE;

UPDATE conversations 
SET level2_user2_consent = TRUE 
WHERE level2_user2_completed = TRUE;

SELECT 'Level 2 consent columns added successfully' as status;
