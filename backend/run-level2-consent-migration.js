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

async function runMigration() {
    try {
        console.log('Adding Level 2 consent columns to conversations table...\n');
        
        // Add level2_user1_consent column
        try {
            await pool.execute(
                "ALTER TABLE conversations ADD COLUMN level2_user1_consent BOOLEAN DEFAULT FALSE COMMENT 'User 1 consent to share Level 2 info'"
            );
            console.log('✓ Added level2_user1_consent column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level2_user1_consent column already exists');
            } else {
                throw e;
            }
        }
        
        // Add level2_user2_consent column
        try {
            await pool.execute(
                "ALTER TABLE conversations ADD COLUMN level2_user2_consent BOOLEAN DEFAULT FALSE COMMENT 'User 2 consent to share Level 2 info'"
            );
            console.log('✓ Added level2_user2_consent column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level2_user2_consent column already exists');
            } else {
                throw e;
            }
        }
        
        console.log('\n✅ Migration completed successfully!');
        
        // Verify columns were added
        const [columns] = await pool.execute(
            "SHOW COLUMNS FROM conversations WHERE Field LIKE 'level2_%_consent'"
        );
        
        console.log('\nVerification:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (Default: ${col.Default})`);
        });
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

runMigration();
