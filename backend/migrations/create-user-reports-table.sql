-- Migration: Create user_reports table
-- Purpose: Store user reports for admin review
-- Date: 2026-02-07

USE thursdate;

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reported_user_id INT NOT NULL,
  reported_by_user_id INT NOT NULL,
  conversation_id INT NULL,
  reason ENUM(
    'inappropriate_messages',
    'fake_profile',
    'harassment',
    'spam',
    'other'
  ) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'reviewed', 'action_taken') DEFAULT 'pending',
  admin_notes TEXT NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  
  -- Foreign keys
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes for performance
  INDEX idx_reported_user (reported_user_id),
  INDEX idx_reported_by (reported_by_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  -- Prevent duplicate reports within 24 hours
  UNIQUE KEY unique_report_24h (reported_user_id, reported_by_user_id, conversation_id, created_at)
);

-- Add comment to table
ALTER TABLE user_reports COMMENT = 'Stores user reports for admin moderation';
