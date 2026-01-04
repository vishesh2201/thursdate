/**
 * Simple migration script using existing db.js configuration
 */

const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting match timing migration...\n');
  
  let connection;
  
  try {
    // Get connection from pool
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');
    
    // Read migration SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-match-timing-fixed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the entire SQL file at once
    console.log('📝 Executing migration SQL...\n');
    
    try {
      await connection.query(sqlContent);
      console.log('✅ All statements executed successfully');
    } catch (err) {
      // If batch execution fails, try statement by statement
      console.log('⚠️  Batch execution failed, trying statement by statement...\n');
      
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await connection.query(statement);
            console.log(`✅ Statement ${i + 1}/${statements.length} completed`);
          } catch (stmtErr) {
            // Ignore specific errors
            if (stmtErr.code === 'ER_DUP_FIELDNAME' || stmtErr.code === 'ER_DUP_KEYNAME') {
              console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
            } else {
              console.error(`❌ Statement ${i + 1} failed:`, stmtErr.message);
            }
          }
        }
      }
    }
    
    console.log('\n✅ Migration completed!\n');
    
    // Verify columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'conversations' 
        AND COLUMN_NAME IN ('match_created_at', 'match_expires_at', 'first_message_at', 'reply_at', 'match_expired', 'first_message_sender_id')
    `, [process.env.DB_NAME]);
    
    console.log(`✅ Verification: Found ${columns.length}/6 new columns`);
    columns.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
    
    if (columns.length === 6) {
      console.log('\n🎉 Migration verified successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n👋 Database connection closed');
    }
    await pool.end();
  }
}

runMigration();
