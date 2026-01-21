const pool = require('./config/db');

/**
 * Debug script to check consent values
 */

async function debugConsentValues() {
    console.log('\n🔍 === DEBUGGING CONSENT VALUES ===\n');
    
    try {
        // Get all conversations with their consent values
        const [conversations] = await pool.execute(`
            SELECT 
                c.id as conv_id,
                c.user_id_1,
                c.user_id_2,
                c.message_count,
                c.level2_user1_consent,
                c.level2_user2_consent,
                c.level2_user1_completed,
                c.level2_user2_completed,
                c.level3_user1_consent,
                c.level3_user2_consent,
                u1.first_name as user1_name,
                u1.level2_questions_completed as user1_global_l2,
                u1.level3_questions_completed as user1_global_l3,
                u2.first_name as user2_name,
                u2.level2_questions_completed as user2_global_l2,
                u2.level3_questions_completed as user2_global_l3
            FROM conversations c
            JOIN users u1 ON u1.id = c.user_id_1
            JOIN users u2 ON u2.id = c.user_id_2
            ORDER BY c.id DESC
            LIMIT 10
        `);
        
        console.log(`Found ${conversations.length} conversations:\n`);
        
        conversations.forEach(conv => {
            console.log(`📊 Conversation ${conv.conv_id}:`);
            console.log(`   ${conv.user1_name} (ID ${conv.user_id_1}) ↔ ${conv.user2_name} (ID ${conv.user_id_2})`);
            console.log(`   Messages: ${conv.message_count}\n`);
            
            console.log(`   Level 2 Status:`);
            console.log(`   ├─ User 1 (${conv.user1_name}):`);
            console.log(`   │  ├─ Global completed: ${conv.user1_global_l2 ? '✓ YES' : '✗ NO'}`);
            console.log(`   │  ├─ Conversation completed: ${conv.level2_user1_completed ? '✓ YES' : '✗ NO'}`);
            console.log(`   │  └─ Consent given: ${conv.level2_user1_consent ? '✓ YES' : '✗ NO'}`);
            console.log(`   └─ User 2 (${conv.user2_name}):`);
            console.log(`      ├─ Global completed: ${conv.user2_global_l2 ? '✓ YES' : '✗ NO'}`);
            console.log(`      ├─ Conversation completed: ${conv.level2_user2_completed ? '✓ YES' : '✗ NO'}`);
            console.log(`      └─ Consent given: ${conv.level2_user2_consent ? '✓ YES' : '✗ NO'}\n`);
            
            console.log(`   Level 3 Status:`);
            console.log(`   ├─ User 1 (${conv.user1_name}):`);
            console.log(`   │  ├─ Global completed: ${conv.user1_global_l3 ? '✓ YES' : '✗ NO'}`);
            console.log(`   │  └─ Consent given: ${conv.level3_user1_consent ? '✓ YES' : '✗ NO'}`);
            console.log(`   └─ User 2 (${conv.user2_name}):`);
            console.log(`      ├─ Global completed: ${conv.user2_global_l3 ? '✓ YES' : '✗ NO'}`);
            console.log(`      └─ Consent given: ${conv.level3_user2_consent ? '✓ YES' : '✗ NO'}\n`);
            
            // Check if visibility should be granted
            const l2_visibility = conv.message_count >= 5 && 
                                  conv.level2_user1_consent && 
                                  conv.level2_user2_consent &&
                                  conv.user1_global_l2 &&
                                  conv.user2_global_l2;
                                  
            const l3_visibility = conv.message_count >= 10 && 
                                  conv.level3_user1_consent && 
                                  conv.level3_user2_consent &&
                                  conv.user1_global_l3 &&
                                  conv.user2_global_l3;
            
            console.log(`   🎯 Visibility Check:`);
            console.log(`   ├─ Level 2: ${l2_visibility ? '✅ GRANTED' : '❌ DENIED'}`);
            console.log(`   └─ Level 3: ${l3_visibility ? '✅ GRANTED' : '❌ DENIED'}\n`);
            
            console.log('─'.repeat(60) + '\n');
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

debugConsentValues();
