/**
 * Migration script to add match timing features
 * Run this script to update your database with the new match expiry system
 * 
 * Usage: node run-match-timing-migration.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting match timing migration...\n');
  
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'thursdate',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database');
    
    // Read and execute the migration SQL
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'migrations', 'add-match-timing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing migration SQL...\n');
    
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns to conversations table:');
    console.log('  - match_created_at: When users matched');
    console.log('  - match_expires_at: When match expires (7 days)');
    console.log('  - first_message_at: When first message was sent');
    console.log('  - first_message_sender_id: Who sent first message');
    console.log('  - reply_at: When recipient replied');
    console.log('  - match_expired: Whether match has expired\n');
    
    // Verify the migration
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'conversations' 
        AND COLUMN_NAME IN ('match_created_at', 'match_expires_at', 'first_message_at', 'reply_at', 'match_expired', 'first_message_sender_id')
    `, [process.env.DB_NAME || 'thursdate']);
    
    console.log('✅ Verification: Found', columns.length, 'new columns');
    
    if (columns.length === 6) {
      console.log('\n🎉 Migration verified successfully!');
    } else {
      console.log('\n⚠️  Warning: Expected 6 columns, found', columns.length);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

runMigration();
