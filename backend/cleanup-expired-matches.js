/**
 * Cron job to mark expired matches (UI-only)
 * This marks matches that have passed 7 days without messages as expired
 * - Removes profiles from horizontal matched section
 * - Does NOT unmatch users
 * - Does NOT block chat access
 * Match validity and chat permissions remain intact
 * 
 * This should be run periodically (e.g., every hour or every day)
 * 
 * Usage:
 * - Add to package.json scripts: "cleanup:matches": "node cleanup-expired-matches.js"
 * - Run manually: npm run cleanup:matches
 * - Or use a cron scheduler like node-cron
 */

const matchExpiryService = require('./services/matchExpiry');

async function runCleanup() {
  console.log('Starting match expiry marking (UI-only)...');
  console.log('Time:', new Date().toISOString());
  console.log('Note: This only affects horizontal section visibility, not match validity\n');
  
  try {
    const result = await matchExpiryService.expireOldMatches();
    
    console.log(`✅ Cleanup completed successfully`);
    console.log(`   - Matches marked as expired (UI-only): ${result.expired}`);
    console.log(`   - Chat access still enabled for all matches`);
    
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
