-- Migration: Add match timing columns for 7-day match expiry system
-- This migration adds tracking for match creation, first message, and reply timing

USE thursdate;

-- Add columns to track match timing and conversation state
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS match_created_at TIMESTAMP NULL COMMENT 'When the two users matched',
  ADD COLUMN IF NOT EXISTS first_message_at TIMESTAMP NULL COMMENT 'When the first message was sent',
  ADD COLUMN IF NOT EXISTS first_message_sender_id INT NULL COMMENT 'Who sent the first message',
  ADD COLUMN IF NOT EXISTS reply_at TIMESTAMP NULL COMMENT 'When the recipient replied',
  ADD COLUMN IF NOT EXISTS match_expired BOOLEAN DEFAULT FALSE COMMENT 'Whether the match has expired',
  ADD COLUMN IF NOT EXISTS match_expires_at TIMESTAMP NULL COMMENT 'When the match will expire (7 days from match)';

-- Add foreign key for first_message_sender_id
ALTER TABLE conversations
  ADD CONSTRAINT fk_first_message_sender 
  FOREIGN KEY (first_message_sender_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_match_expires_at ON conversations(match_expires_at);
CREATE INDEX IF NOT EXISTS idx_match_expired ON conversations(match_expired);
CREATE INDEX IF NOT EXISTS idx_first_message_at ON conversations(first_message_at);

-- Update existing conversations to set match_created_at from their created_at
UPDATE conversations 
SET match_created_at = created_at,
    match_expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE match_created_at IS NULL;

-- For conversations that already have messages, update first_message_at
UPDATE conversations c
JOIN (
  SELECT conversation_id, MIN(created_at) as first_msg_time, 
         (SELECT sender_id FROM messages WHERE conversation_id = c2.conversation_id ORDER BY created_at ASC LIMIT 1) as first_sender
  FROM messages c2
  GROUP BY conversation_id
) m ON c.id = m.conversation_id
SET c.first_message_at = m.first_msg_time,
    c.first_message_sender_id = m.first_sender
WHERE c.first_message_at IS NULL;

-- For conversations with replies (2+ messages from different senders), set reply_at
UPDATE conversations c
JOIN (
  SELECT m1.conversation_id, MIN(m2.created_at) as reply_time
  FROM messages m1
  JOIN messages m2 ON m1.conversation_id = m2.conversation_id AND m1.sender_id != m2.sender_id
  WHERE m2.created_at > m1.created_at
  GROUP BY m1.conversation_id
) r ON c.id = r.conversation_id
SET c.reply_at = r.reply_time
WHERE c.reply_at IS NULL AND c.first_message_at IS NOT NULL;
