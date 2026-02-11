const pool = require('../config/db');

/**
 * Match Levels Service
 * Manages multi-level profile progression and consent per match
 */

/**
 * Initialize match level tracking for a new conversation
 */
const initializeMatchLevel = async (conversationId, user1Id, user2Id) => {
  try {
    // Normalize user IDs (ensure user1_id < user2_id)
    const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    // Check if already exists
    const [existing] = await pool.execute(
      'SELECT id FROM match_levels WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (existing.length > 0) {
      return existing[0].id;
    }
    
    // Create new match level record
    const [result] = await pool.execute(
      `INSERT INTO match_levels 
       (conversation_id, user_id_1, user_id_2, current_level, total_messages, user1_message_count, user2_message_count) 
       VALUES (?, ?, ?, 1, 0, 0, 0)`,
      [conversationId, userId1, userId2]
    );
    
    console.log(`[MatchLevels] Initialized for conversation ${conversationId}`);
    return result.insertId;
  } catch (error) {
    console.error('[MatchLevels] Error initializing:', error);
    throw error;
  }
};

/**
 * Record a new message and check for level-up triggers
 * Returns levelUpAction object if user should be prompted
 */
const recordMessage = async (conversationId, senderId) => {
  try {
    // Get or create match level record
    const [matchLevels] = await pool.execute(
      `SELECT ml.*, c.user_id_1, c.user_id_2
       FROM match_levels ml
       JOIN conversations c ON c.id = ml.conversation_id
       WHERE ml.conversation_id = ?`,
      [conversationId]
    );
    
    if (matchLevels.length === 0) {
      // Initialize if doesn't exist
      const [conv] = await pool.execute(
        'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
        [conversationId]
      );
      
      if (conv.length === 0) {
        throw new Error('Conversation not found');
      }
      
      await initializeMatchLevel(conversationId, conv[0].user_id_1, conv[0].user_id_2);
      
      // Re-fetch after initialization
      const [newMatchLevels] = await pool.execute(
        `SELECT ml.*, c.user_id_1, c.user_id_2
         FROM match_levels ml
         JOIN conversations c ON c.id = ml.conversation_id
         WHERE ml.conversation_id = ?`,
        [conversationId]
      );
      
      if (newMatchLevels.length === 0) {
        throw new Error('Failed to initialize match levels');
      }
      
      matchLevels[0] = newMatchLevels[0];
    }
    
    const matchLevel = matchLevels[0];
    const { user_id_1, user_id_2 } = matchLevel;
    
    // Determine which user sent the message
    const isSenderUser1 = senderId === user_id_1;
    const otherUserId = isSenderUser1 ? user_id_2 : user_id_1;
    
    // Increment message counts
    const newTotalMessages = matchLevel.total_messages + 1;
    const newUser1Count = isSenderUser1 ? matchLevel.user1_message_count + 1 : matchLevel.user1_message_count;
    const newUser2Count = !isSenderUser1 ? matchLevel.user2_message_count + 1 : matchLevel.user2_message_count;
    
    // Update message counts
    await pool.execute(
      `UPDATE match_levels 
       SET total_messages = ?, user1_message_count = ?, user2_message_count = ?
       WHERE conversation_id = ?`,
      [newTotalMessages, newUser1Count, newUser2Count, conversationId]
    );
    
    // Check if both users have sent at least 1 message
    const bothUsersActive = newUser1Count >= 1 && newUser2Count >= 1;
    
    // Get sender's profile completion status
    const [senderData] = await pool.execute(
      'SELECT level2_questions_completed, level3_questions_completed, first_name FROM users WHERE id = ?',
      [senderId]
    );
    
    const [otherUserData] = await pool.execute(
      'SELECT first_name FROM users WHERE id = ?',
      [otherUserId]
    );
    
    const senderProfile = senderData[0];
    const otherUserName = otherUserData[0].first_name;
    
    let levelUpAction = null;
    
    // LEVEL 2 TRIGGER: 5 total messages + both users active
    if (newTotalMessages === 5 && bothUsersActive && matchLevel.current_level === 1) {
      console.log(`[MatchLevels] Level 2 triggered for conversation ${conversationId}`);
      
      // Update current level to 2
      await pool.execute(
        'UPDATE match_levels SET current_level = 2 WHERE conversation_id = ?',
        [conversationId]
      );
      
      // Check if sender has completed Level 2
      if (!senderProfile.level2_questions_completed) {
        // Sender needs to fill Level 2 data
        const popupField = isSenderUser1 ? 'level2_popup_pending_user1' : 'level2_popup_pending_user2';
        await pool.execute(
          `UPDATE match_levels SET ${popupField} = TRUE WHERE conversation_id = ?`,
          [conversationId]
        );
        
        levelUpAction = {
          action: 'FILL_INFORMATION',
          level: 2,
          otherUserName,
          userHasFilledData: false
        };
      } else {
        // Sender has already filled, ask for consent
        const popupField = isSenderUser1 ? 'level2_popup_pending_user1' : 'level2_popup_pending_user2';
        await pool.execute(
          `UPDATE match_levels SET ${popupField} = TRUE WHERE conversation_id = ?`,
          [conversationId]
        );
        
        levelUpAction = {
          action: 'ASK_CONSENT',
          level: 2,
          otherUserName,
          userHasFilledData: true
        };
      }
    }
    
    // LEVEL 3 TRIGGER: 10 total messages + both users active
    if (newTotalMessages === 10 && bothUsersActive && matchLevel.current_level === 2) {
      console.log(`[MatchLevels] Level 3 triggered for conversation ${conversationId}`);
      
      // Update current level to 3
      await pool.execute(
        'UPDATE match_levels SET current_level = 3 WHERE conversation_id = ?',
        [conversationId]
      );
      
      // Check if sender has completed Level 3
      if (!senderProfile.level3_questions_completed) {
        // Sender needs to fill Level 3 data
        const popupField = isSenderUser1 ? 'level3_popup_pending_user1' : 'level3_popup_pending_user2';
        await pool.execute(
          `UPDATE match_levels SET ${popupField} = TRUE WHERE conversation_id = ?`,
          [conversationId]
        );
        
        levelUpAction = {
          action: 'FILL_INFORMATION',
          level: 3,
          otherUserName,
          userHasFilledData: false
        };
      } else {
        // For Level 3, always ask for consent (no form filling after first time)
        const popupField = isSenderUser1 ? 'level3_popup_pending_user1' : 'level3_popup_pending_user2';
        await pool.execute(
          `UPDATE match_levels SET ${popupField} = TRUE WHERE conversation_id = ?`,
          [conversationId]
        );
        
        levelUpAction = {
          action: 'ASK_CONSENT',
          level: 3,
          otherUserName,
          userHasFilledData: true
        };
      }
    }
    
    return levelUpAction;
  } catch (error) {
    console.error('[MatchLevels] Error recording message:', error);
    throw error;
  }
};

