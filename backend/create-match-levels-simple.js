const pool = require('./config/db');

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL UNIQUE,
        user_id_1 INT NOT NULL,
        user_id_2 INT NOT NULL,
        current_level INT DEFAULT 1,
        total_messages INT DEFAULT 0,
        user1_message_count INT DEFAULT 0,
        user2_message_count INT DEFAULT 0,
        level2_shared_by_user1 BOOLEAN DEFAULT FALSE,
        level2_shared_by_user2 BOOLEAN DEFAULT FALSE,
        level2_popup_pending_user1 BOOLEAN DEFAULT FALSE,
        level2_popup_pending_user2 BOOLEAN DEFAULT FALSE,
        level3_shared_by_user1 BOOLEAN DEFAULT FALSE,
        level3_shared_by_user2 BOOLEAN DEFAULT FALSE,
        level3_popup_pending_user1 BOOLEAN DEFAULT FALSE,
        level3_popup_pending_user2 BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_conversation (conversation_id),
        INDEX idx_users (user_id_1, user_id_2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ match_levels table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTable();
