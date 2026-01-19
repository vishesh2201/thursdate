const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thursdate',
    waitForConnections: true
});

async function checkColumn() {
    try {
        // Check if column exists
        const [columns] = await pool.execute(
            "SHOW COLUMNS FROM users LIKE 'level2_questions_completed'"
        );
        
        console.log('Column check:', columns.length > 0 ? 'EXISTS' : 'NOT FOUND');
        
        if (columns.length > 0) {
            console.log('Column details:', columns[0]);
            
            // Check current values
            const [users] = await pool.execute(
                'SELECT id, email, level2_questions_completed FROM users'
            );
            
            console.log('\nUser statuses:');
            users.forEach(user => {
                console.log(`User ${user.id} (${user.email}): level2_questions_completed = ${user.level2_questions_completed}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkColumn();
