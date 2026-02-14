// Migration script to add reply functionality to messages table
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🔄 Running message reply migration...');
        
        // Read the SQL migration file
        const sqlPath = path.join(__dirname, 'add-message-reply.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolons but keep them for proper statement termination
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.toUpperCase().startsWith('USE'));
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
                console.log(statement.substring(0, 100) + '...');
                await pool.execute(statement);
                console.log('✅ Success');
            }
        }
        
        console.log('\n✅ Message reply migration completed successfully!');
        console.log('📋 Changes applied:');
        console.log('   - Added reply_to_message_id column to messages table');
        console.log('   - Added foreign key constraint for reply references');
        console.log('   - Added index for better query performance');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

runMigration();
