-- Add message deletion tracking columns
ALTER TABLE messages 
ADD COLUMN deleted_for_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_for_recipient BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP NULL;

-- Index for faster filtering
CREATE INDEX idx_messages_deletion ON messages(deleted_for_sender, deleted_for_recipient);
