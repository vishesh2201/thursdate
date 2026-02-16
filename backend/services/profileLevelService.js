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
            'foodPreference'
        ],
        LEVEL_3: [
            'kidsPreference', 'facePhotos', 
            'favouriteTravelDestination', 'lastHolidayPlaces',
            'favouritePlacesToGo', 'instagram', 'linkedin',
            'religiousLevel', 'religion', 'relationshipValues'
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
                c.current_level,
                c.message_count,
                c.user_id_1,
                c.user_id_2,
                c.level2_user1_consent,
                c.level2_user2_consent,
                c.level3_user1_consent,
                c.level3_user2_consent,
                viewer.level2_questions_completed as viewer_level2_completed,
                viewer.level3_questions_completed as viewer_level3_completed,
                owner.level2_questions_completed as owner_level2_completed,
                owner.level3_questions_completed as owner_level3_completed
            FROM conversations c
            JOIN users viewer ON viewer.id = ?
            JOIN users owner ON owner.id = ?
            WHERE c.id = ?`,
            [viewerId, profileOwnerId, conversationId]
        );

        if (rows.length === 0) {
            return { level: 1, canUpgrade: false, nextLevelAt: null };
        }

        const conv = rows[0];
        const messageCount = conv.message_count;

        // ✅ FIX: Correctly map viewer and owner to their actual positions in conversation
        const viewerIsUser1 = conv.user_id_1 === viewerId;
        const ownerIsUser1 = conv.user_id_1 === profileOwnerId;
        
        const viewer_level2_consent = viewerIsUser1 ? conv.level2_user1_consent : conv.level2_user2_consent;
        const owner_level2_consent = ownerIsUser1 ? conv.level2_user1_consent : conv.level2_user2_consent;
        const viewer_level3_consent = viewerIsUser1 ? conv.level3_user1_consent : conv.level3_user2_consent;
        const owner_level3_consent = ownerIsUser1 ? conv.level3_user1_consent : conv.level3_user2_consent;

        console.log(`[Visibility] Conv ${conversationId}: messages=${messageCount}`);
        console.log(`[Visibility] Viewer=${viewerId} (isUser1=${viewerIsUser1}), Owner=${profileOwnerId} (isUser1=${ownerIsUser1})`);
        console.log(`[Visibility] Level 2 - viewer_consent=${viewer_level2_consent}, owner_consent=${owner_level2_consent}, viewer_completed=${conv.viewer_level2_completed}, owner_completed=${conv.owner_level2_completed}`);
        console.log(`[Visibility] Level 3 - viewer_consent=${viewer_level3_consent}, owner_consent=${owner_level3_consent}, viewer_completed=${conv.viewer_level3_completed}, owner_completed=${conv.owner_level3_completed}`);

        // Determine actual visibility level
        let visibleLevel = 1;

        // ✅ CRITICAL: Level 2 visibility requires BOTH users to have COMPLETED questions AND CONSENTED
        if (messageCount >= this.THRESHOLDS.LEVEL_2 && 
            viewer_level2_consent && 
            owner_level2_consent &&
            conv.viewer_level2_completed &&
            conv.owner_level2_completed) {
            visibleLevel = 2;
            console.log('[Visibility] ✅ Level 2 visibility GRANTED');
        }

        // ✅ CRITICAL: Level 3 visibility requires BOTH users to have COMPLETED questions AND CONSENTED
        if (messageCount >= this.THRESHOLDS.LEVEL_3 && 
            viewer_level3_consent && 
            owner_level3_consent &&
            conv.viewer_level3_completed &&
            conv.owner_level3_completed) {
            visibleLevel = 3;
            console.log('[Visibility] ✅ Level 3 visibility GRANTED');
        }
        
        console.log(`[Visibility] Final visible level: ${visibleLevel}`);

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

        // ✅ PERSONAL TAB UNLOCK: Only unlocked when Level 3 FULLY unlocked (both consented AND completed)
        const personalTabUnlocked = !!(messageCount >= this.THRESHOLDS.LEVEL_3 && 
                                       viewer_level3_consent && 
                                       owner_level3_consent &&
                                       conv.viewer_level3_completed &&
                                       conv.owner_level3_completed);

        return {
            level: visibleLevel,
            canUpgrade,
            nextLevelAt,
            messageCount,
            level2Ready: conv.viewer_level2_done && conv.owner_level2_done,
            level3Ready: conv.viewer_level3_consent && conv.owner_level3_consent,
            personalTabUnlocked  // ✅ NEW: Flag for Personal tab lock/unlock state
        };
    }

    /**
     * Increment message count and check for level upgrades
     * ✅ CRITICAL FIX: Requires BOTH users to participate in conversation
     * - Tracks per-user message counts (user1_message_count, user2_message_count)
     * - Level 2 triggers at TOTAL message count >= 5 AND both users sent >= 1 message
     * - Level 3 triggers at TOTAL message count >= 10 AND both users sent >= 1 message (gated by Level 2 consent)
     * - Prevents spam-based level unlocks (one user sending 5+ messages alone)
     * @param {number} conversationId 
     * @param {number} senderId - ID of the user sending the message
     * @returns {Promise<{newLevel: number|null, shouldNotify: boolean, threshold: string|null}>}
     */
    static async incrementMessageCount(conversationId, senderId) {
        // Get conversation and match_levels data
        const [convCheck] = await pool.execute(
            'SELECT user_id_1, user_id_2, message_count FROM conversations WHERE id = ?',
            [conversationId]
        );
        
        if (convCheck.length === 0) {
            return { newLevel: null, shouldNotify: false, threshold: null, messageCount: 0 };
        }
        
        const { user_id_1, user_id_2, message_count } = convCheck[0];
        const [userId1, userId2] = user_id_1 < user_id_2 ? [user_id_1, user_id_2] : [user_id_2, user_id_1];
        
        // Ensure match_levels record exists
        const [matchLevels] = await pool.execute(
            'SELECT id, user1_message_count, user2_message_count FROM match_levels WHERE conversation_id = ?',
            [conversationId]
        );
        
        if (matchLevels.length === 0) {
            await pool.execute(
                `INSERT INTO match_levels 
                 (conversation_id, user_id_1, user_id_2, current_level, user1_message_count, user2_message_count) 
                 VALUES (?, ?, ?, 1, 0, 0)`,
                [conversationId, userId1, userId2]
            );
            console.log(`[MatchLevels] Initialized for conversation ${conversationId}`);
        }
        
        // Get current per-user counts
        const [mlData] = await pool.execute(
            `SELECT 
                current_level,
                user1_message_count,
                user2_message_count,
                level2_user1_consent_state,
                level2_user2_consent_state,
                user_id_1
             FROM match_levels
             WHERE conversation_id = ?`,
            [conversationId]
        );
        
        if (mlData.length === 0) {
            return { newLevel: null, shouldNotify: false, threshold: null, messageCount: message_count + 1 };
        }
        
        const ml = mlData[0];
        const currentLevel = ml.current_level;
        const level2BothAccepted = ml.level2_user1_consent_state === 'ACCEPTED' && 
                                    ml.level2_user2_consent_state === 'ACCEPTED';
        
        // Determine which user is sending (user1 or user2 in match_levels)
        const senderIsUser1 = ml.user_id_1 === senderId;
        const user1Count = ml.user1_message_count + (senderIsUser1 ? 1 : 0);
        const user2Count = ml.user2_message_count + (senderIsUser1 ? 0 : 1);
        
        // ✅ CRITICAL: Check if BOTH users have participated
        const bothUsersParticipated = user1Count >= 1 && user2Count >= 1;
        
        console.log(`[MessageCount] Conv ${conversationId}: Sender=${senderId} (isUser1=${senderIsUser1})`);
        console.log(`[MessageCount] Per-user counts: User1=${user1Count}, User2=${user2Count}, BothParticipated=${bothUsersParticipated}`);
        
        // ✅ INCREMENT: Update both total count and per-user count
        const newMessageCount = message_count + 1;
        await pool.execute(
            'UPDATE conversations SET message_count = ? WHERE id = ?',
            [newMessageCount, conversationId]
        );
        
        // Update per-user message count
        const userCountField = senderIsUser1 ? 'user1_message_count' : 'user2_message_count';
        const newUserCount = senderIsUser1 ? user1Count : user2Count;
        await pool.execute(
            `UPDATE match_levels SET ${userCountField} = ? WHERE conversation_id = ?`,
            [newUserCount, conversationId]
        );
        
        let shouldNotify = false;
        let threshold = null;
        
        console.log(`[MessageCount] Total: ${message_count} → ${newMessageCount}`);
        
        // ✅ Level 2 triggers at TOTAL >= 5 AND BOTH users participated
        if (currentLevel === 1 && newMessageCount >= this.THRESHOLDS.LEVEL_2 && bothUsersParticipated) {
            shouldNotify = true;
            threshold = 'LEVEL_2';
            await this.setPopupPending(conversationId, user_id_1, user_id_2, 2);
            console.log(`[Level2] ✅ Threshold reached: total=${newMessageCount}, user1=${user1Count}, user2=${user2Count}`);
        } else if (currentLevel === 1 && newMessageCount >= this.THRESHOLDS.LEVEL_2 && !bothUsersParticipated) {
            console.log(`[Level2] ⚠️  BLOCKED: total=${newMessageCount} BUT only one user talking (user1=${user1Count}, user2=${user2Count})`);
        }
        
        // ✅ Level 3 triggers at TOTAL >= 10 AND BOTH users participated (ONLY if Level 2 consent accepted)
        if (currentLevel >= 2 && newMessageCount >= this.THRESHOLDS.LEVEL_3 && bothUsersParticipated) {
            if (level2BothAccepted) {
                shouldNotify = true;
                threshold = 'LEVEL_3';
                await this.setPopupPending(conversationId, user_id_1, user_id_2, 3);
                console.log(`[Level3] ✅ Threshold reached: total=${newMessageCount}, user1=${user1Count}, user2=${user2Count}`);
            } else {
                console.log(`[Level3] ⚠️  BLOCKED: Threshold reached but Level 2 consent not accepted by both`);
            }
        } else if (currentLevel >= 2 && newMessageCount >= this.THRESHOLDS.LEVEL_3 && !bothUsersParticipated) {
            console.log(`[Level3] ⚠️  BLOCKED: total=${newMessageCount} BUT only one user talking (user1=${user1Count}, user2=${user2Count})`);
        }
        
        return {
            newLevel: currentLevel,
            shouldNotify,
            threshold,
            messageCount: newMessageCount,
            user1MessageCount: user1Count,
            user2MessageCount: user2Count,
            bothUsersParticipated
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
     * Set popup_pending flags when threshold is reached
     * Initializes match_levels table if needed
     * @param {number} conversationId 
     * @param {number} user1Id 
     * @param {number} user2Id 
     * @param {number} level (2 or 3)
     */
    static async setPopupPending(conversationId, user1Id, user2Id, level) {
        try {
            // Normalize user IDs (ensure user_id_1 < user_id_2)
            const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
            
            // Check if match_levels record exists
            const [existing] = await pool.execute(
                'SELECT id FROM match_levels WHERE conversation_id = ?',
                [conversationId]
            );
            
            if (existing.length === 0) {
                // Create match_levels record
                await pool.execute(
                    `INSERT INTO match_levels 
                     (conversation_id, user_id_1, user_id_2, current_level) 
                     VALUES (?, ?, ?, 1)`,
                    [conversationId, userId1, userId2]
                );
                console.log(`[MatchLevels] Initialized for conversation ${conversationId}`);
            }
            
            // Set popup_pending flags for both users
            const popupField1 = level === 2 ? 'level2_popup_pending_user1' : 'level3_popup_pending_user1';
            const popupField2 = level === 2 ? 'level2_popup_pending_user2' : 'level3_popup_pending_user2';
            
            await pool.execute(
                `UPDATE match_levels 
                 SET ${popupField1} = TRUE, ${popupField2} = TRUE 
                 WHERE conversation_id = ?`,
                [conversationId]
            );
            
            console.log(`[Level ${level}] Set popup_pending for both users in conversation ${conversationId}`);
        } catch (error) {
            console.error(`[Level ${level}] Error setting popup_pending:`, error);
        }
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

        // ✅ CHANGED: Do NOT clear popup_pending when user completes questions
        // The popup will remain visible but change from "Fill info" to "Yes/No" consent
        // It will only be cleared when user gives consent (or says No)
        console.log(`[Level2Complete] User ${userId} completed Level 2 questions for conversation ${conversationId}`);
        console.log(`[Level2Complete] Popup will remain visible to ask for consent`);

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
     * ✅ FIXED: "NO" now sets DECLINED_TEMPORARY, popup stays pending for reminder banner
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

        // ✅ CRITICAL FIX: Update consent state and only clear popup on YES
        const [matchLevels] = await pool.execute(
            'SELECT user_id_1 FROM match_levels WHERE conversation_id = ?',
            [conversationId]
        );
        
        if (matchLevels.length > 0) {
            const isUser1InML = matchLevels[0].user_id_1 === userId;
            const popupField = isUser1InML ? 'level2_popup_pending_user1' : 'level2_popup_pending_user2';
            const consentStateField = isUser1InML ? 'level2_user1_consent_state' : 'level2_user2_consent_state';
            const shareField = isUser1InML ? 'level2_shared_by_user1' : 'level2_shared_by_user2';
            
            // ✅ YES = ACCEPTED + clear popup, NO = DECLINED_TEMPORARY + keep popup pending
            const consentState = consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY';
            const clearPopup = consent === true;
            
            await pool.execute(
                `UPDATE match_levels 
                 SET ${consentStateField} = ?, 
                     ${shareField} = ?, 
                     ${popupField} = ? 
                 WHERE conversation_id = ?`,
                [consentState, consent, !clearPopup, conversationId]
            );
            
            console.log(`[Level2Consent] User ${userId} ${consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY'} for conversation ${conversationId}`);
            console.log(`[Level2Consent] ${popupField} = ${!clearPopup} (${clearPopup ? 'cleared' : 'kept for reminder banner'})`);
        }

        // Check if both users have consented
        const [updated] = await pool.execute(
            'SELECT level2_user1_consent, level2_user2_consent FROM conversations WHERE id = ?',
            [conversationId]
        );

        const bothConsented = updated[0].level2_user1_consent && updated[0].level2_user2_consent;

        // ✅ CRITICAL: When BOTH users accept Level 2, check if Level 3 threshold already met
        if (bothConsented && consent) {
            // Update current_level to 2
            await pool.execute(
                `UPDATE match_levels SET current_level = 2 WHERE conversation_id = ?`,
                [conversationId]
            );
            
            // Check if Level 3 threshold already crossed while waiting for consent
            const [msgCheck] = await pool.execute(
                'SELECT message_count FROM conversations WHERE id = ?',
                [conversationId]
            );
            
            const totalMessages = msgCheck[0]?.message_count || 0;
            console.log(`[Level2Consent] ✅ BOTH users accepted! Total messages: ${totalMessages}`);
            
            // Edge case: If already >= 10 messages, trigger Level 3 immediately
            if (totalMessages >= this.THRESHOLDS.LEVEL_3) {
                const [conv] = await pool.execute(
                    'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
                    [conversationId]
                );
                await this.setPopupPending(conversationId, conv[0].user_id_1, conv[0].user_id_2, 3);
                console.log(`[Level2Consent] ⚡ Level 3 threshold already met! Triggering immediately.`);
            }
        }

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
     * ✅ FIXED: "NO" now sets DECLINED_TEMPORARY, popup stays pending for reminder banner
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

        // ✅ CRITICAL FIX: Update consent state and only clear popup on YES
        const [matchLevels] = await pool.execute(
            'SELECT user_id_1 FROM match_levels WHERE conversation_id = ?',
            [conversationId]
        );
        
        if (matchLevels.length > 0) {
            const isUser1InML = matchLevels[0].user_id_1 === userId;
            const popupField = isUser1InML ? 'level3_popup_pending_user1' : 'level3_popup_pending_user2';
            const consentStateField = isUser1InML ? 'level3_user1_consent_state' : 'level3_user2_consent_state';
            const shareField = isUser1InML ? 'level3_shared_by_user1' : 'level3_shared_by_user2';
            
            // ✅ YES = ACCEPTED + clear popup, NO = DECLINED_TEMPORARY + keep popup pending
            const consentState = consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY';
            const clearPopup = consent === true;
            
            await pool.execute(
                `UPDATE match_levels 
                 SET ${consentStateField} = ?, 
                     ${shareField} = ?, 
                     ${popupField} = ? 
                 WHERE conversation_id = ?`,
                [consentState, consent, !clearPopup, conversationId]
            );
            
            console.log(`[Level3Consent] User ${userId} ${consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY'} for conversation ${conversationId}`);
            console.log(`[Level3Consent] ${popupField} = ${!clearPopup} (${clearPopup ? 'cleared' : 'kept for reminder banner'})`);
        }

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
                u_partner.first_name as partner_name,
                ml.user_id_1 as ml_user_id_1,
                ml.level2_popup_pending_user1,
                ml.level2_popup_pending_user2,
                ml.level3_popup_pending_user1,
                ml.level3_popup_pending_user2,
                ml.level2_user1_consent_state,
                ml.level2_user2_consent_state,
                ml.level3_user1_consent_state,
                ml.level3_user2_consent_state
            FROM conversations c
            JOIN users u_self ON u_self.id = ?
            JOIN users u_partner ON u_partner.id = CASE WHEN c.user_id_1 = ? THEN c.user_id_2 ELSE c.user_id_1 END
            LEFT JOIN match_levels ml ON ml.conversation_id = c.id
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

        // ✅ Get popup pending status from match_levels table
        const isUser1InMatchLevels = data.ml_user_id_1 === userId;
        const level2PopupPending = data.ml_user_id_1 
            ? Boolean(isUser1InMatchLevels ? data.level2_popup_pending_user1 : data.level2_popup_pending_user2)
            : false;
        const level3PopupPending = data.ml_user_id_1
            ? Boolean(isUser1InMatchLevels ? data.level3_popup_pending_user1 : data.level3_popup_pending_user2)
            : false;

        // ✅ NEW: Get consent state for reminder banner logic
        const level2ConsentState = data.ml_user_id_1
            ? (isUser1InMatchLevels ? data.level2_user1_consent_state : data.level2_user2_consent_state)
            : 'PENDING';
        const level3ConsentState = data.ml_user_id_1
            ? (isUser1InMatchLevels ? data.level3_user1_consent_state : data.level3_user2_consent_state)
            : 'PENDING';

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
            level2PopupPending: level2PopupPending, // ✅ CRITICAL: Backend drives popup visibility
            level2ConsentState: level2ConsentState, // ✅ NEW: For reminder banner (PENDING | ACCEPTED | DECLINED_TEMPORARY)
            
            // Level 3 status
            level3ThresholdReached: msgCount >= this.THRESHOLDS.LEVEL_3,
            level3Action: level3Action, // ✅ EXPLICIT ACTION: FILL_INFORMATION | ASK_CONSENT | NO_ACTION
            level3UserCompletedGlobal: userLevel3CompletedGlobal,
            level3PartnerCompletedGlobal: partnerLevel3CompletedGlobal,
            level3UserConsent: userLevel3Consent,
            level3PartnerConsent: partnerLevel3Consent,
            level3Visible: msgCount >= this.THRESHOLDS.LEVEL_3 && userLevel3Consent && partnerLevel3Consent,
            level3PopupPending: level3PopupPending, // ✅ CRITICAL: Backend drives popup visibility
            level3ConsentState: level3ConsentState, // ✅ NEW: For reminder banner (PENDING | ACCEPTED | DECLINED_TEMPORARY)
            
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
