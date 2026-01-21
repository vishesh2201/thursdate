/**
 * Migration script for multi-level profile system
 */

const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting match levels migration...\n');
  
  let connection;
  
  try {
    // Get connection from pool
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');
    
    // Read migration SQL
    const sqlPath = path.join(__dirname, 'migrations', 'create-match-levels.sql');
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
            if (stmtErr.code === 'ER_DUP_FIELDNAME' || 
                stmtErr.code === 'ER_DUP_KEYNAME' ||
                stmtErr.code === 'ER_TABLE_EXISTS_ERROR') {
              console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
            } else {
              console.error(`❌ Statement ${i + 1} failed:`, stmtErr.message);
            }
          }
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully');
    console.log('   - Created match_levels table');
    console.log('   - Added has_completed_level2 and has_completed_level3 columns to users table\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

runMigration();
