const pool = require('../config/db');

// Helper function to extract city from location string
const extractCity = (locationString) => {
    if (!locationString || typeof locationString !== 'string') return null;
    const parts = locationString.split(',').map(p => p.trim());
    let cityName = parts[0] || null;
    
    if (!cityName) return null;
    
    // Normalize city name - remove common suffixes
    cityName = cityName
        .replace(/\s+District$/i, '')
        .replace(/\s+City$/i, '')
        .replace(/\s+Metropolitan$/i, '')
        .replace(/\s+Metro$/i, '')
        .replace(/\s+Urban$/i, '')
        .replace(/\s+Area$/i, '')
        .trim();
    
    // Capitalize first letter of each word for consistency
    cityName = cityName
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return cityName;
};

async function populateCityField() {
    try {
        console.log('🚀 Starting city field population migration...');
        
        // Get all users with current_location (to normalize existing city names too)
        const [users] = await pool.execute(
            `SELECT id, current_location, city 
             FROM users 
             WHERE current_location IS NOT NULL 
               AND current_location != ''`
        );
        
        console.log(`📊 Found ${users.length} users with location data`);
        
        let updated = 0;
        let skipped = 0;
        let alreadyCorrect = 0;
        
        for (const user of users) {
            const newCity = extractCity(user.current_location);
            
            if (newCity) {
                // Update if city is different (including case differences)
                if (user.city !== newCity) {
                    await pool.execute(
                        'UPDATE users SET city = ? WHERE id = ?',
                        [newCity, user.id]
                    );
                    updated++;
                    console.log(`✅ User ${user.id}: "${user.city}" → "${newCity}"`);
                } else {
                    alreadyCorrect++;
                }
            } else {
                skipped++;
                console.log(`⚠️  User ${user.id}: Could not extract city from "${user.current_location}"`);
            }
        }
        
        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ✓  Already correct: ${alreadyCorrect}`);
        console.log(`   ⚠️  Skipped: ${skipped}`);
        console.log(`   📊 Total: ${users.length}`);
        console.log('\n✨ City field population completed!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
populateCityField();
