const pool = require('../config/db');

/**
 * Profile Level Management Service
 * Handles progressive profile visibility based on chat interaction
 * 
 * Level System:
 * - Level 1: Default on match (basic info)
 * - Level 2: Unlocks at 5 messages (preferences + lifestyle) - requires both users to complete
 * - Level 3: Unlocks at 10 messages (deep + personal) - requires explicit consent
 */

class ProfileLevelService {
    /**
     * Level thresholds for message count
     */
    static THRESHOLDS = {
        LEVEL_2: 5,
        LEVEL_3: 10
    };

    /**
     * Profile fields grouped by level (using camelCase field names as returned by API)
     */
    static FIELD_GROUPS = {
        LEVEL_1: [
            'gender', 'dob', 'age', 'currentLocation', 'location', 'fromLocation', 'name',
            'interests', 'intent', 'relationshipStatus', 'profilePicUrl', 'firstName', 'lastName'
        ],
        LEVEL_2: [
            'pets', 'drinking', 'smoking', 'height', 
            'foodPreference', 'religiousLevel'
        ],
        LEVEL_3: [
            'kidsPreference', 'facePhotos', 
            'favouriteTravelDestination', 'lastHolidayPlaces',
            'favouritePlacesToGo', 'instagram', 'linkedin'
        ]
    };

    /**
     * Get visibility level between two users in a conversation
     * @param {number} conversationId 
     * @param {number} viewerId - User viewing the profile
     * @param {number} profileOwnerId - User whose profile is being viewed
     * @returns {Promise<{level: number, canUpgrade: boolean, nextLevelAt: number|null}>}
     */
    static async getVisibilityLevel(conversationId, viewerId, profileOwnerId) {
        const [rows] = await pool.execute(
            `SELECT 
                current_level,
                message_count,
                CASE WHEN user_id_1 = ? THEN level2_user1_consent ELSE level2_user2_consent END as viewer_level2_consent,
                CASE WHEN user_id_1 = ? THEN level2_user2_consent ELSE level2_user1_consent END as owner_level2_consent,
                CASE WHEN user_id_1 = ? THEN level3_user1_consent ELSE level3_user2_consent END as viewer_level3_consent,
                CASE WHEN user_id_1 = ? THEN level3_user2_consent ELSE level3_user1_consent END as owner_level3_consent
            FROM conversations
            WHERE id = ?`,
            [viewerId, profileOwnerId, viewerId, profileOwnerId, conversationId]
        );

        if (rows.length === 0) {
            return { level: 1, canUpgrade: false, nextLevelAt: null };
        }

        const conv = rows[0];
        const messageCount = conv.message_count;

        console.log(`[Visibility] Conv ${conversationId}: messages=${messageCount}, viewer_level2_consent=${conv.viewer_level2_consent}, owner_level2_consent=${conv.owner_level2_consent}`);

        // Determine actual visibility level
        let visibleLevel = 1;

        // ✅ Level 2: Both users must have CONSENTED + 5 messages (not just completed)
        if (messageCount >= this.THRESHOLDS.LEVEL_2 && 
            conv.viewer_level2_consent && 
            conv.owner_level2_consent) {
            visibleLevel = 2;
        }

        // ✅ Level 3: Both users must consent + 10 messages
        if (messageCount >= this.THRESHOLDS.LEVEL_3 && 
            conv.viewer_level3_consent && 
            conv.owner_level3_consent) {
            visibleLevel = 3;
        }

        // Calculate next upgrade info
        let canUpgrade = false;
        let nextLevelAt = null;

        if (visibleLevel === 1 && messageCount >= this.THRESHOLDS.LEVEL_2) {
            canUpgrade = true;
        } else if (visibleLevel === 2 && messageCount >= this.THRESHOLDS.LEVEL_3) {
            canUpgrade = true;
        } else if (visibleLevel === 1) {
            nextLevelAt = this.THRESHOLDS.LEVEL_2 - messageCount;
        } else if (visibleLevel === 2) {
            nextLevelAt = this.THRESHOLDS.LEVEL_3 - messageCount;
        }

        return {
            level: visibleLevel,
            canUpgrade,
            nextLevelAt,
            messageCount,
            level2Ready: conv.viewer_level2_done && conv.owner_level2_done,
            level3Ready: conv.viewer_level3_consent && conv.owner_level3_consent
        };
    }

