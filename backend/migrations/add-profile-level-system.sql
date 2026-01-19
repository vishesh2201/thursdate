-- Migration: Add Profile Level System for Progressive Visibility
-- This implements a trust-based profile reveal system based on chat interaction

USE defaultdb;

-- Add level tracking columns to conversations table
ALTER TABLE conversations ADD COLUMN current_level INT DEFAULT 1 COMMENT 'Current relationship level (1-3)';

ALTER TABLE conversations ADD COLUMN message_count INT DEFAULT 0 COMMENT 'Total messages exchanged';

ALTER TABLE conversations ADD COLUMN level2_user1_completed BOOLEAN DEFAULT FALSE COMMENT 'User 1 completed Level 2 questions';

ALTER TABLE conversations ADD COLUMN level2_user2_completed BOOLEAN DEFAULT FALSE COMMENT 'User 2 completed Level 2 questions';

ALTER TABLE conversations ADD COLUMN level3_user1_consent BOOLEAN DEFAULT FALSE COMMENT 'User 1 consented to Level 3 visibility';

ALTER TABLE conversations ADD COLUMN level3_user2_consent BOOLEAN DEFAULT FALSE COMMENT 'User 2 consented to Level 3 visibility';

ALTER TABLE conversations ADD COLUMN level2_unlocked_at TIMESTAMP NULL COMMENT 'When Level 2 was unlocked';

ALTER TABLE conversations ADD COLUMN level3_unlocked_at TIMESTAMP NULL COMMENT 'When Level 3 was unlocked';

-- Add profile completion tracking to users table
ALTER TABLE users ADD COLUMN level2_questions_completed BOOLEAN DEFAULT FALSE COMMENT 'Has completed Level 2 profile questions';

ALTER TABLE users ADD COLUMN level3_questions_completed BOOLEAN DEFAULT FALSE COMMENT 'Has completed Level 3 profile questions';

ALTER TABLE users ADD COLUMN level2_completed_at TIMESTAMP NULL COMMENT 'When Level 2 was completed';

ALTER TABLE users ADD COLUMN level3_completed_at TIMESTAMP NULL COMMENT 'When Level 3 was completed';

-- Initialize existing conversations to Level 1
UPDATE conversations SET current_level = 1 WHERE current_level IS NULL;

-- Count existing messages for each conversation
UPDATE conversations c
SET message_count = (
    SELECT COUNT(*) 
    FROM messages m 
    WHERE m.conversation_id = c.id
)
WHERE message_count = 0;

-- Mark users who have completed onboarding as having Level 3 ready
UPDATE users 
SET level3_questions_completed = TRUE,
    level3_completed_at = created_at
WHERE onboarding_complete = TRUE AND level3_questions_completed = FALSE;
