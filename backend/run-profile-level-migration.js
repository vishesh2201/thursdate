const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    multipleStatements: true
});

async function runMigration() {
    try {
        console.log('Adding level2_questions_completed and level3_questions_completed columns...');
        
        // Add columns individually to avoid errors if they already exist
        try {
            await pool.execute(
                "ALTER TABLE users ADD COLUMN level2_questions_completed BOOLEAN DEFAULT FALSE COMMENT 'Has completed Level 2 profile questions'"
            );
            console.log('✓ Added level2_questions_completed column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level2_questions_completed column already exists');
            } else {
                throw e;
            }
        }
        
        try {
            await pool.execute(
                "ALTER TABLE users ADD COLUMN level3_questions_completed BOOLEAN DEFAULT FALSE COMMENT 'Has completed Level 3 profile questions'"
            );
            console.log('✓ Added level3_questions_completed column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level3_questions_completed column already exists');
            } else {
                throw e;
            }
        }
        
        try {
            await pool.execute(
                "ALTER TABLE users ADD COLUMN level2_completed_at TIMESTAMP NULL COMMENT 'When Level 2 was completed'"
            );
            console.log('✓ Added level2_completed_at column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level2_completed_at column already exists');
            } else {
                throw e;
            }
        }
        
        try {
            await pool.execute(
                "ALTER TABLE users ADD COLUMN level3_completed_at TIMESTAMP NULL COMMENT 'When Level 3 was completed'"
            );
            console.log('✓ Added level3_completed_at column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ level3_completed_at column already exists');
            } else {
                throw e;
            }
        }
        
        console.log('\nMigration completed successfully!');
        
    } catch (error) {
        console.error('Migration error:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
