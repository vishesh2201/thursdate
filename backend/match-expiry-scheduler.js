/**
 * Automatic match expiry scheduler
 * Runs the cleanup job every hour using node-cron
 * 
 * Usage:
 * - Install node-cron: npm install node-cron
 * - Run this file: node match-expiry-scheduler.js
 * - Or integrate into server.js for automatic scheduling
 */

const cron = require('node-cron');
const matchExpiryService = require('./services/matchExpiry');

console.log('🕒 Match expiry scheduler started');
console.log('   Running cleanup every hour at minute 0');

// Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('\n📅 Running scheduled match expiry cleanup...');
  console.log('   Time:', new Date().toISOString());
  
  try {
    const result = await matchExpiryService.expireOldMatches();
    
    console.log('✅ Scheduled cleanup completed');
    console.log(`   - Expired matches: ${result.expired}`);
    
    if (result.expired > 0) {
      console.log('   - Expired match details:');
      result.matches.forEach(match => {
        console.log(`     * Conversation ${match.id}: users ${match.user_id_1} and ${match.user_id_2}`);
      });
    }
  } catch (error) {
    console.error('❌ Scheduled cleanup failed:', error);
  }
});

// Run cleanup on startup as well
(async () => {
  console.log('\n🚀 Running initial cleanup on startup...');
  try {
    const result = await matchExpiryService.expireOldMatches();
    console.log('✅ Initial cleanup completed');
    console.log(`   - Expired matches: ${result.expired}`);
  } catch (error) {
    console.error('❌ Initial cleanup failed:', error);
  }
})();

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Match expiry scheduler stopped');
  process.exit(0);
});
