/**
 * Clear all matches and match-related data for testing
 */

const pool = require('./config/db');

async function clearMatchesForTesting() {
  console.log('🧹 Clearing all matches and related data for testing...\n');
  
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Clear match_levels table
      const [matchLevelsResult] = await connection.query('DELETE FROM match_levels');
      console.log(`✅ Cleared ${matchLevelsResult.affectedRows} records from match_levels`);
      
      // Clear messages table
      const [messagesResult] = await connection.query('DELETE FROM messages');
      console.log(`✅ Cleared ${messagesResult.affectedRows} messages`);
      
      // Clear conversations table
      const [conversationsResult] = await connection.query('DELETE FROM conversations');
      console.log(`✅ Cleared ${conversationsResult.affectedRows} conversations`);
      
      // Clear matches table
      const [matchesResult] = await connection.query('DELETE FROM matches');
      console.log(`✅ Cleared ${matchesResult.affectedRows} matches`);
      
      // Reset user completion flags
      const [usersResult] = await connection.query(`
        UPDATE users 
        SET has_completed_level2 = FALSE, 
            has_completed_level3 = FALSE
      `);
      console.log(`✅ Reset completion flags for ${usersResult.affectedRows} users`);
      
      // Commit transaction
      await connection.commit();
      
      console.log('\n✅ All match data cleared successfully');
      console.log('   You can now test the multi-level profile system from scratch\n');

    } catch (err) {
      await connection.rollback();
      throw err;
    }

  } catch (error) {
    console.error('❌ Failed to clear match data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

clearMatchesForTesting();
