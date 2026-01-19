const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true
});

async function clearAllForTesting() {
    try {
        console.log('🧹 CLEARING ALL DATA FOR TESTING...\n');
        
        // 1. Clear all user_actions (likes/matches)
        console.log('1️⃣ Deleting all user actions (likes/matches)...');
        const [actionsResult] = await pool.execute('DELETE FROM user_actions');
        console.log(`   ✓ Deleted ${actionsResult.affectedRows} user actions\n`);
        
        // 2. Clear all messages
        console.log('2️⃣ Deleting all messages...');
        const [messagesResult] = await pool.execute('DELETE FROM messages');
        console.log(`   ✓ Deleted ${messagesResult.affectedRows} messages\n`);
        
        // 3. Clear all conversations
        console.log('3️⃣ Deleting all conversations...');
        const [convsResult] = await pool.execute('DELETE FROM conversations');
        console.log(`   ✓ Deleted ${convsResult.affectedRows} conversations\n`);
        
        // 4. Reset Level 2 and Level 3 completion flags for ALL users
        console.log('4️⃣ Resetting Level 2 and Level 3 completion flags...');
        const [usersResult] = await pool.execute(`
            UPDATE users 
            SET 
                level2_questions_completed = FALSE,
                level2_completed_at = NULL,
                level3_questions_completed = FALSE,
                level3_completed_at = NULL
        `);
        console.log(`   ✓ Reset level completion for ${usersResult.affectedRows} users\n`);
        
        // 5. Clear profile questions data from intent JSON (optional - keeps work info)
        console.log('5️⃣ Clearing Level 2/3 profile questions data from user intent...');
        const [users] = await pool.execute('SELECT id, intent FROM users WHERE intent IS NOT NULL');
        
        let clearedCount = 0;
        for (const user of users) {
            const intent = JSON.parse(user.intent || '{}');
            
            if (intent.profileQuestions) {
                // Keep only Level 1 fields (jobTitle, companyName)
                const level1Only = {};
                if (intent.profileQuestions.jobTitle) level1Only.jobTitle = intent.profileQuestions.jobTitle;
                if (intent.profileQuestions.companyName) level1Only.companyName = intent.profileQuestions.companyName;
                
                intent.profileQuestions = level1Only;
                
                await pool.execute(
                    'UPDATE users SET intent = ? WHERE id = ?',
                    [JSON.stringify(intent), user.id]
                );
                clearedCount++;
            }
        }
        console.log(`   ✓ Cleared Level 2/3 questions from ${clearedCount} users\n`);
        
        // 6. Show final statistics
        console.log('📊 FINAL DATABASE STATE:');
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [actionCount] = await pool.execute('SELECT COUNT(*) as count FROM user_actions');
        const [convCount] = await pool.execute('SELECT COUNT(*) as count FROM conversations');
        const [msgCount] = await pool.execute('SELECT COUNT(*) as count FROM messages');
        const [level2Count] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE level2_questions_completed = TRUE');
        const [level3Count] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE level3_questions_completed = TRUE');
        
        console.log(`   Total users: ${userCount[0].count}`);
        console.log(`   User actions (likes/matches): ${actionCount[0].count}`);
        console.log(`   Conversations: ${convCount[0].count}`);
        console.log(`   Messages: ${msgCount[0].count}`);
        console.log(`   Users with Level 2 completed: ${level2Count[0].count}`);
        console.log(`   Users with Level 3 completed: ${level3Count[0].count}`);
        
        console.log('\n✅ ALL DATA CLEARED! Ready for testing from scratch.\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

clearAllForTesting();
