-- Migration: Add soft delete columns to conversations table
-- This allows users to "delete" conversations from their view without affecting the other user

-- Add soft delete columns to conversations table
ALTER TABLE conversations
ADD COLUMN deleted_by_user1 BOOLEAN DEFAULT FALSE COMMENT 'Whether user1 has deleted this conversation from their view',
ADD COLUMN deleted_by_user2 BOOLEAN DEFAULT FALSE COMMENT 'Whether user2 has deleted this conversation from their view';

-- Add index for faster filtering
CREATE INDEX idx_deleted_by_users ON conversations(deleted_by_user1, deleted_by_user2);

-- No migration of existing data needed since all new columns default to FALSE
