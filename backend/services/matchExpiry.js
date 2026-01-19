const pool = require('../config/db');

/**
 * Match Expiry Service
 * Handles 7-day match expiry logic and conversation state management
 */

/**
 * Initialize a match with 7-day expiry when conversation is created
 * @param {number} conversationId - The conversation ID
 * @param {timestamp} matchCreatedAt - When the match was created
 */
async function initializeMatchTimer(conversationId, matchCreatedAt) {
  const expiresAt = new Date(matchCreatedAt);
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await pool.execute(
    `UPDATE conversations 
     SET match_created_at = ?, 
         match_expires_at = ?,
         match_expired = FALSE
     WHERE id = ?`,
    [matchCreatedAt, expiresAt, conversationId]
  );
}

/**
 * Record first message sent in a conversation
 * @param {number} conversationId - The conversation ID
 * @param {number} senderId - Who sent the first message
 */
async function recordFirstMessage(conversationId, senderId) {
  const [result] = await pool.execute(
    `UPDATE conversations 
     SET first_message_at = CURRENT_TIMESTAMP,
         first_message_sender_id = ?
     WHERE id = ? AND first_message_at IS NULL`,
    [senderId, conversationId]
  );
  
  return result.affectedRows > 0;
}

/**
 * Record reply to first message
 * @param {number} conversationId - The conversation ID
 * @param {number} senderId - Who sent the reply
 * @returns {boolean} - True if this was the first reply
 */
async function recordReply(conversationId, senderId) {
  // Check if this is a reply (sender is different from first message sender)
  const [conv] = await pool.execute(
    `SELECT first_message_sender_id, reply_at 
     FROM conversations 
     WHERE id = ?`,
    [conversationId]
  );
  
  console.log('[recordReply] Conv data:', { 
    conversationId, 
    senderId, 
    senderType: typeof senderId,
    conv: conv[0],
    firstSenderType: conv[0] ? typeof conv[0].first_message_sender_id : 'N/A'
  });
  
  if (conv.length === 0) {
    console.log('[recordReply] No conversation found');
    return false;
  }
  
  const conversation = conv[0];
  
  // If no first message yet, this can't be a reply
  if (!conversation.first_message_sender_id) {
    console.log('[recordReply] No first message sender');
    return false;
  }
  
  // If already has a reply recorded, skip
  if (conversation.reply_at) {
    console.log('[recordReply] Reply already recorded');
    return false;
  }
  
  // If sender is same as first message sender, not a reply
  // Use == instead of === to handle type coercion
  if (conversation.first_message_sender_id == senderId) {
    console.log('[recordReply] Same sender as first message, not a reply', {
      first: conversation.first_message_sender_id,
      current: senderId,
      strictEqual: conversation.first_message_sender_id === senderId,
      looseEqual: conversation.first_message_sender_id == senderId
    });
    return false;
  }
  
  // Record the reply
  console.log('[recordReply] Recording reply for conv:', conversationId);
  const [result] = await pool.execute(
    `UPDATE conversations 
     SET reply_at = CURRENT_TIMESTAMP
     WHERE id = ? AND reply_at IS NULL`,
    [conversationId]
  );
  
  console.log('[recordReply] Update result:', result.affectedRows, 'rows affected');
  
  return result.affectedRows > 0;
}

/**
 * Get match state for a conversation
 * @param {number} conversationId - The conversation ID
 * @returns {Object} Match state information
 */
async function getMatchState(conversationId) {
  const [rows] = await pool.execute(
    `SELECT 
      match_created_at,
      match_expires_at,
      first_message_at,
      first_message_sender_id,
      reply_at,
      match_expired,
      user_id_1,
      user_id_2
     FROM conversations 
     WHERE id = ?`,
    [conversationId]
  );
  
  if (rows.length === 0) return null;
  
  return rows[0];
}

/**
 * Check if a match should show in "matched profiles" section for a specific user
 * @param {number} conversationId - The conversation ID
 * @param {number} userId - The user to check for
 * @returns {boolean} - True if should show in matched profiles section
 */
async function shouldShowInMatchedProfiles(conversationId, userId) {
  const state = await getMatchState(conversationId);
  
  if (!state) return false;
  
  // If match expired, don't show
  if (state.match_expired) return false;
  
  // If both users have exchanged messages (reply exists), don't show
  if (state.reply_at) return false;
  
  // If no messages at all, show in matched profiles
  if (!state.first_message_at) return true;
  
  // If user sent the first message, don't show (it's in chat list for them)
  if (state.first_message_sender_id === userId) return false;
  
  // If other user sent first message but current user hasn't replied, show
  return true;
}

