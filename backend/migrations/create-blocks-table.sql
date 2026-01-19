-- Migration: Create blocks table for user blocking functionality
-- Database: thursdate

USE thursdate;

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT NOT NULL,
  blocked_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ensure a user can only block another user once
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  
  -- Indexes for faster queries
  INDEX idx_blocker (blocker_id),
  INDEX idx_blocked (blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
