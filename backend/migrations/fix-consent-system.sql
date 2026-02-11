-- Migration: Fix consent system - make NO temporary instead of permanent
-- Date: 2026-01-20
-- Purpose: Change consent from binary (YES/NO) to 3-state (PENDING/ACCEPTED/DECLINED_TEMPORARY)

-- Add new consent state columns to match_levels table
-- Values: 'PENDING', 'ACCEPTED', 'DECLINED_TEMPORARY'
ALTER TABLE match_levels 
ADD COLUMN level2_user1_consent_state ENUM('PENDING', 'ACCEPTED', 'DECLINED_TEMPORARY') DEFAULT 'PENDING' 
COMMENT 'User 1 consent state for Level 2 sharing';

ALTER TABLE match_levels 
ADD COLUMN level2_user2_consent_state ENUM('PENDING', 'ACCEPTED', 'DECLINED_TEMPORARY') DEFAULT 'PENDING' 
COMMENT 'User 2 consent state for Level 2 sharing';

ALTER TABLE match_levels 
ADD COLUMN level3_user1_consent_state ENUM('PENDING', 'ACCEPTED', 'DECLINED_TEMPORARY') DEFAULT 'PENDING' 
COMMENT 'User 1 consent state for Level 3 sharing';

ALTER TABLE match_levels 
ADD COLUMN level3_user2_consent_state ENUM('PENDING', 'ACCEPTED', 'DECLINED_TEMPORARY') DEFAULT 'PENDING' 
COMMENT 'User 2 consent state for Level 3 sharing';

-- Migrate existing data from level2_shared_by_user1/2 (BOOLEAN) to new consent_state columns
UPDATE match_levels 
SET level2_user1_consent_state = CASE 
    WHEN level2_shared_by_user1 = TRUE THEN 'ACCEPTED'
    ELSE 'PENDING'
END;

UPDATE match_levels 
SET level2_user2_consent_state = CASE 
    WHEN level2_shared_by_user2 = TRUE THEN 'ACCEPTED'
    ELSE 'PENDING'
END;

UPDATE match_levels 
SET level3_user1_consent_state = CASE 
    WHEN level3_shared_by_user1 = TRUE THEN 'ACCEPTED'
    ELSE 'PENDING'
END;

UPDATE match_levels 
SET level3_user2_consent_state = CASE 
    WHEN level3_shared_by_user2 = TRUE THEN 'ACCEPTED'
    ELSE 'PENDING'
END;

-- Keep old columns for backward compatibility (will remove in future migration)
-- level2_shared_by_user1, level2_shared_by_user2
-- level3_shared_by_user1, level3_shared_by_user2

-- Migration complete
SELECT 'Migration completed: Added consent state tracking columns' AS status;
