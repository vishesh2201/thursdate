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

async function backfillLevel2Completion() {
    try {
        console.log('Checking users who have completed Level 2 questions...\n');
        
        // Find users who have filled Level 2 questions in their intent JSON
        // but don't have level2_questions_completed flag set
        const [users] = await pool.execute(`
            SELECT id, email, intent, level2_questions_completed
            FROM users
            WHERE intent IS NOT NULL
        `);
        
        let updated = 0;
        
        for (const user of users) {
            const intent = JSON.parse(user.intent || '{}');
            const profileQuestions = intent.profileQuestions || {};
            
            // Check if they have Level 2 fields filled
            const hasLevel2 = profileQuestions.education || 
                            profileQuestions.educationDetail ||
                            profileQuestions.languages ||
                            profileQuestions.canCode !== undefined ||
                            profileQuestions.sleepSchedule ||
                            profileQuestions.dateBill;
            
            if (hasLevel2 && !user.level2_questions_completed) {
                console.log(`User ${user.id} (${user.email}) has Level 2 data but flag not set - updating...`);
                
                await pool.execute(
                    'UPDATE users SET level2_questions_completed = TRUE, level2_completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );
                
                updated++;
            }
        }
        
        console.log(`\n✓ Backfill complete! Updated ${updated} users.`);
        
        // Show current status
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN level2_questions_completed = 1 THEN 1 ELSE 0 END) as level2_completed,
                SUM(CASE WHEN level3_questions_completed = 1 THEN 1 ELSE 0 END) as level3_completed
            FROM users
        `);
        
        console.log('\nCurrent status:');
        console.log(`Total users: ${stats[0].total_users}`);
        console.log(`Level 2 completed: ${stats[0].level2_completed}`);
        console.log(`Level 3 completed: ${stats[0].level3_completed}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

backfillLevel2Completion();
