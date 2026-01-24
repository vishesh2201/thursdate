const pool = require('./config/db');
const profileLevelService = require('./services/profileLevelService');

/**
 * Comprehensive test for mutual consent requirement
 * Tests all edge cases:
 * 1. Only User 1 completed - should NOT see Level 2
 * 2. Only User 2 completed - should NOT see Level 2
 * 3. Only User 1 consented - should NOT see Level 2
 * 4. Only User 2 consented - should NOT see Level 2
 * 5. Both completed AND both consented - should see Level 2
 */

async function runComprehensiveTest() {
    try {
        console.log('🧪 Comprehensive Mutual Consent Test\n');

        // Find a conversation with 5+ messages
        const [conversations] = await pool.execute(`
            SELECT c.id, c.user_id_1, c.user_id_2, c.message_count,
                   u1.first_name as user1_name,
                   u2.first_name as user2_name
            FROM conversations c
            JOIN users u1 ON u1.id = c.user_id_1
            JOIN users u2 ON u2.id = c.user_id_2
            WHERE c.message_count >= 5
            LIMIT 1
        `);

        if (conversations.length === 0) {
            console.log('❌ No test conversations found');
            return;
        }

        const conv = conversations[0];
        const { id: convId, user_id_1, user_id_2, user1_name, user2_name } = conv;

        console.log(`Testing conversation ${convId}: ${user1_name} ↔ ${user2_name}\n`);

        // Helper function to test visibility
        async function testScenario(description, user1Completed, user2Completed, user1Consent, user2Consent, expectedLevel) {
            console.log(`\n📝 Scenario: ${description}`);
            
            // Set the test state
            await pool.execute(`
                UPDATE users SET level2_questions_completed = ? WHERE id = ?
            `, [user1Completed, user_id_1]);
            
            await pool.execute(`
                UPDATE users SET level2_questions_completed = ? WHERE id = ?
            `, [user2Completed, user_id_2]);
            
            await pool.execute(`
                UPDATE conversations 
                SET level2_user1_consent = ?, level2_user2_consent = ?
                WHERE id = ?
            `, [user1Consent, user2Consent, convId]);

            // Test from both perspectives
            const vis1to2 = await profileLevelService.getVisibilityLevel(convId, user_id_1, user_id_2);
            const vis2to1 = await profileLevelService.getVisibilityLevel(convId, user_id_2, user_id_1);

            console.log(`  ${user1_name} → ${user2_name}: Level ${vis1to2.level}`);
            console.log(`  ${user2_name} → ${user1_name}: Level ${vis2to1.level}`);
            
            const pass1 = vis1to2.level === expectedLevel;
            const pass2 = vis2to1.level === expectedLevel;
            const symmetric = vis1to2.level === vis2to1.level;

            if (pass1 && pass2 && symmetric) {
                console.log(`  ✅ PASS - Both see Level ${expectedLevel} (symmetric)`);
                return true;
            } else {
                console.log(`  ❌ FAIL - Expected ${expectedLevel}, got ${vis1to2.level}/${vis2to1.level}`);
                return false;
            }
        }

        let passCount = 0;
        let totalTests = 0;

        // Test 1: Neither completed
        totalTests++;
        if (await testScenario('Neither user completed Level 2', false, false, false, false, 1)) passCount++;

        // Test 2: Only User 1 completed
        totalTests++;
        if (await testScenario('Only User 1 completed', true, false, false, false, 1)) passCount++;

        // Test 3: Only User 2 completed
        totalTests++;
        if (await testScenario('Only User 2 completed', false, true, false, false, 1)) passCount++;

        // Test 4: Both completed, but no consent
        totalTests++;
        if (await testScenario('Both completed, no consent', true, true, false, false, 1)) passCount++;

        // Test 5: Both completed, only User 1 consented
        totalTests++;
        if (await testScenario('Both completed, only User 1 consented', true, true, true, false, 1)) passCount++;

        // Test 6: Both completed, only User 2 consented
        totalTests++;
        if (await testScenario('Both completed, only User 2 consented', true, true, false, true, 1)) passCount++;

        // Test 7: Both completed AND both consented - should unlock Level 2
        totalTests++;
        if (await testScenario('Both completed AND both consented', true, true, true, true, 2)) passCount++;

        // Test 8: User 1 completed and consented, User 2 only consented (not completed)
        totalTests++;
        if (await testScenario('User 1 completed+consented, User 2 only consented', true, false, true, true, 1)) passCount++;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 Test Results: ${passCount}/${totalTests} tests passed`);
        
        if (passCount === totalTests) {
            console.log('🎉 All tests passed! Mutual consent is working correctly.');
        } else {
            console.log(`⚠️  ${totalTests - passCount} test(s) failed.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

runComprehensiveTest();
