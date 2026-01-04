/**
 * Cron job to clean up expired matches
 * This should be run periodically (e.g., every hour or every day)
 * 
 * Usage:
 * - Add to package.json scripts: "cleanup:matches": "node cleanup-expired-matches.js"
 * - Run manually: npm run cleanup:matches
 * - Or use a cron scheduler like node-cron
 */

const matchExpiryService = require('./services/matchExpiry');

async function runCleanup() {
  console.log('Starting expired matches cleanup...');
  console.log('Time:', new Date().toISOString());
  
  try {
    const result = await matchExpiryService.expireOldMatches();
    
    console.log(`✅ Cleanup completed successfully`);
    console.log(`   - Expired matches: ${result.expired}`);
    
    if (result.expired > 0) {
      console.log('   - Expired match details:');
      result.matches.forEach(match => {
        console.log(`     * Conversation ${match.id}: users ${match.user_id_1} and ${match.user_id_2}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();
