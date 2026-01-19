/**
 * Clear All Mutual Matches Data
 * This script removes all match-related data from the database:
 * - All user actions (likes/skips)
 * - All conversations
 * - All messages
 */

const pool = require('./config/db');

async function clearAllMatches() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧹 Starting to clear all mutual matches data...\n');
    
    await connection.beginTransaction();
    
    // Step 1: Clear all messages (must be done first due to foreign key constraints)
    console.log('📧 Deleting all messages...');
    const [messagesResult] = await connection.execute('DELETE FROM messages');
    console.log(`   ✓ Deleted ${messagesResult.affectedRows} messages\n`);
    
    // Step 2: Clear all conversations
    console.log('💬 Deleting all conversations...');
    const [conversationsResult] = await connection.execute('DELETE FROM conversations');
    console.log(`   ✓ Deleted ${conversationsResult.affectedRows} conversations\n`);
    
    // Step 3: Clear all user actions (likes/skips)
    console.log('❤️  Deleting all user actions (likes/skips)...');
    const [actionsResult] = await connection.execute('DELETE FROM user_actions');
    console.log(`   ✓ Deleted ${actionsResult.affectedRows} user actions\n`);
    
    await connection.commit();
    
    console.log('✅ Successfully cleared all mutual matches data!');
    console.log('\nSummary:');
    console.log(`   - Messages: ${messagesResult.affectedRows}`);
    console.log(`   - Conversations: ${conversationsResult.affectedRows}`);
    console.log(`   - User Actions: ${actionsResult.affectedRows}`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error clearing matches data:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run the script
clearAllMatches()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