/**
 * Get match level info for a conversation
 * ✅ UPDATED: Now returns consent state for reminder banner
 */
const getMatchLevelInfo = async (conversationId, requestingUserId) => {
  try {
    const [matchLevels] = await pool.execute(
      `SELECT ml.*, c.user_id_1, c.user_id_2
       FROM match_levels ml
       JOIN conversations c ON c.id = ml.conversation_id
       WHERE ml.conversation_id = ?`,
      [conversationId]
    );
    
    if (matchLevels.length === 0) {
      return null;
    }
    
    const ml = matchLevels[0];
    const isUser1 = requestingUserId === ml.user_id_1;
    
    return {
      conversationId,
      currentLevel: ml.current_level,
      totalMessages: ml.total_messages,
      myMessageCount: isUser1 ? ml.user1_message_count : ml.user2_message_count,
      otherMessageCount: isUser1 ? ml.user2_message_count : ml.user1_message_count,
      level2: {
        iShared: isUser1 ? ml.level2_shared_by_user1 : ml.level2_shared_by_user2,
        theyShared: isUser1 ? ml.level2_shared_by_user2 : ml.level2_shared_by_user1,
        popupPending: isUser1 ? ml.level2_popup_pending_user1 : ml.level2_popup_pending_user2,
        // ✅ NEW: Return my consent state for banner logic
        myConsentState: isUser1 ? ml.level2_user1_consent_state : ml.level2_user2_consent_state
      },
      level3: {
        iShared: isUser1 ? ml.level3_shared_by_user1 : ml.level3_shared_by_user2,
        theyShared: isUser1 ? ml.level3_shared_by_user2 : ml.level3_shared_by_user1,
        popupPending: isUser1 ? ml.level3_popup_pending_user1 : ml.level3_popup_pending_user2,
        // ✅ NEW: Return my consent state for banner logic
        myConsentState: isUser1 ? ml.level3_user1_consent_state : ml.level3_user2_consent_state
      }
    };
  } catch (error) {
    console.error('[MatchLevels] Error getting match level info:', error);
    throw error;
  }
};

/**
 * Update consent/sharing status
 * ✅ FIXED: "NO" now sets DECLINED_TEMPORARY instead of permanent rejection
 */
