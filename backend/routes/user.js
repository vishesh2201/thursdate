const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const matchExpiryService = require('../services/matchExpiry');
const profileLevelService = require('../services/profileLevelService');
const router = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, defaultValue = null) => {
    if (!jsonString) return defaultValue;
    try {
        // Only parse if it's a string; sometimes MySQL drivers return objects/arrays directly
        if (typeof jsonString === 'string') {
            return JSON.parse(jsonString);
        }
        return jsonString;
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
};

// Helper function to extract city from location string
// Examples: "Mumbai, India" -> "Mumbai", "New York, NY, USA" -> "New York"
// Normalizes city names: "Pune District" -> "Pune", "Mumbai City" -> "Mumbai"
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

// Helper function to validate database connection
const validateConnection = async () => {
    try {
        await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database connection validation failed:', error);
        return false;
    }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const [users] = await pool.execute(
            // 🛑 FIX: is_private REMOVED from the SELECT query
            'SELECT id, email, first_name, last_name, gender, dob, current_location, city, location_preference, favourite_travel_destination, last_holiday_places, favourite_places_to_go, profile_pic_url, face_photo_url, approval, intent, onboarding_complete, interests, pets, drinking, smoking, height, religious_level, kids_preference, food_preference, relationship_status, from_location, instagram, linkedin, face_photos FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        
        // CRITICAL FIX: Add defensive null checks and boolean coercion.
        const transformedUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name || null,
            lastName: user.last_name || null,
            gender: user.gender || null,
            dob: user.dob || null,
            currentLocation: user.current_location || null,
            city: user.city || null,
            locationPreference: user.location_preference || 'same_city',
            // ✅ SWAPPED: favouriteTravelDestination is now JSON array
            favouriteTravelDestination: safeJsonParse(user.favourite_travel_destination, []),
            // ✅ SWAPPED: lastHolidayPlaces is now a string
            lastHolidayPlaces: user.last_holiday_places || null,
            favouritePlacesToGo: safeJsonParse(user.favourite_places_to_go, []),
            profilePicUrl: user.profile_pic_url || null,
            faceVerificationUrl: user.face_photo_url || null,
            intent: safeJsonParse(user.intent, {}),
            onboardingComplete: !!user.onboarding_complete, // Ensure boolean
            approval: !!user.approval,                     // Ensure boolean
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            // 🛑 isPrivate REMOVED from output object
            // ✅ NEW: Profile columns from hybrid storage approach
            interests: safeJsonParse(user.interests, []),
            pets: user.pets || null,
            drinking: user.drinking || null,
            smoking: user.smoking || null,
            height: user.height || null,
            religiousLevel: user.religious_level || null,
            kidsPreference: user.kids_preference || null,
            foodPreference: user.food_preference || null,
            relationshipStatus: user.relationship_status || null,
            fromLocation: user.from_location || null,
            instagram: user.instagram || null,
            linkedin: user.linkedin || null,
            facePhotos: safeJsonParse(user.face_photos, []),
        };
        
        res.json(transformedUser);
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get another user's profile by ID (for viewing matched users, etc.)
router.get('/profile/:userId', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const targetUserId = parseInt(req.params.userId);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // ✅ NEW: Check if conversationId is provided for level-based filtering
        const { conversationId } = req.query;

        // Fetch complete user profile from users table (authoritative source)
        const [users] = await pool.execute(
            `SELECT id, first_name, last_name, gender, dob, current_location, 
                    favourite_travel_destination, last_holiday_places, favourite_places_to_go, 
                    profile_pic_url, intent, interests, pets, drinking, smoking, height, 
                    religious_level, kids_preference, food_preference, relationship_status, 
                    from_location, instagram, linkedin, face_photos 
             FROM users 
             WHERE id = ? AND approval = true`,
            [targetUserId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        
        // Calculate age
        let age = null;
        if (user.dob) {
            const birthDate = new Date(user.dob);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }
        
        // Build complete profile data
        const profileData = {
            id: user.id,
            firstName: user.first_name || null,
            lastName: user.last_name || null,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            gender: user.gender || null,
            age: age,
            dob: user.dob || null,
            currentLocation: user.current_location || null,
            location: user.current_location || null,
            // ✅ SWAPPED: favouriteTravelDestination is now JSON array
            favouriteTravelDestination: safeJsonParse(user.favourite_travel_destination, []),
            // ✅ SWAPPED: lastHolidayPlaces is now a string
            lastHolidayPlaces: user.last_holiday_places || null,
            favouritePlacesToGo: safeJsonParse(user.favourite_places_to_go, []),
            profilePicUrl: user.profile_pic_url || null,
            intent: safeJsonParse(user.intent, {}),
            interests: safeJsonParse(user.interests, []),
            pets: user.pets || null,
            drinking: user.drinking || null,
            smoking: user.smoking || null,
            height: user.height || null,
            religiousLevel: user.religious_level || null,
            kidsPreference: user.kids_preference || null,
            foodPreference: user.food_preference || null,
            relationshipStatus: user.relationship_status || null,
            fromLocation: user.from_location || null,
            instagram: user.instagram || null,
            linkedin: user.linkedin || null,
            facePhotos: safeJsonParse(user.face_photos, []),
        };
        
        // ✅ NEW: If conversationId provided, filter by visibility level
        if (conversationId) {
            const convId = parseInt(conversationId);
            if (!isNaN(convId)) {
                try {
                    // Get visibility level
                    const visibility = await profileLevelService.getVisibilityLevel(
                        convId, 
                        req.user.userId, 
                        targetUserId
                    );
                    
                    console.log(`[Profile Filter] User ${req.user.userId} viewing ${targetUserId} in conv ${convId}`, {
                        level: visibility.level,
                        canUpgrade: visibility.canUpgrade,
                        nextLevelAt: visibility.nextLevelAt
                    });
                    
                    // Filter profile based on level
                    const filteredProfile = profileLevelService.filterProfileByLevel(profileData, visibility.level);
                    
                    console.log('[Profile Filter] Filtered fields:', Object.keys(filteredProfile));
                    console.log('[Profile Filter] Level 2 fields present:', {
                        pets: filteredProfile.pets,
                        drinking: filteredProfile.drinking,
                        smoking: filteredProfile.smoking,
                        height: filteredProfile.height,
                        foodPreference: filteredProfile.foodPreference,
                        religiousLevel: filteredProfile.religiousLevel
                    });
                    
                    // Add visibility metadata
                    filteredProfile.visibilityLevel = visibility.level;
                    filteredProfile.canUpgrade = visibility.canUpgrade;
                    filteredProfile.nextLevelAt = visibility.nextLevelAt;
                    filteredProfile.personalTabUnlocked = visibility.personalTabUnlocked; // ✅ NEW: Personal tab lock state
                    
                    return res.json(filteredProfile);
                } catch (levelError) {
                    console.error('Level filtering error:', levelError);
                    // Fall through to return full profile if filtering fails
                }
            }
        }
        
        // Return complete profile (for Discover tab or if filtering failed)
        res.json(profileData);
        
    } catch (error) {
        console.error('Get user profile by ID error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Save user profile (for onboarding)
router.post('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl, faceVerificationUrl
        } = req.body;
        
        let formattedDob = dob ? new Date(dob).toISOString().split('T')[0] : null;
        // ✅ SWAPPED: favouriteTravelDestination is now JSON array
        const favouriteTravelDestinationJson = JSON.stringify(favouriteTravelDestination || []);
        // ✅ SWAPPED: lastHolidayPlaces is now a string (no JSON.stringify)
        const favouritePlacesToGoJson = JSON.stringify(favouritePlacesToGo || []);
        
        // Extract city from currentLocation
        const city = currentLocation ? extractCity(currentLocation) : null;
        
        await pool.execute(
            // 🛑 is_private REMOVED from UPDATE query
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, city = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, face_photo_url = ?, approval = false
            WHERE id = ?`,
            [
                firstName || null, 
                lastName || null, 
                gender || null, 
                formattedDob, 
                currentLocation || null,
                city,
                favouriteTravelDestinationJson, // ✅ SWAPPED: Now JSON
                lastHolidayPlaces || null, // ✅ SWAPPED: Now string
                favouritePlacesToGoJson, 
                profilePicUrl || null, 
                faceVerificationUrl || null,
                req.user.userId
            ]
        );
        
        res.json({ message: 'Profile saved successfully' });
        
    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const [currentUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (currentUsers.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentUser = currentUsers[0];
        const currentIntent = safeJsonParse(currentUser.intent, {});
        
        // Helper function to convert empty/invalid integers to null
        const parseIntOrNull = (value) => {
            if (value === null || value === undefined || value === '') return null;
            const parsed = parseInt(value);
            return isNaN(parsed) ? null : parsed;
        };
        
        // 🔍 DEBUG: Log incoming data
        console.log('PUT /profile - Received data:', {
            hasInterests: !!req.body.interests,
            hasPets: !!req.body.pets,
            hasDrinking: !!req.body.drinking,
            hasSmoking: !!req.body.smoking,
            hasHeight: !!req.body.height,
            pets: req.body.pets,
            drinking: req.body.drinking,
            smoking: req.body.smoking,
            height: req.body.height,
        });
        
        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl, intent, onboardingComplete,
            isPrivate, // This is read, but won't be used in the SQL/updateData
            locationPreference, // ✅ NEW: Location matching preference
            // ✅ NEW: Extract profile fields for hybrid storage
            interests, pets, drinking, smoking, height, religiousLevel, kidsPreference, 
            foodPreference, relationshipStatus, fromLocation, instagram, linkedin, facePhotos
        } = req.body;
        
        let finalIntent = { ...currentIntent, ...intent };
        const intentJson = JSON.stringify(finalIntent); 
        
        // Keep the current approval status - don't change it when onboarding completes
        let finalApprovalStatus = currentUser.approval;
        
        // Extract city from currentLocation if provided
        const city = currentLocation !== undefined ? extractCity(currentLocation) : currentUser.city;

        const updateData = [
            firstName !== undefined ? firstName : currentUser.first_name,
            lastName !== undefined ? lastName : currentUser.last_name,
            gender !== undefined ? gender : currentUser.gender,
            dob ? new Date(dob).toISOString().split('T')[0] : currentUser.dob, 
            currentLocation !== undefined ? currentLocation : currentUser.current_location,
            city,
            locationPreference !== undefined ? locationPreference : (currentUser.location_preference || 'same_city'),
            // ✅ SWAPPED: favouriteTravelDestination is now JSON array
            JSON.stringify(favouriteTravelDestination !== undefined ? favouriteTravelDestination : safeJsonParse(currentUser.favourite_travel_destination, [])),
            // ✅ SWAPPED: lastHolidayPlaces is now a string
            lastHolidayPlaces !== undefined ? lastHolidayPlaces : (currentUser.last_holiday_places || null),
            JSON.stringify(favouritePlacesToGo !== undefined ? favouritePlacesToGo : safeJsonParse(currentUser.favourite_places_to_go, [])),
            profilePicUrl !== undefined ? profilePicUrl : currentUser.profile_pic_url,
            intentJson,
            onboardingComplete !== undefined ? onboardingComplete : currentUser.onboarding_complete,
            // 🛑 isPrivate removed from here
            finalApprovalStatus,
            // ✅ NEW: Profile columns for hybrid storage
            JSON.stringify(interests !== undefined ? interests : safeJsonParse(currentUser.interests, [])),
            pets !== undefined ? pets : currentUser.pets,
            drinking !== undefined ? drinking : currentUser.drinking,
            smoking !== undefined ? smoking : currentUser.smoking,
            height !== undefined ? parseIntOrNull(height) : currentUser.height,
            religiousLevel !== undefined ? religiousLevel : currentUser.religious_level,
            kidsPreference !== undefined ? kidsPreference : currentUser.kids_preference,
            foodPreference !== undefined ? foodPreference : currentUser.food_preference,
            relationshipStatus !== undefined ? relationshipStatus : currentUser.relationship_status,
            fromLocation !== undefined ? fromLocation : currentUser.from_location,
            instagram !== undefined ? instagram : currentUser.instagram,
            linkedin !== undefined ? linkedin : currentUser.linkedin,
            JSON.stringify(facePhotos !== undefined ? facePhotos : safeJsonParse(currentUser.face_photos, [])),
            req.user.userId
        ];
        
        await pool.execute(
            // 🛑 is_private REMOVED from UPDATE query
            // ✅ NEW: Added profile columns for hybrid storage + city & location_preference
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, city = ?, location_preference = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, intent = ?, onboarding_complete = ?,
                approval = ?,
                interests = ?, pets = ?, drinking = ?, smoking = ?, height = ?,
                religious_level = ?, kids_preference = ?, food_preference = ?,
                relationship_status = ?, from_location = ?, instagram = ?, linkedin = ?,
                face_photos = ?
            WHERE id = ?`,
            updateData 
        );

        // ✅ Mark Level 2 completed if required fields are provided
        const hasLevel2Data = pets && drinking && smoking && height && religiousLevel && kidsPreference && foodPreference;
        if (hasLevel2Data) {
            await pool.execute(
                'UPDATE users SET level2_questions_completed = TRUE, level2_completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [req.user.userId]
            );
            console.log(`[Level 2] Marked as completed for user ${req.user.userId}`);
        }

        // ✅ Mark Level 3 completed if face photos are provided
        if (facePhotos !== undefined && Array.isArray(facePhotos) && facePhotos.length >= 4) {
            await pool.execute(
                'UPDATE users SET level3_questions_completed = TRUE WHERE id = ?',
                [req.user.userId]
            );
            console.log(`[Level 3] Marked as completed for user ${req.user.userId} (uploaded ${facePhotos.length} face photos)`);
        }
        
        res.json({ message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ❌ SECURITY FLAW & DUPLICATE ROUTE - THIS MUST BE REMOVED/MOVED
router.put('/approve/:userId', auth, async (req, res) => {
    // This entire route should be removed as it's a security flaw and duplicated logic.
    // The correct endpoint is in admin.js: PUT /admin/users/:userId/approval
    res.status(403).json({ error: 'Route deprecated. Use /admin/users/:userId/approval' });
});

// Get potential matches for the current user
router.get('/matches/potential', auth, async (req, res) => {
    try {
        // Validate userId
        const userId = req.user?.userId;
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid or missing userId' });
        }

        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        // Get current user's preferences including location
        const [currentUserData] = await pool.execute(
            'SELECT intent, city, location_preference FROM users WHERE id = ?',
            [userId]
        );

        if (currentUserData.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUserIntent = safeJsonParse(currentUserData[0].intent, {});
        const preferredAgeRange = currentUserIntent.preferredAgeRange || [35, 85];
        const interestedGender = currentUserIntent.interestedGender;
        const userCity = currentUserData[0].city;
        const locationPreference = currentUserData[0].location_preference || 'same_city';

        // Validate age range
        const minAge = preferredAgeRange[0];
        const maxAge = preferredAgeRange[1];
        
        if (minAge === undefined || minAge === null || isNaN(minAge)) {
            return res.status(400).json({ error: 'Invalid minAge value' });
        }
        if (maxAge === undefined || maxAge === null || isNaN(maxAge)) {
            return res.status(400).json({ error: 'Invalid maxAge value' });
        }

        // Normalize gender preference - handle all possible values
        let normalizedGender = 'both';
        if (interestedGender) {
            const rawGender = String(interestedGender).toLowerCase().trim();
            const genderMap = {
                'male': 'male', 'men': 'male', 'm': 'male',
                'female': 'female', 'women': 'female', 'woman': 'female', 'f': 'female',
                'both': 'both', 'everyone': 'both', 'all': 'both', 'any': 'both', 'anyone': 'both'
            };
            normalizedGender = genderMap[rawGender] || 'both';
        }
        
        console.log('[DEBUG] Gender matching:', { 
            rawInterestedGender: interestedGender, 
            normalizedGender, 
            willFilterBy: normalizedGender !== 'both' 
        });

        // Calculate DOB range in Node.js to avoid YEAR(dob) malformed packet error
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();
        
        // minDob = oldest allowed birth date (today - maxAge years)
        const minDob = new Date(currentYear - maxAge - 1, currentMonth, currentDay);
        // maxDob = youngest allowed birth date (today - minAge years)
        const maxDob = new Date(currentYear - minAge, currentMonth, currentDay);
        
        // Format dates for MySQL YYYY-MM-DD
        const minDobStr = minDob.toISOString().split('T')[0];
        const maxDobStr = maxDob.toISOString().split('T')[0];

        console.log('[DEBUG] Match filter:', { userId, minAge, maxAge, normalizedGender, minDob: minDobStr, maxDob: maxDobStr });
        
        // Build WHERE clause for gender
        let genderClause = '';
        const queryParams = [userId, minDobStr, maxDobStr];
        
        if (normalizedGender !== 'both') {
            // Capitalize for DB: male -> Male, female -> Female
            const dbGender = normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1);
            
            // Handle variations in gender data (Female/Woman, Male/Man)
            if (normalizedGender === 'female') {
                genderClause = ' AND (gender = ? OR gender = ?)';
                queryParams.push('Female', 'Woman');
            } else if (normalizedGender === 'male') {
                genderClause = ' AND (gender = ? OR gender = ?)';
                queryParams.push('Male', 'Man');
            } else {
                genderClause = ' AND gender = ?';
                queryParams.push(dbGender);
            }
            
            console.log('[DEBUG] Filtering by gender:', normalizedGender, 'with values:', queryParams.slice(3));
        } else {
            console.log('[DEBUG] Not filtering by gender (showing all)');
        }

        console.log('[DEBUG] Query params:', queryParams);

        // Build location clause based on user preference
        let locationClause = '';
        if (locationPreference === 'same_city') {
            if (userCity) {
                locationClause = ' AND city = ?';
                queryParams.push(userCity);
                console.log('[DEBUG] Filtering by same city:', userCity);
            } else {
                console.warn('[WARNING] User selected same_city but user.city is null/empty. Skipping location filter.');
                // Don't filter by location if user's city is not set
                // Alternative: return empty results to indicate profile is incomplete
                // return res.json({ candidates: [] }); // Uncomment to require city be set
            }
        } else if (locationPreference === 'nearby_cities') {
            if (userCity) {
                // TODO: Implement nearby cities logic with a cities mapping table
                // For now, match same city + common nearby variants
                locationClause = ' AND (city = ? OR city LIKE ?)';
                queryParams.push(userCity, `${userCity}%`);
                console.log('[DEBUG] Filtering by nearby cities:', userCity);
            } else {
                console.warn('[WARNING] User selected nearby_cities but user.city is null/empty. Skipping location filter.');
            }
        } else {
            console.log('[DEBUG] No location filtering (anywhere) - preference:', locationPreference);
        }

        // Get potential matches using dob BETWEEN (no YEAR function, no ORDER BY RAND)
        // Exclude blocked users (both users who blocked current user and users blocked by current user)
        // If filtering by location, also ensure candidate has a city set
        const cityRequirementClause = (locationPreference === 'same_city' || locationPreference === 'nearby_cities') 
            ? ' AND city IS NOT NULL AND city != \'\'' 
            : '';
        
        const [users] = await pool.execute(
            `SELECT id, email, first_name, last_name, gender, dob, current_location, city,
                    favourite_travel_destination, profile_pic_url, intent, 
                    interests, pets, drinking, smoking, height, religious_level, 
                    kids_preference, food_preference, relationship_status, from_location, 
                    instagram, linkedin, face_photos
             FROM users 
             WHERE approval = true 
                AND id != ? 
                AND onboarding_complete = true
                AND dob IS NOT NULL
                AND CAST(dob AS CHAR) != '0000-00-00'
                AND dob BETWEEN ? AND ?
                ${genderClause}
                ${locationClause}
                ${cityRequirementClause}
                AND NOT EXISTS (
                  SELECT 1 FROM blocks b 
                  WHERE (b.blocker_id = ? AND b.blocked_id = users.id)
                     OR (b.blocker_id = users.id AND b.blocked_id = ?)
                )
             LIMIT 20`,
            [...queryParams, userId, userId]
        );

        console.log('[DEBUG] Found users:', users.length, users.length > 0 ? users.map(u => ({ 
            id: u.id, 
            gender: u.gender, 
            firstName: u.first_name,
            city: u.city,
            location: u.current_location 
        })) : 'No users found');

        // Parse JSON fields and calculate exact age
        const candidates = users
            .map(user => {
                let age = null;
                if (user.dob) {
                    const birthDate = new Date(user.dob);
                    age = currentYear - birthDate.getFullYear();
                    const m = currentMonth - birthDate.getMonth();
                    if (m < 0 || (m === 0 && currentDay < birthDate.getDate())) {
                        age--;
                    }
                }

                return {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    age: age,
                    gender: user.gender,
                    dob: user.dob,
                    currentLocation: user.current_location,
                    city: user.city,
                    fromLocation: user.from_location,
                    favouriteTravelDestination: user.favourite_travel_destination,
                    profilePicUrl: user.profile_pic_url,
                    height: user.height,
                    relationshipStatus: user.relationship_status,
                    pets: user.pets,
                    drinking: user.drinking,
                    smoking: user.smoking,
                    foodPreference: user.food_preference,
                    religiousLevel: user.religious_level,
                    kidsPreference: user.kids_preference,
                    instagram: user.instagram,
                    linkedin: user.linkedin,
                    interests: safeJsonParse(user.interests, []),
                    facePhotos: safeJsonParse(user.face_photos, []),
                    intent: safeJsonParse(user.intent, {})
                };
            })
            .filter(user => {
                if (user.age === null) return false;
                return user.age >= minAge && user.age <= maxAge;
            });

        res.json({ candidates });

    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Failed to fetch potential matches. Please try again later.' });
    }
});

// Record a match action (like or skip)
router.post('/matches/action', auth, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { targetUserId, actionType } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!targetUserId || !actionType) {
            return res.status(400).json({ error: 'Target user ID and action type are required' });
        }

        if (!['like', 'skip'].includes(actionType)) {
            return res.status(400).json({ error: 'Action type must be "like" or "skip"' });
        }

        // Prevent self-actions
        if (userId === targetUserId) {
            return res.status(400).json({ error: 'Cannot perform action on yourself' });
        }

        await connection.beginTransaction();

        // Combined query: Insert action AND check for mutual match in single query
        // This is more efficient than separate queries
        const [result] = await connection.execute(
            `INSERT INTO user_actions (user_id, target_user_id, action_type) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE action_type = ?, created_at = CURRENT_TIMESTAMP`,
            [userId, targetUserId, actionType, actionType]
        );

        let isMutualMatch = false;
        let matchData = null;

        // Only check for mutual match if this is a like
        if (actionType === 'like') {
            // Optimized query: Get target user info AND check mutual like in one query
            const [mutualCheck] = await connection.execute(
                `SELECT u.id, u.first_name, u.last_name, u.profile_pic_url
                 FROM user_actions a
                 JOIN users u ON u.id = a.user_id
                 WHERE a.user_id = ? 
                   AND a.target_user_id = ? 
                   AND a.action_type = 'like'
                   AND u.approval = true`,
                [targetUserId, userId]
            );

            if (mutualCheck.length > 0) {
                isMutualMatch = true;
                matchData = {
                    userId: mutualCheck[0].id,
                    firstName: mutualCheck[0].first_name,
                    lastName: mutualCheck[0].last_name,
                    profilePicUrl: mutualCheck[0].profile_pic_url
                };
            }
        }

        await connection.commit();

        res.json({ 
            success: true, 
            action: actionType,
            isMutualMatch,
            matchData
        });

    } catch (error) {
        await connection.rollback();
        console.error('Match action error:', error);
        
        // Handle specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    } finally {
        connection.release();
    }
});

// Get mutual matches
router.get('/matches/mutual', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const userId = req.user.userId;

        // Get all mutual matches, excluding blocked users
        const [matches] = await pool.execute(
            `SELECT DISTINCT
                u.id, u.email, u.first_name, u.last_name, u.gender, u.dob, 
                u.current_location, u.from_location, u.profile_pic_url, u.intent,
                u.interests, u.height, u.relationship_status,
                a2.created_at as matched_at
             FROM user_actions a1
             JOIN user_actions a2 
                ON a1.user_id = a2.target_user_id 
                AND a1.target_user_id = a2.user_id
             JOIN users u ON u.id = a1.target_user_id
             WHERE a1.user_id = ? 
                AND a1.action_type = 'like' 
                AND a2.action_type = 'like'
                AND NOT EXISTS (
                  SELECT 1 FROM blocks b 
                  WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
                     OR (b.blocker_id = u.id AND b.blocked_id = ?)
                )
             ORDER BY a2.created_at DESC`,
            [userId, userId, userId]
        );

        // Parse JSON fields and calculate age
        const mutualMatches = matches.map(user => {
            let age = null;
            if (user.dob) {
                const birthDate = new Date(user.dob);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            return {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                age: age,
                gender: user.gender,
                currentLocation: user.current_location,
                fromLocation: user.from_location,
                profilePicUrl: user.profile_pic_url,
                height: user.height,
                relationshipStatus: user.relationship_status,
                interests: safeJsonParse(user.interests, []),
                intent: safeJsonParse(user.intent, {}),
                matchedAt: user.matched_at
            };
        });

        res.json({ matches: mutualMatches });

    } catch (error) {
        console.error('Get mutual matches error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get users who liked you
router.get('/matches/likes-received', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const userId = req.user.userId;

        // Get all users who liked the current user
        const [likes] = await pool.execute(
            `SELECT DISTINCT
                u.id, u.first_name, u.last_name, u.profile_pic_url, u.gender, u.dob,
                a.created_at as liked_at
             FROM user_actions a
             JOIN users u ON u.id = a.user_id
             WHERE a.target_user_id = ? 
                AND a.action_type = 'like'
                AND u.approval = true
             ORDER BY a.created_at DESC`,
            [userId]
        );

        // Calculate age for each user
        const likesReceived = likes.map(user => {
            let age = null;
            if (user.dob) {
                const birthDate = new Date(user.dob);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                age: age,
                gender: user.gender,
                profilePicUrl: user.profile_pic_url,
                likedAt: user.liked_at
            };
        });

        res.json({ likes: likesReceived });

    } catch (error) {
        console.error('Get likes received error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get matched profiles (for the top "Matched" section)
// This returns only matches that should appear in the matched profiles section
// (excluding active chats that have moved to the chat list)
router.get('/matches/profiles', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const userId = req.user.userId;
        
        // Get matched profiles using the match expiry service
        const profiles = await matchExpiryService.getMatchedProfilesForUser(userId);
        
        res.json({ matches: profiles });

    } catch (error) {
        console.error('Get matched profiles error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

module.exports = router;