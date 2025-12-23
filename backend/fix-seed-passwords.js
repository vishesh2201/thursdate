// Update seeded users (IDs 16-21) with correct password: password123
require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function updateSeedPasswords() {
    try {
        console.log('\n🔐 Updating seeded user passwords to "password123"...\n');

        // Generate hash for password123
        const passwordHash = await bcrypt.hash('password123', 10);

        // Update seeded users (IDs 16-21: Sarah, Alex, Priya, Rahul, Ananya, Vikram)
        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE id BETWEEN 16 AND 21',
            [passwordHash]
        );

        console.log(`✅ Updated ${result.affectedRows} user passwords`);
        console.log('\n📋 You can now login with these accounts:');
        console.log('   • sarah.johnson@example.com / password123');
        console.log('   • alex.chen@example.com / password123');
        console.log('   • priya.sharma@example.com / password123');
        console.log('   • rahul.verma@example.com / password123');
        console.log('   • ananya.kapoor@example.com / password123');
        console.log('   • vikram.singh@example.com / password123');
        console.log('\n🎉 Ready to test matching!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateSeedPasswords();
