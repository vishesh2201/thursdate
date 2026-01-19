const pool = require('./config/db.js');

async function fixLevelColumns() {
    console.log('✅ Using database pool');

    try {
        // Check conversations table columns
        const conversationCols = await pool.execute('DESCRIBE conversations');
        const existingConvCols = conversationCols[0].map(r => r.Field);
        console.log('\nExisting conversations columns:', existingConvCols);

        // Add missing columns to conversations
        const conversationColumns = [
            { name: 'current_level', sql: 'ALTER TABLE conversations ADD COLUMN current_level INT DEFAULT 1' },
            { name: 'message_count', sql: 'ALTER TABLE conversations ADD COLUMN message_count INT DEFAULT 0' },
            { name: 'level2_user1_completed', sql: 'ALTER TABLE conversations ADD COLUMN level2_user1_completed BOOLEAN DEFAULT FALSE' },
            { name: 'level2_user2_completed', sql: 'ALTER TABLE conversations ADD COLUMN level2_user2_completed BOOLEAN DEFAULT FALSE' },
            { name: 'level3_user1_consent', sql: 'ALTER TABLE conversations ADD COLUMN level3_user1_consent BOOLEAN DEFAULT FALSE' },
            { name: 'level3_user2_consent', sql: 'ALTER TABLE conversations ADD COLUMN level3_user2_consent BOOLEAN DEFAULT FALSE' },
            { name: 'level2_unlocked_at', sql: 'ALTER TABLE conversations ADD COLUMN level2_unlocked_at TIMESTAMP NULL' },
            { name: 'level3_unlocked_at', sql: 'ALTER TABLE conversations ADD COLUMN level3_unlocked_at TIMESTAMP NULL' }
        ];

        for (const col of conversationColumns) {
            if (!existingConvCols.includes(col.name)) {
                console.log(`\nAdding ${col.name} to conversations...`);
                await pool.execute(col.sql);
                console.log(`✅ Added ${col.name}`);
            } else {
                console.log(`⏭️  ${col.name} already exists`);
            }
        }

        // Check users table columns
        const userCols = await pool.execute('DESCRIBE users');
        const existingUserCols = userCols[0].map(r => r.Field);
        console.log('\nExisting users columns:', existingUserCols);

        // Add missing columns to users
        const userColumns = [
            { name: 'level2_questions_completed', sql: 'ALTER TABLE users ADD COLUMN level2_questions_completed BOOLEAN DEFAULT FALSE' },
            { name: 'level3_questions_completed', sql: 'ALTER TABLE users ADD COLUMN level3_questions_completed BOOLEAN DEFAULT FALSE' },
            { name: 'level2_completed_at', sql: 'ALTER TABLE users ADD COLUMN level2_completed_at TIMESTAMP NULL' },
            { name: 'level3_completed_at', sql: 'ALTER TABLE users ADD COLUMN level3_completed_at TIMESTAMP NULL' }
        ];

        for (const col of userColumns) {
            if (!existingUserCols.includes(col.name)) {
                console.log(`\nAdding ${col.name} to users...`);
                await pool.execute(col.sql);
                console.log(`✅ Added ${col.name}`);
            } else {
                console.log(`⏭️  ${col.name} already exists`);
            }
        }

        console.log('\n✅ All level system columns are in place!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

fixLevelColumns()
    .then(() => {
        console.log('\n✅ Complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    });
