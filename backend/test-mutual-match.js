// Quick script to test mutual matches
// Usage: node test-mutual-match.js <user1_id> <user2_id>

require('dotenv').config();
const pool = require('./config/db');

async function createMutualMatch(user1Id, user2Id) {
    try {
        console.log(`\n🧪 Creating mutual match between User ${user1Id} and User ${user2Id}...\n`);

        // User 1 likes User 2
        await pool.execute(
            `INSERT INTO user_actions (user_id, target_user_id, action_type) 
             VALUES (?, ?, 'like')
             ON DUPLICATE KEY UPDATE action_type = 'like', created_at = CURRENT_TIMESTAMP`,
            [user1Id, user2Id]
        );
        console.log(`✅ User ${user1Id} liked User ${user2Id}`);

        // User 2 likes User 1 back
        await pool.execute(
            `INSERT INTO user_actions (user_id, target_user_id, action_type) 
             VALUES (?, ?, 'like')
             ON DUPLICATE KEY UPDATE action_type = 'like', created_at = CURRENT_TIMESTAMP`,
            [user2Id, user1Id]
        );
        console.log(`✅ User ${user2Id} liked User ${user1Id} back`);

        // Check if they're mutual matches
        const [matches] = await pool.execute(
            `SELECT u1.first_name as user1_name, u2.first_name as user2_name
             FROM user_actions a1
             JOIN user_actions a2 ON a1.user_id = a2.target_user_id AND a1.target_user_id = a2.user_id
             JOIN users u1 ON u1.id = a1.user_id
             JOIN users u2 ON u2.id = a1.target_user_id
             WHERE a1.user_id = ? AND a1.target_user_id = ?
               AND a1.action_type = 'like' AND a2.action_type = 'like'`,
            [user1Id, user2Id]
        );

        if (matches.length > 0) {
            console.log(`\n🎉 SUCCESS! ${matches[0].user1_name} and ${matches[0].user2_name} are now matched!\n`);
        } else {
            console.log(`\n❌ No mutual match found. Something went wrong.\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get user IDs from command line arguments
const user1Id = parseInt(process.argv[2]);
const user2Id = parseInt(process.argv[3]);

if (!user1Id || !user2Id) {
    console.log('Usage: node test-mutual-match.js <user1_id> <user2_id>');
    console.log('Example: node test-mutual-match.js 1 2');
    process.exit(1);
}

createMutualMatch(user1Id, user2Id);
