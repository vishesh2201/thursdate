const pool = require('./config/db');

/**
 * Clear all test data - matches, conversations, messages, and level data
 * USE WITH CAUTION - This will delete ALL match-related data
 */

async function clearAllTestData() {
    console.log('\n🗑️  === CLEARING ALL TEST DATA ===\n');
    console.log('⚠️  WARNING: This will delete:');
    console.log('   - All matches (user_actions)');
    console.log('   - All conversations');
    console.log('   - All messages');
    console.log('   - All match_levels records');
    console.log('   - All Level 2/3 completion flags from users');
    console.log('   - All Level 2/3 profile data from users\n');
    
    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 1. Delete all messages
            console.log('1️⃣ Deleting all messages...');
            const [messagesResult] = await connection.execute('DELETE FROM messages');
            console.log(`   ✅ Deleted ${messagesResult.affectedRows} messages\n`);
            
            // 2. Delete all conversations
            console.log('2️⃣ Deleting all conversations...');
            const [conversationsResult] = await connection.execute('DELETE FROM conversations');
            console.log(`   ✅ Deleted ${conversationsResult.affectedRows} conversations\n`);
            
            // 3. Delete all match_levels
            console.log('3️⃣ Deleting all match_levels records...');
            const [matchLevelsResult] = await connection.execute('DELETE FROM match_levels');
            console.log(`   ✅ Deleted ${matchLevelsResult.affectedRows} match_levels records\n`);
            
            // 4. Delete all user_actions (likes/passes)
            console.log('4️⃣ Deleting all user_actions (likes/passes)...');
            const [actionsResult] = await connection.execute('DELETE FROM user_actions');
            console.log(`   ✅ Deleted ${actionsResult.affectedRows} user actions\n`);
            
            // 5. Clear Level 2 and 3 completion flags and data from users
            console.log('5️⃣ Clearing Level 2/3 data from users...');
            const [usersResult] = await connection.execute(`
                UPDATE users SET 
                    level2_questions_completed = FALSE,
                    level2_completed_at = NULL,
                    level3_questions_completed = FALSE,
                    level3_completed_at = NULL,
                    pets = NULL,
                    drinking = NULL,
                    smoking = NULL,
                    height = NULL,
                    religious_level = NULL,
                    kids_preference = NULL,
                    food_preference = NULL,
                    relationship_status = NULL
            `);
            console.log(`   ✅ Cleared Level 2/3 data from ${usersResult.affectedRows} users\n`);
            
            // 6. Clear blocks table (optional)
            console.log('6️⃣ Deleting all blocks...');
            const [blocksResult] = await connection.execute('DELETE FROM blocks');
            console.log(`   ✅ Deleted ${blocksResult.affectedRows} blocks\n`);
            
            await connection.commit();
            
            console.log('✅ ALL TEST DATA CLEARED SUCCESSFULLY!\n');
            console.log('📊 Summary:');
            console.log(`   - Messages deleted: ${messagesResult.affectedRows}`);
            console.log(`   - Conversations deleted: ${conversationsResult.affectedRows}`);
            console.log(`   - Match levels deleted: ${matchLevelsResult.affectedRows}`);
            console.log(`   - User actions deleted: ${actionsResult.affectedRows}`);
            console.log(`   - Users reset: ${usersResult.affectedRows}`);
            console.log(`   - Blocks deleted: ${blocksResult.affectedRows}\n`);
            
            console.log('🎯 You can now start fresh testing!\n');
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error clearing test data:', error);
    } finally {
        await pool.end();
    }
}

clearAllTestData();
