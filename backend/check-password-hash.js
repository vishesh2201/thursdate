// Get password hash from a working account
require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function checkPasswords() {
    try {
        // Get a working user's hash (one you created)
        const [users] = await pool.execute(
            'SELECT email, password FROM users WHERE id IN (12, 13, 14, 15) LIMIT 1'
        );

        if (users.length > 0) {
            console.log('\n🔍 Checking password hash from working account...\n');
            console.log('Email:', users[0].email);
            console.log('Hash:', users[0].password);
            
            // Test if it matches password123
            const matches = await bcrypt.compare('password123', users[0].password);
            console.log('\nDoes "password123" work?', matches ? '✅ YES' : '❌ NO');
            
            // Generate a new hash for password123
            console.log('\n📝 Generating correct hash for "password123"...\n');
            const correctHash = await bcrypt.hash('password123', 10);
            console.log('Correct hash to use:');
            console.log(correctHash);
            console.log('\n💡 Update seed-users.sql with this hash!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPasswords();
