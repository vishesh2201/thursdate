const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
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
            'SELECT id, email, first_name, last_name, gender, dob, current_location, favourite_travel_destination, last_holiday_places, favourite_places_to_go, profile_pic_url, approval, intent, onboarding_complete, interests, pets, drinking, smoking, height, religious_level, kids_preference, food_preference, relationship_status, from_location, instagram, linkedin, face_photos FROM users WHERE id = ?',
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
            favouriteTravelDestination: user.favourite_travel_destination || null,
            lastHolidayPlaces: safeJsonParse(user.last_holiday_places, []),
            favouritePlacesToGo: safeJsonParse(user.favourite_places_to_go, []),
            profilePicUrl: user.profile_pic_url || null,
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

// Save user profile (for onboarding)
router.post('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl
        } = req.body;
        
        let formattedDob = dob ? new Date(dob).toISOString().split('T')[0] : null;
        const lastHolidayPlacesJson = JSON.stringify(lastHolidayPlaces || []);
        const favouritePlacesToGoJson = JSON.stringify(favouritePlacesToGo || []);
        
        await pool.execute(
            // 🛑 is_private REMOVED from UPDATE query
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, approval = false
            WHERE id = ?`,
            [
                firstName, lastName, gender, formattedDob, currentLocation, 
                favouriteTravelDestination, lastHolidayPlacesJson, 
                favouritePlacesToGoJson, profilePicUrl, req.user.userId
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
            // ✅ NEW: Extract profile fields for hybrid storage
            interests, pets, drinking, smoking, height, religiousLevel, kidsPreference, 
            foodPreference, relationshipStatus, fromLocation, instagram, linkedin, facePhotos
        } = req.body;
        
        let finalIntent = { ...currentIntent, ...intent };
        const intentJson = JSON.stringify(finalIntent); 
        
        // Keep the current approval status - don't change it when onboarding completes
        let finalApprovalStatus = currentUser.approval;

        const updateData = [
            firstName !== undefined ? firstName : currentUser.first_name,
            lastName !== undefined ? lastName : currentUser.last_name,
            gender !== undefined ? gender : currentUser.gender,
            dob ? new Date(dob).toISOString().split('T')[0] : currentUser.dob, 
            currentLocation !== undefined ? currentLocation : currentUser.current_location,
            favouriteTravelDestination !== undefined ? favouriteTravelDestination : currentUser.favourite_travel_destination,
            JSON.stringify(lastHolidayPlaces !== undefined ? lastHolidayPlaces : safeJsonParse(currentUser.last_holiday_places, [])),
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
            height !== undefined ? height : currentUser.height,
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
            // ✅ NEW: Added profile columns for hybrid storage
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, favourite_travel_destination = ?, 
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
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        // Get potential matches - all approved users except the current user
        const [users] = await pool.execute(
            `SELECT id, email, first_name, last_name, gender, dob, current_location, 
                    favourite_travel_destination, profile_pic_url, intent, 
                    interests, pets, drinking, smoking, height, religious_level, 
                    kids_preference, food_preference, relationship_status, from_location, 
                    instagram, linkedin, face_photos
             FROM users 
             WHERE approval = true AND id != ? AND onboarding_complete = true
             ORDER BY RAND()
             LIMIT 20`,
            [req.user.userId]
        );

        // Parse JSON fields for each user
        const candidates = users.map(user => {
            // Calculate age from dob
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
                dob: user.dob,
                currentLocation: user.current_location,
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
        });

        res.json({ candidates });

    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
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

        // Get all mutual matches using the view or direct query
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
             ORDER BY a2.created_at DESC`,
            [userId]
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

module.exports = router;