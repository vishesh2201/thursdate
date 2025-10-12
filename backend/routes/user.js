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
            'SELECT id, email, first_name, last_name, gender, dob, current_location, favourite_travel_destination, last_holiday_places, favourite_places_to_go, profile_pic_url, approval, intent, onboarding_complete FROM users WHERE id = ?',
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
        
        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl, intent, onboardingComplete,
            isPrivate // This is read, but won't be used in the SQL/updateData
        } = req.body;
        
        let finalIntent = { ...currentIntent, ...intent };
        const intentJson = JSON.stringify(finalIntent); 
        
        // CRITICAL: Determine the final approval status. 
        let finalApprovalStatus = currentUser.approval;
        if (onboardingComplete === true) {
            finalApprovalStatus = false; 
        }

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
            finalApprovalStatus, // The final item before userId
            req.user.userId
        ];
        
        await pool.execute(
            // 🛑 is_private REMOVED from UPDATE query
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, intent = ?, onboarding_complete = ?,
                approval = ?  
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

module.exports = router;