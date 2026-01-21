const pool = require('./config/db');
const profileLevelService = require('./services/profileLevelService');

/**
 * Test script to verify the visibility level fix
 * Tests that profile information is only visible when BOTH users have completed AND consented
 */

async function testVisibilityLevels() {
    try {
        console.log('🔍 Testing Profile Visibility Level Fix\n');

        // Find a test conversation with messages >= 5
        const [conversations] = await pool.execute(`
            SELECT c.id, c.user_id_1, c.user_id_2, c.message_count,
                   u1.first_name as user1_name, u1.email as user1_email,
                   u2.first_name as user2_name, u2.email as user2_email,
                   c.level2_user1_consent, c.level2_user2_consent,
                   u1.level2_questions_completed as user1_level2_completed,
                   u2.level2_questions_completed as user2_level2_completed
            FROM conversations c
            JOIN users u1 ON u1.id = c.user_id_1
            JOIN users u2 ON u2.id = c.user_id_2
            WHERE c.message_count >= 5
            LIMIT 1
        `);

        if (conversations.length === 0) {
            console.log('❌ No conversations found with 5+ messages. Please create test data first.');
            return;
        }

        const conv = conversations[0];
        console.log('📋 Test Conversation:', {
            id: conv.id,
            messageCount: conv.message_count,
            user1: `${conv.user1_name} (${conv.user1_email})`,
            user2: `${conv.user2_name} (${conv.user2_email})`,
        });

        console.log('\n📊 Current Status:');
        console.log(`  User 1 (${conv.user1_name}):`);
        console.log(`    - Level 2 Completed: ${conv.user1_level2_completed ? '✅' : '❌'}`);
        console.log(`    - Level 2 Consent: ${conv.level2_user1_consent ? '✅' : '❌'}`);
        console.log(`  User 2 (${conv.user2_name}):`);
        console.log(`    - Level 2 Completed: ${conv.user2_level2_completed ? '✅' : '❌'}`);
        console.log(`    - Level 2 Consent: ${conv.level2_user2_consent ? '✅' : '❌'}`);

        // Test visibility from User 1's perspective viewing User 2
        console.log(`\n🔍 Test 1: User 1 (${conv.user1_name}) viewing User 2 (${conv.user2_name})`);
        const visibility1 = await profileLevelService.getVisibilityLevel(
            conv.id,
            conv.user_id_1,
            conv.user_id_2
        );
        console.log(`  Result: Level ${visibility1.level}`);
        console.log(`  Expected: Level 2 only if BOTH completed AND BOTH consented`);
        
        const expectedLevel1 = (
            conv.user1_level2_completed && 
            conv.user2_level2_completed && 
            conv.level2_user1_consent && 
            conv.level2_user2_consent
        ) ? 2 : 1;
        
        if (visibility1.level === expectedLevel1) {
            console.log(`  ✅ PASS - Got expected level ${expectedLevel1}`);
        } else {
            console.log(`  ❌ FAIL - Expected level ${expectedLevel1}, got ${visibility1.level}`);
        }

        // Test visibility from User 2's perspective viewing User 1
        console.log(`\n🔍 Test 2: User 2 (${conv.user2_name}) viewing User 1 (${conv.user1_name})`);
        const visibility2 = await profileLevelService.getVisibilityLevel(
            conv.id,
            conv.user_id_2,
            conv.user_id_1
        );
        console.log(`  Result: Level ${visibility2.level}`);
        console.log(`  Expected: Level 2 only if BOTH completed AND BOTH consented`);
        
        const expectedLevel2 = (
            conv.user1_level2_completed && 
            conv.user2_level2_completed && 
            conv.level2_user1_consent && 
            conv.level2_user2_consent
        ) ? 2 : 1;
        
        if (visibility2.level === expectedLevel2) {
            console.log(`  ✅ PASS - Got expected level ${expectedLevel2}`);
        } else {
            console.log(`  ❌ FAIL - Expected level ${expectedLevel2}, got ${visibility2.level}`);
        }

        // Verify symmetry
        console.log(`\n🔄 Test 3: Symmetry check`);
        if (visibility1.level === visibility2.level) {
            console.log(`  ✅ PASS - Both users see same visibility level (${visibility1.level})`);
        } else {
            console.log(`  ❌ FAIL - Asymmetric visibility! User1 sees level ${visibility1.level}, User2 sees level ${visibility2.level}`);
        }

        console.log('\n✅ Testing complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testVisibilityLevels();
