// Run SQL migration to create user_actions table
require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📝 Starting user_actions table migration...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'create-user-actions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments first, then split by semicolon
        const lines = sql.split('\n');
        const cleanedLines = lines
            .map(line => {
                // Remove inline comments
                const commentIndex = line.indexOf('--');
                if (commentIndex !== -1) {
                    return line.substring(0, commentIndex);
                }
                return line;
            })
            .filter(line => line.trim().length > 0);
        
        const cleanedSql = cleanedLines.join('\n');
        
        // Split by semicolon and filter empty statements
        const statements = cleanedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`Found ${statements.length} SQL statements to execute\n`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing:`, stmt.substring(0, 100) + '...');
            
            try {
                await pool.execute(stmt);
                console.log('✅ Success\n');
            } catch (error) {
                // Check if error is "table already exists"
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️  Table already exists, skipping...\n');
                } else {
                    console.error('❌ Error executing statement:', error.message);
                    throw error;
                }
            }
        }
        
        console.log('✅ Migration completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