const updateConsent = async (conversationId, userId, level, consent) => {
  try {
    const [matchLevels] = await pool.execute(
      'SELECT user_id_1, user_id_2 FROM match_levels WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (matchLevels.length === 0) {
      throw new Error('Match level not found');
    }
    
    const ml = matchLevels[0];
    const isUser1 = userId === ml.user_id_1;
    
    // ✅ NEW: Use consent_state columns with 3 states
    const consentStateField = level === 2 
      ? (isUser1 ? 'level2_user1_consent_state' : 'level2_user2_consent_state')
      : (isUser1 ? 'level3_user1_consent_state' : 'level3_user2_consent_state');
    
    // ✅ BACKWARD COMPATIBILITY: Also update old boolean columns
    const shareField = level === 2 
      ? (isUser1 ? 'level2_shared_by_user1' : 'level2_shared_by_user2')
      : (isUser1 ? 'level3_shared_by_user1' : 'level3_shared_by_user2');
    
    // ✅ CRITICAL FIX: Clear popup only on YES, keep pending=TRUE on NO for persistent reminder
    const popupField = level === 2
      ? (isUser1 ? 'level2_popup_pending_user1' : 'level2_popup_pending_user2')
      : (isUser1 ? 'level3_popup_pending_user1' : 'level3_popup_pending_user2');
    
    // ✅ YES = ACCEPTED, NO = DECLINED_TEMPORARY (not permanent!)
    const consentState = consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY';
    
    // ✅ Clear popup only on YES
    const clearPopup = consent === true;
    
    await pool.execute(
      `UPDATE match_levels 
       SET ${consentStateField} = ?, 
           ${shareField} = ?, 
           ${popupField} = ? 
       WHERE conversation_id = ?`,
      [consentState, consent, !clearPopup, conversationId]
    );
    
    console.log(`[MatchLevels] User ${userId} ${consent ? 'ACCEPTED' : 'DECLINED_TEMPORARY'} Level ${level} for conversation ${conversationId}`);
    console.log(`[MatchLevels] Popup pending now: ${!clearPopup} (reminder banner will show if NO was clicked)`);
    
    return true;
  } catch (error) {
    console.error('[MatchLevels] Error updating consent:', error);
    throw error;
  }
};

/**
 * Clear popup pending status (when user fills information)
 */
const clearPopupPending = async (conversationId, userId, level) => {
  try {
    const [matchLevels] = await pool.execute(
      'SELECT user_id_1, user_id_2 FROM match_levels WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (matchLevels.length === 0) {
      return;
    }
    
    const ml = matchLevels[0];
    const isUser1 = userId === ml.user_id_1;
    
    const popupField = level === 2
      ? (isUser1 ? 'level2_popup_pending_user1' : 'level2_popup_pending_user2')
      : (isUser1 ? 'level3_popup_pending_user1' : 'level3_popup_pending_user2');
    
    await pool.execute(
      `UPDATE match_levels SET ${popupField} = FALSE WHERE conversation_id = ?`,
      [conversationId]
    );
  } catch (error) {
    console.error('[MatchLevels] Error clearing popup:', error);
  }
};

/**
 * Calculate what level of profile data the requesting user can see for another user
 */
const calculateAllowedLevel = async (conversationId, requestingUserId, targetUserId) => {
  try {
    const [matchLevels] = await pool.execute(
      'SELECT * FROM match_levels WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (matchLevels.length === 0) {
      // No match level record = Level 1 only
      return 1;
    }
    
    const ml = matchLevels[0];
    const isRequestingUser1 = requestingUserId === ml.user_id_1;
    
    // Level 1 is always visible
    let allowedLevel = 1;
    
    // Check Level 2 visibility
    const level2SharedByMe = isRequestingUser1 ? ml.level2_shared_by_user1 : ml.level2_shared_by_user2;
    const level2SharedByThem = isRequestingUser1 ? ml.level2_shared_by_user2 : ml.level2_shared_by_user1;
    
    // Both must have shared Level 2 to see it
    if (level2SharedByMe && level2SharedByThem) {
      allowedLevel = 2;
    }
    
    // Check Level 3 visibility
    const level3SharedByMe = isRequestingUser1 ? ml.level3_shared_by_user1 : ml.level3_shared_by_user2;
    const level3SharedByThem = isRequestingUser1 ? ml.level3_shared_by_user2 : ml.level3_shared_by_user1;
    
    // Both must have shared Level 3 to see it (and Level 2 must also be shared)
    if (allowedLevel >= 2 && level3SharedByMe && level3SharedByThem) {
      allowedLevel = 3;
    }
    
    return allowedLevel;
  } catch (error) {
    console.error('[MatchLevels] Error calculating allowed level:', error);
    return 1; // Default to Level 1 on error
  }
};

module.exports = {
  initializeMatchLevel,
  recordMessage,
  getMatchLevelInfo,
  updateConsent,
  clearPopupPending,
  calculateAllowedLevel
};
