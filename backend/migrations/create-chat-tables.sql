-- Chat System Database Schema
-- This creates tables for conversations and messages between matched users

USE defaultdb;

-- Table: conversations
-- Stores one-to-one conversations between matched users
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure user1_id is always less than user2_id for consistency
  -- This prevents duplicate conversations (A->B and B->A)
  CHECK (user1_id < user2_id),
  
  -- Unique constraint to ensure only one conversation per user pair
  UNIQUE KEY unique_conversation (user1_id, user2_id),
  
  -- Foreign keys to users table
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX idx_user1 (user1_id),
  INDEX idx_user2 (user2_id),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: messages
-- Stores all messages exchanged in conversations
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_type ENUM('text', 'voice') NOT NULL DEFAULT 'text',
  content TEXT,                    -- Text message content or voice message URL
  voice_duration INT,              -- Duration in seconds (only for voice messages)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View: user_conversations
-- Helper view to get conversations for a specific user with last message details
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
    c.id as conversation_id,
    c.user1_id,
    c.user2_id,
    c.created_at as conversation_created_at,
    c.updated_at as conversation_updated_at,
    m.id as last_message_id,
    m.sender_id as last_message_sender_id,
    m.message_type as last_message_type,
    m.content as last_message_content,
    m.voice_duration as last_message_voice_duration,
    m.created_at as last_message_time,
    -- Count unread messages
    (SELECT COUNT(*) 
     FROM messages m2 
     WHERE m2.conversation_id = c.id 
     AND m2.is_read = FALSE 
     AND m2.sender_id != c.user1_id) as unread_count_user1,
    (SELECT COUNT(*) 
     FROM messages m2 
     WHERE m2.conversation_id = c.id 
     AND m2.is_read = FALSE 
     AND m2.sender_id != c.user2_id) as unread_count_user2
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id 
    AND m.id = (
        SELECT MAX(id) 
        FROM messages 
        WHERE conversation_id = c.id
    );
