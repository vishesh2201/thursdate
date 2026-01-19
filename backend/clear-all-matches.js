const pool = require('./config/db');

async function clearAllMatches() {
  try {
    console.log('🧹 Clearing all matches and conversations...\n');
    
    // Clear messages first (foreign key dependency)
    const [messagesResult] = await pool.query('DELETE FROM messages');
    console.log(`✅ Deleted ${messagesResult.affectedRows} messages`);
    
    // Clear conversations
    const [conversationsResult] = await pool.query('DELETE FROM conversations');
    console.log(`✅ Deleted ${conversationsResult.affectedRows} conversations`);
    
    // Clear user actions (likes, matches, etc.)
    const [actionsResult] = await pool.query('DELETE FROM user_actions');
    console.log(`✅ Deleted ${actionsResult.affectedRows} user actions (swipes/matches)`);
    
    console.log('\n✨ All matches, conversations, and messages cleared successfully!');
    console.log('Ready for fresh testing.\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    await pool.end();
    process.exit(1);
  }
}

clearAllMatches();
