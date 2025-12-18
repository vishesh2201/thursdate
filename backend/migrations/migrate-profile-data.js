// Data Migration Script: Extract profileQuestions data to new columns
// Run this AFTER running add-profile-columns.sql
// This migrates existing user data from intent.profileQuestions to new columns

const pool = require('../config/db');

const safeJsonParse = (jsonString, defaultValue = null) => {
    if (!jsonString) return defaultValue;
    try {
        if (typeof jsonString === 'string') {
            return JSON.parse(jsonString);
        }
        return jsonString;
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
};

async function migrateProfileData() {
    console.log('Starting profile data migration...');
    
    try {
        // Get all users with onboarding complete
        const [users] = await pool.execute(
            'SELECT id, intent FROM users WHERE onboarding_complete = TRUE'
        );
        
        console.log(`Found ${users.length} users to migrate`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const user of users) {
            try {
                const intent = safeJsonParse(user.intent, {});
                const profileQuestions = intent.profileQuestions || {};
                const interests = intent.interests || [];
                
                // Extract data from profileQuestions
                const pets = profileQuestions.pets || null;
                const drinking = profileQuestions.drinking || null;
                const smoking = profileQuestions.smoking || null;
                const height = profileQuestions.height ? parseInt(profileQuestions.height) : null;
                const religiousLevel = profileQuestions.religiousLevel || null;
                const kidsPreference = profileQuestions.kids || null;
                const foodPreference = profileQuestions.foodPreference || null;
                
                // Update user with extracted data
                await pool.execute(
                    `UPDATE users SET 
                        interests = ?,
                        pets = ?,
                        drinking = ?,
                        smoking = ?,
                        height = ?,
                        religious_level = ?,
                        kids_preference = ?,
                        food_preference = ?
                    WHERE id = ?`,
                    [
                        JSON.stringify(interests),
                        pets,
                        drinking,
                        smoking,
                        height,
                        religiousLevel,
                        kidsPreference,
                        foodPreference,
                        user.id
                    ]
                );
                
                successCount++;
                console.log(`✓ Migrated user ${user.id}`);
                
            } catch (err) {
                errorCount++;
                console.error(`✗ Error migrating user ${user.id}:`, err.message);
            }
        }
        
        console.log('\n=== Migration Complete ===');
        console.log(`Success: ${successCount} users`);
        console.log(`Errors: ${errorCount} users`);
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migration
migrateProfileData()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Migration script failed:', err);
        process.exit(1);
    });
