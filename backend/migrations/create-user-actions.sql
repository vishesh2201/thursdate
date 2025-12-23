-- Migration: Create user_actions table for match system
-- Database: thursdate (should be configured in .env)

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS user_actions;

-- Create user_actions table
CREATE TABLE user_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  target_user_id INT NOT NULL,
  action_type ENUM('like', 'skip', 'unmatch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ensure a user can only have one action per target user
  UNIQUE KEY unique_action (user_id, target_user_id),
  
  -- Indexes for faster queries
  INDEX idx_user_id (user_id),
  INDEX idx_target_user_id (target_user_id),
  INDEX idx_action_type (action_type)
);

-- Optional: Create a view for mutual matches
CREATE OR REPLACE VIEW mutual_matches AS
SELECT 
    a1.user_id as user1_id,
    a1.target_user_id as user2_id,
    a1.created_at as user1_liked_at,
    a2.created_at as user2_liked_at,
    GREATEST(a1.created_at, a2.created_at) as match_created_at
FROM user_actions a1
JOIN user_actions a2 
    ON a1.user_id = a2.target_user_id 
    AND a1.target_user_id = a2.user_id
WHERE a1.action_type = 'like' 
    AND a2.action_type = 'like';
