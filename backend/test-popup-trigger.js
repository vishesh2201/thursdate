const pool = require('./config/db');
const ProfileLevelService = require('./services/profileLevelService');

/**
 * Test script to debug popup triggering
 * This simulates sending 5 messages and checks if popup_pending is set
 */

async function testPopupTrigger() {
    console.log('\n🔍 === POPUP TRIGGER DEBUG TEST ===\n');
    
    try {
        // 1. Find ANY conversation and reset it for testing
        console.log('1️⃣ Finding test conversation...');
        const [conversations] = await pool.execute(`
            SELECT c.id, c.user_id_1, c.user_id_2, c.message_count
            FROM conversations c
            LIMIT 1
        `);
        
        if (conversations.length === 0) {
            console.log('❌ No conversations found in database');
            console.log('   Please create a test conversation first');
            return;
        }
        
        // Reset for testing
        const conversation = conversations[0];
        console.log(`✅ Found conversation ${conversation.id}`);
        console.log(`   Current message count: ${conversation.message_count}`);
        
        console.log('\n📝 Resetting conversation for testing...');
        await pool.execute(
            'UPDATE conversations SET message_count = 0 WHERE id = ?',
            [conversation.id]
        );
        
        // Delete existing match_levels record to test fresh creation
        await pool.execute(
            'DELETE FROM match_levels WHERE conversation_id = ?',
            [conversation.id]
        );
        
        console.log('✅ Reset complete: message_count = 0, match_levels deleted\n');
        
        console.log(`   Users: ${conversation.user_id_1}, ${conversation.user_id_2}`);
        
        // 2. Check if match_levels record exists
        console.log('\n2️⃣ Checking match_levels record...');
        const [matchLevelsBefore] = await pool.execute(
            'SELECT * FROM match_levels WHERE conversation_id = ?',
            [conversation.id]
        );
        
        if (matchLevelsBefore.length > 0) {
            console.log('✅ match_levels record exists:');
            console.log(`   Level 2 popup pending User 1: ${matchLevelsBefore[0].level2_popup_pending_user1}`);
            console.log(`   Level 2 popup pending User 2: ${matchLevelsBefore[0].level2_popup_pending_user2}`);
        } else {
            console.log('⚠️  No match_levels record exists yet (will be created at threshold)');
        }
        
        // 3. Simulate sending messages until we reach threshold
        console.log('\n3️⃣ Simulating message sends...');
        const targetCount = 5;
        const messagesToSend = targetCount; // Start from 0, send 5 messages
        
        console.log(`   Sending ${messagesToSend} messages to reach threshold (${targetCount})`);
        
        for (let i = 1; i <= messagesToSend; i++) {
            console.log(`\n   Message ${i}/${targetCount}:`);
            
            // Call incrementMessageCount
            const levelUpdate = await ProfileLevelService.incrementMessageCount(conversation.id);
            
            console.log(`   - New count: ${levelUpdate.messageCount}`);
            console.log(`   - Should notify: ${levelUpdate.shouldNotify}`);
            console.log(`   - Threshold: ${levelUpdate.threshold}`);
            
            if (levelUpdate.shouldNotify) {
                console.log(`   ✨ THRESHOLD REACHED! Level ${levelUpdate.threshold}`);
            }
        }
        
        // 4. Check match_levels after threshold
        console.log('\n4️⃣ Checking match_levels after threshold...');
        const [matchLevelsAfter] = await pool.execute(
            'SELECT * FROM match_levels WHERE conversation_id = ?',
            [conversation.id]
        );
        
        if (matchLevelsAfter.length === 0) {
            console.log('❌ ERROR: match_levels record NOT created!');
            return;
        }
        
        const ml = matchLevelsAfter[0];
        console.log('✅ match_levels record:');
        console.log(`   Conversation ID: ${ml.conversation_id}`);
        console.log(`   User ID 1: ${ml.user_id_1}`);
        console.log(`   User ID 2: ${ml.user_id_2}`);
        console.log(`   Level 2 popup pending User 1: ${ml.level2_popup_pending_user1}`);
        console.log(`   Level 2 popup pending User 2: ${ml.level2_popup_pending_user2}`);
        
        // 5. Test getConversationLevelStatus for both users
        console.log('\n5️⃣ Testing getConversationLevelStatus for both users...');
        
        const status1 = await ProfileLevelService.getConversationLevelStatus(
            conversation.id, 
            conversation.user_id_1
        );
        console.log(`\n   User 1 (${conversation.user_id_1}) status:`);
        console.log(`   - Message count: ${status1.messageCount}`);
        console.log(`   - Level 2 threshold reached: ${status1.level2ThresholdReached}`);
        console.log(`   - Level 2 popup pending: ${status1.level2PopupPending} 🎯`);
        console.log(`   - Level 2 action: ${status1.level2Action}`);
        
        const status2 = await ProfileLevelService.getConversationLevelStatus(
            conversation.id, 
            conversation.user_id_2
        );
        console.log(`\n   User 2 (${conversation.user_id_2}) status:`);
        console.log(`   - Message count: ${status2.messageCount}`);
        console.log(`   - Level 2 threshold reached: ${status2.level2ThresholdReached}`);
        console.log(`   - Level 2 popup pending: ${status2.level2PopupPending} 🎯`);
        console.log(`   - Level 2 action: ${status2.level2Action}`);
        
        // 6. Final verification
        console.log('\n6️⃣ Final verification:');
        if (status1.level2PopupPending && status2.level2PopupPending) {
            console.log('✅ SUCCESS! Both users have popup_pending = TRUE');
            console.log('   Popups should display in frontend when users load chat');
        } else {
            console.log('❌ FAILURE! Popup flags not set correctly:');
            console.log(`   User 1 popup pending: ${status1.level2PopupPending}`);
            console.log(`   User 2 popup pending: ${status2.level2PopupPending}`);
            console.log('\n   Possible issues:');
            console.log('   - setPopupPending() not being called');
            console.log('   - Database transaction failing');
            console.log('   - User ID mismatch in match_levels table');
        }
        
        console.log('\n✅ Test complete!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

// Run test
testPopupTrigger();
