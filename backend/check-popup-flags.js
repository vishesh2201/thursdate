const pool = require('./config/db');

/**
 * Check popup_pending flags in database
 */

async function checkPopupFlags() {
    console.log('\n🔍 === CHECKING POPUP FLAGS IN DATABASE ===\n');
    
    try {
        // Get all conversations with their match_levels data
        const [results] = await pool.execute(`
            SELECT 
                c.id as conv_id,
                c.user_id_1,
                c.user_id_2,
                c.message_count,
                ml.level2_popup_pending_user1,
                ml.level2_popup_pending_user2,
                ml.level3_popup_pending_user1,
                ml.level3_popup_pending_user2,
                u1.first_name as user1_name,
                u2.first_name as user2_name
            FROM conversations c
            LEFT JOIN match_levels ml ON ml.conversation_id = c.id
            LEFT JOIN users u1 ON u1.id = c.user_id_1
            LEFT JOIN users u2 ON u2.id = c.user_id_2
            ORDER BY c.id DESC
            LIMIT 10
        `);
        
        console.log(`Found ${results.length} conversations:\n`);
        
        results.forEach(row => {
            console.log(`📊 Conversation ${row.conv_id}:`);
            console.log(`   Users: ${row.user1_name} (ID ${row.user_id_1}) ↔ ${row.user2_name} (ID ${row.user_id_2})`);
            console.log(`   Message count: ${row.message_count}`);
            
            if (row.level2_popup_pending_user1 !== null) {
                console.log(`   ✅ Has match_levels record:`);
                console.log(`      L2 Popup User 1: ${row.level2_popup_pending_user1 ? '✓ TRUE' : '✗ FALSE'}`);
                console.log(`      L2 Popup User 2: ${row.level2_popup_pending_user2 ? '✓ TRUE' : '✗ FALSE'}`);
                console.log(`      L3 Popup User 1: ${row.level3_popup_pending_user1 ? '✓ TRUE' : '✗ FALSE'}`);
                console.log(`      L3 Popup User 2: ${row.level3_popup_pending_user2 ? '✓ TRUE' : '✗ FALSE'}`);
            } else {
                console.log(`   ⚠️  No match_levels record`);
            }
            console.log('');
        });
        
        // Check specifically for conversations with popup_pending = TRUE
        const [pending] = await pool.execute(`
            SELECT 
                ml.conversation_id,
                ml.level2_popup_pending_user1,
                ml.level2_popup_pending_user2,
                c.message_count
            FROM match_levels ml
            JOIN conversations c ON c.id = ml.conversation_id
            WHERE ml.level2_popup_pending_user1 = 1 OR ml.level2_popup_pending_user2 = 1
        `);
        
        if (pending.length > 0) {
            console.log(`\n🎯 Conversations with ACTIVE Level 2 popups:`);
            pending.forEach(row => {
                console.log(`   Conversation ${row.conversation_id}: User1=${row.level2_popup_pending_user1}, User2=${row.level2_popup_pending_user2}, Messages=${row.message_count}`);
            });
        } else {
            console.log(`\n⚠️  No conversations have popup_pending = TRUE`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkPopupFlags();
