const pool = require('./config/db');
const ProfileLevelService = require('./services/profileLevelService');

/**
 * Backfill script to set popup_pending flags for conversations
 * that already passed the threshold before the fix was implemented
 */

async function backfillPopupFlags() {
    console.log('\n🔧 === BACKFILLING POPUP FLAGS ===\n');
    
    try {
        // Find all conversations with message_count >= 5 but no match_levels record
        const [conversations] = await pool.execute(`
            SELECT 
                c.id,
                c.user_id_1,
                c.user_id_2,
                c.message_count
            FROM conversations c
            LEFT JOIN match_levels ml ON ml.conversation_id = c.id
            WHERE c.message_count >= 5 AND ml.id IS NULL
        `);
        
        console.log(`Found ${conversations.length} conversations that need backfilling:\n`);
        
        for (const conv of conversations) {
            console.log(`📝 Processing conversation ${conv.id}:`);
            console.log(`   Users: ${conv.user_id_1} ↔ ${conv.user_id_2}`);
            console.log(`   Message count: ${conv.message_count}`);
            
            // Create match_levels record and set appropriate popup flags
            if (conv.message_count >= 5 && conv.message_count < 10) {
                // Only Level 2 popup should be pending
                await ProfileLevelService.setPopupPending(conv.id, conv.user_id_1, conv.user_id_2, 2);
                console.log(`   ✅ Set Level 2 popup_pending`);
            } else if (conv.message_count >= 10) {
                // Both Level 2 and Level 3 popups should be pending
                await ProfileLevelService.setPopupPending(conv.id, conv.user_id_1, conv.user_id_2, 2);
                await ProfileLevelService.setPopupPending(conv.id, conv.user_id_1, conv.user_id_2, 3);
                console.log(`   ✅ Set Level 2 and Level 3 popup_pending`);
            }
            
            console.log('');
        }
        
        // Verify the results
        console.log('\n✅ Backfill complete! Verification:\n');
        
        const [verification] = await pool.execute(`
            SELECT 
                ml.conversation_id,
                c.message_count,
                ml.level2_popup_pending_user1,
                ml.level2_popup_pending_user2,
                ml.level3_popup_pending_user1,
                ml.level3_popup_pending_user2
            FROM match_levels ml
            JOIN conversations c ON c.id = ml.conversation_id
            WHERE ml.level2_popup_pending_user1 = 1 OR ml.level2_popup_pending_user2 = 1
               OR ml.level3_popup_pending_user1 = 1 OR ml.level3_popup_pending_user2 = 1
        `);
        
        verification.forEach(row => {
            console.log(`📊 Conversation ${row.conversation_id} (${row.message_count} messages):`);
            console.log(`   L2 Popup: User1=${row.level2_popup_pending_user1 ? '✓' : '✗'}, User2=${row.level2_popup_pending_user2 ? '✓' : '✗'}`);
            console.log(`   L3 Popup: User1=${row.level3_popup_pending_user1 ? '✓' : '✗'}, User2=${row.level3_popup_pending_user2 ? '✓' : '✗'}`);
        });
        
        console.log('\n✅ Done!\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

backfillPopupFlags();
