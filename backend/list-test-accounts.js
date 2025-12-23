// List all seeded test accounts
require('dotenv').config();
const pool = require('./config/db');

async function listTestAccounts() {
    try {
        console.log('\n📋 Available Test Accounts\n');
        console.log('═'.repeat(80));
        console.log('🔑 Default Password for ALL accounts: password123');
        console.log('═'.repeat(80));
        console.log();

        const [users] = await pool.execute(
            `SELECT id, email, first_name, last_name, gender, current_location, approval, onboarding_complete
             FROM users 
             ORDER BY id`
        );

        users.forEach((user, index) => {
            const status = user.approval && user.onboarding_complete 
                ? '✅ Active' 
                : user.onboarding_complete 
                    ? '⏳ Pending Approval' 
                    : '📝 Incomplete';
            
            console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🆔 ID: ${user.id}`);
            console.log(`   👤 Gender: ${user.gender}`);
            console.log(`   📍 Location: ${user.current_location}`);
            console.log(`   ${status}`);
            console.log();
        });

        console.log('═'.repeat(80));
        console.log('💡 To login:');
        console.log('   1. Use any email from above');
        console.log('   2. Password: password123');
        console.log('   3. Open two browser windows (normal + incognito) to test matching');
        console.log('═'.repeat(80));
        console.log();

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listTestAccounts();
