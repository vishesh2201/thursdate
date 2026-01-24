-- Migration: Create match_levels table for multi-level profile system
-- Date: 2026-01-19
-- Purpose: Track profile level progression and sharing consent per match

-- Create match_levels table to track per-match level state
CREATE TABLE IF NOT EXISTS match_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL UNIQUE,
  user_id_1 INT NOT NULL,
  user_id_2 INT NOT NULL,
  
  -- Current level unlocked for this match (1, 2, or 3)
  current_level INT DEFAULT 1,
  
  -- Message tracking for level triggers
  total_messages INT DEFAULT 0,
  user1_message_count INT DEFAULT 0,
  user2_message_count INT DEFAULT 0,
  
  -- Level 2 consent/sharing state
  level2_shared_by_user1 BOOLEAN DEFAULT FALSE,
  level2_shared_by_user2 BOOLEAN DEFAULT FALSE,
  level2_popup_pending_user1 BOOLEAN DEFAULT FALSE,
  level2_popup_pending_user2 BOOLEAN DEFAULT FALSE,
  
  -- Level 3 consent/sharing state
  level3_shared_by_user1 BOOLEAN DEFAULT FALSE,
  level3_shared_by_user2 BOOLEAN DEFAULT FALSE,
  level3_popup_pending_user1 BOOLEAN DEFAULT FALSE,
  level3_popup_pending_user2 BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ensure user_id_1 < user_id_2 for consistency
  CHECK (user_id_1 < user_id_2),
  
  -- Indexes for fast queries
  INDEX idx_conversation (conversation_id),
  INDEX idx_users (user_id_1, user_id_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Users table already has level2_questions_completed and level3_questions_completed columns
-- No need to add new columns

-- Migration complete
SELECT 'Migration completed: Created match_levels table and added user completion flags' AS status;
