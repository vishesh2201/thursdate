const pool = require('./config/db');

/**
 * Script to delete all users and related data from the database
 * 
 * WARNING: This will permanently delete ALL users and associated data including:
 * - User profiles
 * - Messages
 * - Conversations
 * - Matches
 * - User actions
 * - Reports
 * - Blocks
 * - Daily game scores
 * 
 * USE WITH CAUTION!
 */

async function clearAllUsers() {
  let connection;
  
  try {
    console.log('⚠️  WARNING: This will delete ALL users and related data!');
    console.log('');
    
    connection = await pool.getConnection();
    
    console.log('🔌 Connected to database');
    console.log('');
    
    // Start transaction for safety
    await connection.beginTransaction();
    console.log('📝 Starting transaction...');
    
    // Delete in order to respect foreign key constraints
    // (Though CASCADE should handle most of this automatically)
    
    const tables = [
      'daily_game_scores',
      'user_reports',
      'blocks',
      'user_actions',
      'messages',
      'conversations',
      'match_expiry_tracking',
      'users'
    ];
    
    console.log('🗑️  Deleting data from tables...\n');
    
    for (const table of tables) {
      try {
        const [result] = await connection.query(`DELETE FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.affectedRows} rows deleted`);
      } catch (error) {
        // Table might not exist, that's okay
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ⚠️  ${table}: Table doesn't exist (skipped)`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('');
    
    // Reset auto-increment counters
    console.log('🔄 Resetting auto-increment counters...\n');
    
    for (const table of tables) {
      try {
        await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`   ✅ ${table}: Counter reset`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ⚠️  ${table}: Table doesn't exist (skipped)`);
        } else {
          // Some tables might not have auto-increment, that's fine
          console.log(`   ⚠️  ${table}: Could not reset counter (might not have auto-increment)`);
        }
      }
    }
    
    // Commit transaction
    await connection.commit();
    console.log('');
    console.log('✅ Transaction committed successfully!');
    console.log('');
    console.log('🎉 All users and related data have been deleted!');
    console.log('💡 Database is now clean and ready for new users.');
    
  } catch (error) {
    // Rollback on error
    if (connection) {
      await connection.rollback();
      console.log('');
      console.log('❌ Transaction rolled back due to error');
    }
    console.error('');
    console.error('❌ Error clearing users:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('');
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the script
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('           CLEAR ALL USERS SCRIPT');
console.log('═══════════════════════════════════════════════════════');
console.log('');

clearAllUsers();