/**
 * Get all matches that should appear in "matched profiles" for a user
 * @param {number} userId - The user ID
 * @returns {Array} List of matched user profiles
 */
async function getMatchedProfilesForUser(userId) {
  const [matches] = await pool.execute(
    `SELECT 
      c.id as conversationId,
      c.match_created_at as matchedAt,
      c.match_expires_at as expiresAt,
      c.first_message_at,
      c.first_message_sender_id,
      c.reply_at,
      c.deleted_by_user1,
      c.deleted_by_user2,
      CASE 
        WHEN c.user_id_1 = ? THEN c.user_id_2 
        ELSE c.user_id_1 
      END as otherUserId,
      u.first_name as firstName,
      u.last_name as lastName,
      u.profile_pic_url as profilePicUrl,
      u.current_location as currentLocation,
      u.dob
    FROM conversations c
    JOIN users u ON u.id = CASE 
      WHEN c.user_id_1 = ? THEN c.user_id_2 
      ELSE c.user_id_1 
    END
    WHERE (c.user_id_1 = ? OR c.user_id_2 = ?)
      AND c.match_expired = FALSE
      AND c.match_expires_at > NOW()
      AND (
        -- No messages at all
        c.first_message_at IS NULL
        OR
        -- Other user sent first message, but current user hasn't replied
        (c.first_message_sender_id != ? AND c.reply_at IS NULL)
        OR
        -- Conversation was deleted by current user (show in horizontal list for re-messaging)
        (CASE WHEN c.user_id_1 = ? THEN c.deleted_by_user1 ELSE c.deleted_by_user2 END = TRUE)
      )
    ORDER BY c.match_created_at DESC`,
    [userId, userId, userId, userId, userId, userId]
  );
  
  // Calculate age and format response
  return matches.map(match => {
    let age = null;
    if (match.dob) {
      const birthDate = new Date(match.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    return {
      id: match.otherUserId,
      conversationId: match.conversationId,
      firstName: match.firstName,
      lastName: match.lastName,
      age,
      profilePicUrl: match.profilePicUrl,
      currentLocation: match.currentLocation,
      matchedAt: match.matchedAt,
      expiresAt: match.expiresAt,
      hasFirstMessage: !!match.first_message_at,
      isWaitingForReply: match.first_message_sender_id === match.otherUserId && !match.reply_at
    };
  });
}

/**
 * Mark matches as expired for UI visibility after 7 days without a reply
 * This ONLY affects horizontal matched section visibility
 * Match validity and chat permissions remain intact
 * This should be run periodically (e.g., via cron job)
 */
async function expireOldMatches() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Find all matches that should be expired (for UI only)
    const [expiredMatches] = await connection.execute(
      `SELECT id, user_id_1, user_id_2
       FROM conversations 
       WHERE match_expired = FALSE 
         AND match_expires_at < NOW()
         AND reply_at IS NULL`
    );
    
    if (expiredMatches.length === 0) {
      await connection.commit();
      return { expired: 0 };
    }
    
    // Mark conversations as expired (UI-only flag)
    // This removes profiles from horizontal section but preserves match and chat access
    await connection.execute(
      `UPDATE conversations 
       SET match_expired = TRUE
       WHERE match_expired = FALSE 
         AND match_expires_at < NOW()
         AND reply_at IS NULL`
    );
    
    // NOTE: We DO NOT change user_actions to 'unmatch'
    // The match remains valid, users can still chat
    // Only UI visibility in horizontal section is affected
    
    await connection.commit();
    
    console.log(`Marked ${expiredMatches.length} matches as expired (UI-only, chat still enabled)`);
    
    return {
      expired: expiredMatches.length,
      matches: expiredMatches
    };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error marking matches as expired:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Manually mark a specific match as expired (UI-only)
 * This removes the profile from horizontal section but preserves chat access
 * @param {number} conversationId - The conversation ID to expire
 */
async function expireMatch(conversationId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get conversation details
    const [conv] = await connection.execute(
      'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
      [conversationId]
    );
    
    if (conv.length === 0) {
      throw new Error('Conversation not found');
    }
    
    // Mark as expired (UI-only flag)
    await connection.execute(
      'UPDATE conversations SET match_expired = TRUE WHERE id = ?',
      [conversationId]
    );
    
    // NOTE: We DO NOT unmatch users
    // Match and chat access remain valid
    
    await connection.commit();
    
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initializeMatchTimer,
  recordFirstMessage,
  recordReply,
  getMatchState,
  shouldShowInMatchedProfiles,
  getMatchedProfilesForUser,
  expireOldMatches,
  expireMatch
};
