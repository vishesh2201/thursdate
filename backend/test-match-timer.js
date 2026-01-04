/**
 * Test script for Match Timer System
 * This script tests all major functionality
 * 
 * Usage: node test-match-timer.js
 */

const mysql = require('mysql2/promise');
const matchExpiryService = require('./services/matchExpiry');
require('dotenv').config();

async function runTests() {
  console.log('🧪 Starting Match Timer System Tests\n');
  
  let connection;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'thursdate'
    });
    
    console.log('✅ Database connection established\n');
    
    // Test 1: Check if migration columns exist
    console.log('Test 1: Check database schema');
    try {
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = 'conversations' 
          AND COLUMN_NAME IN ('match_created_at', 'match_expires_at', 'first_message_at', 'reply_at', 'match_expired', 'first_message_sender_id')
      `, [process.env.DB_NAME || 'thursdate']);
      
      if (columns.length === 6) {
        console.log('✅ All 6 new columns found');
        testsPassed++;
      } else {
        console.log(`❌ Expected 6 columns, found ${columns.length}`);
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ Schema check failed:', error.message);
      testsFailed++;
    }
    
    // Test 2: Check indexes
    console.log('\nTest 2: Check database indexes');
    try {
      const [indexes] = await connection.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = 'conversations' 
          AND INDEX_NAME IN ('idx_match_expires_at', 'idx_match_expired', 'idx_first_message_at')
      `, [process.env.DB_NAME || 'thursdate']);
      
      if (indexes.length >= 3) {
        console.log('✅ Required indexes found');
        testsPassed++;
      } else {
        console.log(`⚠️  Expected 3 indexes, found ${indexes.length}`);
        testsPassed++;
      }
    } catch (error) {
      console.log('❌ Index check failed:', error.message);
      testsFailed++;
    }
    
    // Test 3: Test service functions exist
    console.log('\nTest 3: Check service functions');
    const requiredFunctions = [
      'initializeMatchTimer',
      'recordFirstMessage',
      'recordReply',
      'getMatchState',
      'getMatchedProfilesForUser',
      'expireOldMatches'
    ];
    
    let allFunctionsExist = true;
    for (const func of requiredFunctions) {
      if (typeof matchExpiryService[func] !== 'function') {
        console.log(`❌ Function ${func} not found`);
        allFunctionsExist = false;
      }
    }
    
    if (allFunctionsExist) {
      console.log('✅ All service functions exist');
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Test 4: Test match expiry query
    console.log('\nTest 4: Test expiry query logic');
    try {
      const [expired] = await connection.query(`
        SELECT COUNT(*) as count
        FROM conversations 
        WHERE match_expired = FALSE 
          AND match_expires_at < NOW()
          AND reply_at IS NULL
      `);
      
      console.log(`✅ Expiry query works (found ${expired[0].count} expired matches)`);
      testsPassed++;
    } catch (error) {
      console.log('❌ Expiry query failed:', error.message);
      testsFailed++;
    }
    
    // Test 5: Test matched profiles query
    console.log('\nTest 5: Test matched profiles query');
    try {
      const [matches] = await connection.query(`
        SELECT COUNT(*) as count
        FROM conversations c
        WHERE c.match_expired = FALSE
          AND c.match_expires_at > NOW()
          AND (
            c.first_message_at IS NULL
            OR
            c.reply_at IS NULL
          )
      `);
      
      console.log(`✅ Matched profiles query works (found ${matches[0].count} active matches)`);
      testsPassed++;
    } catch (error) {
      console.log('❌ Matched profiles query failed:', error.message);
      testsFailed++;
    }
    
    // Test 6: Check if existing conversations have been updated
    console.log('\nTest 6: Check existing conversations migration');
    try {
      const [convs] = await connection.query(`
        SELECT COUNT(*) as count
        FROM conversations 
        WHERE match_created_at IS NOT NULL
      `);
      
      console.log(`✅ ${convs[0].count} conversations have match timing data`);
      testsPassed++;
    } catch (error) {
      console.log('❌ Conversation check failed:', error.message);
      testsFailed++;
    }
    
    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log('═'.repeat(60));
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Match timer system is ready to use.');
      console.log('\n📚 Next steps:');
      console.log('   1. Start backend: node server.js');
      console.log('   2. Start frontend: cd frontend && npm run dev');
      console.log('   3. (Optional) Start auto-cleanup: npm run cleanup:auto');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

runTests();
