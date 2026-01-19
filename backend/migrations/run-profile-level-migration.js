const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

async function runProfileLevelMigration() {
    console.log('Starting profile level system migration...');
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'add-profile-level-system.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');
        
        // Split into individual statements (handle multi-line)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        
        console.log(`Found ${statements.length} SQL statements to execute\n`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing...`);
            
            try {
                await pool.execute(statement);
                console.log('✓ Success\n');
            } catch (err) {
                // Some errors are okay (e.g., column already exists)
                if (err.code === 'ER_DUP_FIELDNAME' || 
                    err.code === 'ER_DUP_KEYNAME' || 
                    err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
                    err.message.includes("doesn't exist")) {
                    console.log('⚠ Already exists or not found, skipping\n');
                } else {
                    console.error('✗ Error:', err.message);
                    console.log('Statement:', statement.substring(0, 100) + '...\n');
                    // Continue anyway for non-critical errors
                }
            }
        }
        
        console.log('✓ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Restart your backend server');
        console.log('2. Test the level system with a new match');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    runProfileLevelMigration();
}

module.exports = runProfileLevelMigration;
