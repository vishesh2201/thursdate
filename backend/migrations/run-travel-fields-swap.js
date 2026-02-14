// Migration to swap favourite_travel_destination and last_holiday_places functionality
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
            rejectUnauthorized: true
        }
    });

    try {
        console.log('🔄 Starting travel fields swap migration...');
        
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'swap-travel-fields.sql'), 
            'utf8'
        );
        
        // Split by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 80) + '...');
            await pool.execute(statement);
        }
        
        console.log('✅ Migration completed successfully!');
        console.log('📝 Changes:');
        console.log('   - favourite_travel_destination: VARCHAR(100) → TEXT (JSON array)');
        console.log('   - last_holiday_places: TEXT (array) → VARCHAR(255) (single string)');
        console.log('   - Existing data migrated with swap logic');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration().catch(console.error);
