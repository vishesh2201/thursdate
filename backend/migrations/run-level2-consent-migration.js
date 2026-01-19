const pool = require('../config/db');

async function runLevel2ConsentMigration() {
    console.log('🔄 Running Level 2 consent migration...\n');
    
    try {
        // Read and execute migration file
        const fs = require('fs');
        const path = require('path');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'add-level2-consent.sql'),
            'utf8'
        );
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.toLowerCase().includes('select')) {
                const [result] = await pool.execute(statement);
                console.log('✅', result[0]);
            } else {
                await pool.execute(statement);
                console.log('✅ Executed:', statement.substring(0, 60) + '...');
            }
        }
        
        console.log('\n✨ Level 2 consent migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runLevel2ConsentMigration();
