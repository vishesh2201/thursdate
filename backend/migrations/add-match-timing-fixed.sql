-- Migration: Add match timing columns for 7-day match expiry system (MySQL compatible)

-- Add columns (remove IF NOT EXISTS for MySQL compatibility)
ALTER TABLE conversations 
  ADD COLUMN match_created_at TIMESTAMP NULL COMMENT 'When the two users matched',
  ADD COLUMN match_expires_at TIMESTAMP NULL COMMENT 'When the match will expire (7 days from match)',
  ADD COLUMN first_message_at TIMESTAMP NULL COMMENT 'When the first message was sent',
  ADD COLUMN first_message_sender_id INT NULL COMMENT 'Who sent the first message',
  ADD COLUMN reply_at TIMESTAMP NULL COMMENT 'When the recipient replied',
  ADD COLUMN match_expired BOOLEAN DEFAULT FALSE COMMENT 'Whether the match has expired';

-- Add foreign key for first_message_sender_id
ALTER TABLE conversations
  ADD CONSTRAINT fk_first_message_sender 
  FOREIGN KEY (first_message_sender_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX idx_match_expires_at ON conversations(match_expires_at);
CREATE INDEX idx_match_expired ON conversations(match_expired);
CREATE INDEX idx_first_message_at ON conversations(first_message_at);

-- Update existing conversations
UPDATE conversations 
SET match_created_at = created_at,
    match_expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE match_created_at IS NULL;

-- Update first_message_at for existing conversations with messages
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

-- Update reply_at for conversations with replies
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