    /**
     * Increment message count and check for level upgrades
     * @param {number} conversationId 
     * @returns {Promise<{newLevel: number|null, shouldNotify: boolean, threshold: string|null}>}
     */
    static async incrementMessageCount(conversationId) {
        // Increment counter
        await pool.execute(
            'UPDATE conversations SET message_count = message_count + 1 WHERE id = ?',
            [conversationId]
        );

        // Get updated count
        const [rows] = await pool.execute(
            'SELECT message_count, current_level FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (rows.length === 0) {
            return { newLevel: null, shouldNotify: false, threshold: null };
        }

        const { message_count, current_level } = rows[0];

        // Check if we've reached a threshold
        let shouldNotify = false;
        let threshold = null;

        if (message_count === this.THRESHOLDS.LEVEL_2) {
            shouldNotify = true;
            threshold = 'LEVEL_2';
        } else if (message_count === this.THRESHOLDS.LEVEL_3) {
            shouldNotify = true;
            threshold = 'LEVEL_3';
        }

        return {
            newLevel: current_level,
            shouldNotify,
            threshold,
            messageCount: message_count
        };
    }

    /**
     * Mark user as having completed Level 2 questions
     * @param {number} userId 
     */
    static async completeLevel2Questions(userId) {
        await pool.execute(
            'UPDATE users SET level2_questions_completed = TRUE, level2_completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
    }

    /**
     * Mark Level 2 as completed for a user in a specific conversation
     * @param {number} conversationId 
     * @param {number} userId 
     */
    static async markLevel2Completed(conversationId, userId) {
        const [conv] = await pool.execute(
            'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (conv.length === 0) return;

        const isUser1 = conv[0].user_id_1 === userId;
        const column = isUser1 ? 'level2_user1_completed' : 'level2_user2_completed';

        await pool.execute(
            `UPDATE conversations SET ${column} = TRUE WHERE id = ?`,
            [conversationId]
        );

        // Also mark in users table
        await this.completeLevel2Questions(userId);

        // Check if both users have completed
        const [updated] = await pool.execute(
            'SELECT level2_user1_completed, level2_user2_completed FROM conversations WHERE id = ?',
            [conversationId]
        );

        const bothCompleted = updated[0].level2_user1_completed && updated[0].level2_user2_completed;

        if (bothCompleted) {
            await pool.execute(
                'UPDATE conversations SET level2_unlocked_at = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
        }

        return bothCompleted;
    }

    /**
     * Set Level 2 visibility consent for a user (NEW)
     * @param {number} conversationId 
     * @param {number} userId 
     * @param {boolean} consent 
     */
    static async setLevel2Consent(conversationId, userId, consent = true) {
        const [conv] = await pool.execute(
            'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (conv.length === 0) return false;

        const isUser1 = conv[0].user_id_1 === userId;
        const column = isUser1 ? 'level2_user1_consent' : 'level2_user2_consent';

        await pool.execute(
            `UPDATE conversations SET ${column} = ? WHERE id = ?`,
            [consent, conversationId]
        );

        // Check if both users have consented
        const [updated] = await pool.execute(
            'SELECT level2_user1_consent, level2_user2_consent FROM conversations WHERE id = ?',
            [conversationId]
        );

        const bothConsented = updated[0].level2_user1_consent && updated[0].level2_user2_consent;

        if (bothConsented) {
            await pool.execute(
                'UPDATE conversations SET level2_unlocked_at = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
        }

        return bothConsented;
    }

    /**
     * Set Level 3 visibility consent for a user
     * @param {number} conversationId 
     * @param {number} userId 
     * @param {boolean} consent 
     */
    static async setLevel3Consent(conversationId, userId, consent = true) {
        const [conv] = await pool.execute(
            'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
            [conversationId]
        );

        if (conv.length === 0) return false;

        const isUser1 = conv[0].user_id_1 === userId;
        const column = isUser1 ? 'level3_user1_consent' : 'level3_user2_consent';

        await pool.execute(
            `UPDATE conversations SET ${column} = ? WHERE id = ?`,
            [consent, conversationId]
        );

        // Check if both users have consented
        const [updated] = await pool.execute(
            'SELECT level3_user1_consent, level3_user2_consent FROM conversations WHERE id = ?',
            [conversationId]
        );

        const bothConsented = updated[0].level3_user1_consent && updated[0].level3_user2_consent;

        if (bothConsented) {
            await pool.execute(
                'UPDATE conversations SET level3_unlocked_at = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
        }

        return bothConsented;
    }

    /**
     * Filter profile data based on visibility level
     * @param {object} profile - Full profile object
     * @param {number} level - Visibility level (1-3)
     * @returns {object} Filtered profile
     */
    static filterProfileByLevel(profile, level) {
        const filtered = { ...profile };

        // Always include basic identification
        const alwaysInclude = ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt', 'visibilityLevel', 'canUpgrade', 'nextLevelAt'];

        // Get allowed fields for this level
        let allowedFields = [...alwaysInclude, ...this.FIELD_GROUPS.LEVEL_1];
        
        if (level >= 2) {
            allowedFields = [...allowedFields, ...this.FIELD_GROUPS.LEVEL_2];
        }
        
        if (level >= 3) {
            allowedFields = [...allowedFields, ...this.FIELD_GROUPS.LEVEL_3];
        }

        // Set restricted fields to null instead of deleting them
        // This ensures the frontend can show "Not specified" placeholders
        Object.keys(filtered).forEach(key => {
            if (!allowedFields.includes(key) && !alwaysInclude.includes(key)) {
                filtered[key] = null;
            }
        });

        // Special handling for intent object (contains profile questions)
        if (filtered.intent && typeof filtered.intent === 'object') {
            const intent = filtered.intent;
            
            // Level 1: Keep bio, watchList, tvShows, movies, artistsBands, lifestyleImageUrls + work info (jobTitle, companyName)
            // Level 2: Add more profileQuestions (education, languages, lifestyle)
            // Level 3: Show all intent data
            
            if (level < 2) {
                // Keep only Level 1 intent data
                const level1Intent = {};
                if (intent.bio) level1Intent.bio = intent.bio;
                if (intent.watchList) level1Intent.watchList = intent.watchList;
                if (intent.tvShows) level1Intent.tvShows = intent.tvShows;
                if (intent.movies) level1Intent.movies = intent.movies;
                if (intent.artistsBands) level1Intent.artistsBands = intent.artistsBands;
                if (intent.lifestyleImageUrls) level1Intent.lifestyleImageUrls = intent.lifestyleImageUrls;
                
                // Add work information to Level 1
                if (intent.profileQuestions) {
                    level1Intent.profileQuestions = {};
                    const pq = intent.profileQuestions;
                    if (pq.jobTitle) level1Intent.profileQuestions.jobTitle = pq.jobTitle;
                    if (pq.companyName) level1Intent.profileQuestions.companyName = pq.companyName;
                }
                
                filtered.intent = level1Intent;
            } else if (level === 2) {
                // Keep Level 1 data + Add Level 2 profile questions
                const level2Intent = {};
                if (intent.bio) level2Intent.bio = intent.bio;
                if (intent.watchList) level2Intent.watchList = intent.watchList;
                if (intent.tvShows) level2Intent.tvShows = intent.tvShows;
                if (intent.movies) level2Intent.movies = intent.movies;
                if (intent.artistsBands) level2Intent.artistsBands = intent.artistsBands;
                if (intent.lifestyleImageUrls) level2Intent.lifestyleImageUrls = intent.lifestyleImageUrls;
                
                if (intent.profileQuestions) {
                    level2Intent.profileQuestions = {};
                    const pq = intent.profileQuestions;
                    // Work info (from Level 1)
                    if (pq.jobTitle) level2Intent.profileQuestions.jobTitle = pq.jobTitle;
                    if (pq.companyName) level2Intent.profileQuestions.companyName = pq.companyName;
                    // Additional Level 2 fields
                    if (pq.education) level2Intent.profileQuestions.education = pq.education;
                    if (pq.educationDetail) level2Intent.profileQuestions.educationDetail = pq.educationDetail;
                    if (pq.languages) level2Intent.profileQuestions.languages = pq.languages;
                    if (pq.canCode !== undefined) level2Intent.profileQuestions.canCode = pq.canCode;
                    if (pq.codingLanguages) level2Intent.profileQuestions.codingLanguages = pq.codingLanguages;
                    if (pq.sleepSchedule) level2Intent.profileQuestions.sleepSchedule = pq.sleepSchedule;
                    if (pq.dateBill) level2Intent.profileQuestions.dateBill = pq.dateBill;
                }
                
                filtered.intent = level2Intent;
            }
            // Level 3: Keep everything (already included)
        }

        return filtered;
    }

    /**
     * Get conversation level status for frontend
     * @param {number} conversationId 
     * @param {number} userId 
     */
    static async getConversationLevelStatus(conversationId, userId) {
        const [rows] = await pool.execute(
            `SELECT 
                c.message_count,
                c.current_level,
                c.user_id_1,
                c.user_id_2,
                CASE WHEN c.user_id_1 = ? THEN c.level2_user1_consent ELSE c.level2_user2_consent END as user_level2_consent,
                CASE WHEN c.user_id_1 = ? THEN c.level2_user2_consent ELSE c.level2_user1_consent END as partner_level2_consent,
                CASE WHEN c.user_id_1 = ? THEN c.level3_user1_consent ELSE c.level3_user2_consent END as user_level3_consent,
                CASE WHEN c.user_id_1 = ? THEN c.level3_user2_consent ELSE c.level3_user1_consent END as partner_level3_consent,
                u_self.level2_questions_completed as user_level2_completed_global,
                u_self.level3_questions_completed as user_level3_completed_global,
                u_partner.level2_questions_completed as partner_level2_completed_global,
                u_partner.level3_questions_completed as partner_level3_completed_global,
                u_partner.first_name as partner_name
            FROM conversations c
            JOIN users u_self ON u_self.id = ?
            JOIN users u_partner ON u_partner.id = CASE WHEN c.user_id_1 = ? THEN c.user_id_2 ELSE c.user_id_1 END
            WHERE c.id = ?`,
            [userId, userId, userId, userId, userId, userId, conversationId]
        );

        if (rows.length === 0) {
            return null;
        }

        const data = rows[0];
        const msgCount = data.message_count;
        
        // ✅ CRITICAL: Check GLOBAL user completion, not match-specific
        const userLevel2CompletedGlobal = Boolean(data.user_level2_completed_global);
        const userLevel3CompletedGlobal = Boolean(data.user_level3_completed_global);
        const partnerLevel2CompletedGlobal = Boolean(data.partner_level2_completed_global);
        const partnerLevel3CompletedGlobal = Boolean(data.partner_level3_completed_global);
        
        const userLevel2Consent = Boolean(data.user_level2_consent);
        const partnerLevel2Consent = Boolean(data.partner_level2_consent);
        const userLevel3Consent = Boolean(data.user_level3_consent);
        const partnerLevel3Consent = Boolean(data.partner_level3_consent);

        // ✅ CRITICAL: Determine explicit actions for each level
        // Level 2 Action Logic
        let level2Action = 'NO_ACTION';
        if (!userLevel2CompletedGlobal) {
            // User has NEVER filled Level 2 questions → redirect to fill
            level2Action = 'FILL_INFORMATION';
        } else if (userLevel2CompletedGlobal && !userLevel2Consent) {
            // User HAS filled Level 2 questions but NOT consented for THIS match → ask consent
            level2Action = 'ASK_CONSENT';
        }
        // else: user completed AND consented → NO_ACTION
        
        // Level 3 Action Logic
        let level3Action = 'NO_ACTION';
        if (!userLevel3CompletedGlobal) {
            // User has NEVER filled Level 3 questions → redirect to fill
            level3Action = 'FILL_INFORMATION';
        } else if (userLevel3CompletedGlobal && !userLevel3Consent) {
            // User HAS filled Level 3 questions but NOT consented for THIS match → ask consent
            level3Action = 'ASK_CONSENT';
        }
        // else: user completed AND consented → NO_ACTION

        return {
            messageCount: msgCount,
            currentLevel: data.current_level,
            
            // Level 2 status
            level2ThresholdReached: msgCount >= this.THRESHOLDS.LEVEL_2,
            level2Action: level2Action, // ✅ EXPLICIT ACTION: FILL_INFORMATION | ASK_CONSENT | NO_ACTION
            level2UserCompletedGlobal: userLevel2CompletedGlobal,
            level2PartnerCompletedGlobal: partnerLevel2CompletedGlobal,
            level2UserConsent: userLevel2Consent,
            level2PartnerConsent: partnerLevel2Consent,
            level2Visible: msgCount >= this.THRESHOLDS.LEVEL_2 && userLevel2Consent && partnerLevel2Consent,
            
            // Level 3 status
            level3ThresholdReached: msgCount >= this.THRESHOLDS.LEVEL_3,
            level3Action: level3Action, // ✅ EXPLICIT ACTION: FILL_INFORMATION | ASK_CONSENT | NO_ACTION
            level3UserCompletedGlobal: userLevel3CompletedGlobal,
            level3PartnerCompletedGlobal: partnerLevel3CompletedGlobal,
            level3UserConsent: userLevel3Consent,
            level3PartnerConsent: partnerLevel3Consent,
            level3Visible: msgCount >= this.THRESHOLDS.LEVEL_3 && userLevel3Consent && partnerLevel3Consent,
            
            partnerName: data.partner_name
        };
    }

    /**
     * Check if this is user's first match (for first-time redirect to profile questions)
     * @param {number} userId 
     * @returns {Promise<boolean>}
     */
    static async isFirstMatch(userId) {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as matchCount
             FROM user_actions a1
             JOIN user_actions a2 ON a1.user_id = a2.target_user_id AND a1.target_user_id = a2.user_id
             WHERE a1.user_id = ? AND a1.action_type = 'like' AND a2.action_type = 'like'`,
            [userId]
        );

        return rows[0].matchCount === 1;
    }
}

module.exports = ProfileLevelService;
