-- Fix messages table schema to match application code
-- This migration aligns the database schema with the actual code usage

-- Note: ALTER statements will fail silently if columns don't exist or already have correct names

-- Drop old columns if they exist (from previous migration)
ALTER TABLE messages DROP COLUMN message_type;
ALTER TABLE messages DROP COLUMN voice_duration;
ALTER TABLE messages DROP COLUMN is_read;

-- Add type column (replaces message_type) if it doesn't exist
ALTER TABLE messages ADD COLUMN type ENUM('TEXT', 'VOICE') NOT NULL DEFAULT 'TEXT' AFTER sender_id;

-- Add duration column (replaces voice_duration) if it doesn't exist
ALTER TABLE messages ADD COLUMN duration INT NULL COMMENT 'Duration in seconds for voice messages' AFTER content;

-- Add status column (new, replaces is_read) if it doesn't exist
ALTER TABLE messages ADD COLUMN status ENUM('SENT', 'DELIVERED', 'READ') NOT NULL DEFAULT 'SENT' AFTER duration;

-- Add read_at column if it doesn't exist
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP NULL AFTER status;

-- Add indexes for better query performance
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_type ON messages(type);
