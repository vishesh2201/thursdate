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

async function markLevel3Completed() {
    try {
        // Since Level 3 questions (face photos) don't exist yet,
        // mark all users as completed so they only see consent popup
        const [result] = await pool.execute(
            'UPDATE users SET level3_questions_completed = TRUE, level3_completed_at = CURRENT_TIMESTAMP'
        );
        
        console.log('✓ Marked', result.affectedRows, 'users as Level 3 completed');
        console.log('  (Level 3 questions don\'t exist yet, so users will only see consent popup)');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

markLevel3Completed();
