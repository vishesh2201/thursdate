-- Migration: Add per-level message counters to block progression
-- Date: 2026-02-03
-- Purpose: CRITICAL FIX - Prevent Level 3 from triggering without Level 2 consent
-- 
-- BUG: Currently Level 3 can trigger at 10 total messages even if Level 2 consent is PENDING
-- FIX: Add separate message counters for each level that reset upon consent
--
-- BLOCKING LOGIC:
-- - level2_message_count: Counts from start, triggers Level 2 at 5 messages
-- - level3_message_count: Only starts counting AFTER both users ACCEPT Level 2
-- - When Level 2 consent given by both, level3_message_count resets to 0
-- - Level 3 triggers when level3_message_count reaches 5 (not total_messages = 10)

ALTER TABLE match_levels
ADD COLUMN level2_message_count INT DEFAULT 0 COMMENT 'Messages counted toward Level 2 unlock',
ADD COLUMN level3_message_count INT DEFAULT 0 COMMENT 'Messages counted toward Level 3 (only after Level 2 consent)';

-- Backfill existing data:
-- - For conversations with current_level = 1: level2_message_count = total_messages
-- - For conversations with current_level >= 2: level2_message_count = 5 (threshold met)
-- - For conversations where BOTH users accepted Level 2: 
--   level3_message_count = total_messages - 5 (messages after Level 2)
-- - For conversations where Level 2 NOT fully accepted:
--   level3_message_count = 0 (blocked progression)

UPDATE match_levels ml
SET 
  level2_message_count = CASE
    WHEN ml.current_level = 1 THEN ml.total_messages
    ELSE 5
  END,
  level3_message_count = CASE
    -- Only count toward Level 3 if BOTH users have ACCEPTED Level 2
    WHEN ml.current_level >= 2 
         AND ml.level2_user1_consent_state = 'ACCEPTED' 
         AND ml.level2_user2_consent_state = 'ACCEPTED'
    THEN GREATEST(0, ml.total_messages - 5)
    ELSE 0
  END;

-- Migration complete
SELECT 'Migration completed: Added per-level message counters for blocking progression' AS status;
