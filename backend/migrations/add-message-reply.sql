-- Add reply functionality to messages
-- This allows messages to reference another message they are replying to

USE defaultdb;

-- Add reply_to_message_id column to messages table
ALTER TABLE messages 
ADD COLUMN reply_to_message_id INT DEFAULT NULL AFTER sender_id,
ADD FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,
ADD INDEX idx_reply_to (reply_to_message_id);

-- The reply_to_message_id will store the ID of the message being replied to
-- If NULL, the message is not a reply
-- ON DELETE SET NULL ensures if the original message is deleted, the reply still exists but loses its reference
