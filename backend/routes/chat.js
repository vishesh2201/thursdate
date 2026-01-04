const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const matchExpiryService = require('../services/matchExpiry');
const router = express.Router();

// Helper function to normalize user IDs for conversation
// Ensures user1_id < user2_id for consistency
const normalizeUserIds = (userId1, userId2) => {
  const id1 = parseInt(userId1);
  const id2 = parseInt(userId2);
  return id1 < id2 ? [id1, id2] : [id2, id1];
};

// Helper function to check if two users are mutually matched
const checkMutualMatch = async (userId1, userId2) => {
  const [matches] = await pool.execute(
    `SELECT 1 FROM user_actions a1
     JOIN user_actions a2 ON a1.user_id = a2.target_user_id AND a1.target_user_id = a2.user_id
     WHERE a1.user_id = ? AND a1.target_user_id = ? 
     AND a1.action_type = 'like' AND a2.action_type = 'like'
     LIMIT 1`,
    [userId1, userId2]
  );
  return matches.length > 0;
};

// Get all conversations for the current user (only with matched users)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all conversations with matched users
    const [conversations] = await pool.execute(
      `SELECT 
        c.id as conversationId,
        c.created_at as conversationCreatedAt,
        c.updated_at as conversationUpdatedAt,
        CASE 
          WHEN c.user_id_1 = ? THEN c.user_id_2 
          ELSE c.user_id_1 
        END as otherUserId,
        u.first_name as firstName,
        u.last_name as lastName,
        u.profile_pic_url as profilePicUrl,
        u.current_location as location,
        m.id as lastMessageId,
        m.type as lastMessageType,
        m.content as lastMessageContent,
        m.duration as lastMessageVoiceDuration,
        m.sender_id as lastMessageSenderId,
        m.status as lastMessageStatus,
        m.created_at as lastMessageTime,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.conversation_id = c.id 
         AND m2.status != 'READ' 
         AND m2.sender_id != ?) as unreadCount
      FROM conversations c
      JOIN users u ON u.id = CASE 
        WHEN c.user_id_1 = ? THEN c.user_id_2 
        ELSE c.user_id_1 
      END
      LEFT JOIN messages m ON m.conversation_id = c.id 
        AND m.id = (SELECT MAX(id) FROM messages WHERE conversation_id = c.id)
      WHERE c.user_id_1 = ? OR c.user_id_2 = ?
      ORDER BY c.updated_at DESC`,
      [userId, userId, userId, userId, userId]
    );
    
    // Format the response
    const formattedConversations = conversations.map(conv => ({
      conversationId: conv.conversationId,
      otherUser: {
        id: conv.otherUserId,
        firstName: conv.firstName,
        lastName: conv.lastName,
        name: `${conv.firstName || ''} ${conv.lastName || ''}`.trim(),
        profilePicUrl: conv.profilePicUrl,
        location: conv.location
      },
      lastMessage: conv.lastMessageId ? {
        id: conv.lastMessageId,
        type: conv.lastMessageType,
        content: conv.lastMessageContent,
        voiceDuration: conv.lastMessageVoiceDuration,
        senderId: conv.lastMessageSenderId,
        status: conv.lastMessageStatus,
        isRead: conv.lastMessageStatus === 'READ',
        time: conv.lastMessageTime,
        isSent: conv.lastMessageSenderId === userId
      } : null,
      unreadCount: conv.unreadCount || 0,
      updatedAt: conv.conversationUpdatedAt
    }));
    
    res.json(formattedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get or create a conversation with a matched user
router.post('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId is required' });
    }
    
    // Normalize user IDs
    const [user1Id, user2Id] = normalizeUserIds(userId, otherUserId);
    
    // Check if conversation already exists (allow access to existing conversations)
    const [existing] = await pool.execute(
      'SELECT id FROM conversations WHERE user_id_1 = ? AND user_id_2 = ?',
      [user1Id, user2Id]
    );
    
    if (existing.length > 0) {
      return res.json({ conversationId: existing[0].id, existed: true });
    }
    
    // Only check for mutual match when creating a NEW conversation
    const isMatched = await checkMutualMatch(userId, otherUserId);
    if (!isMatched) {
      return res.status(403).json({ error: 'You can only chat with matched users' });
    }
    
    // Get match creation time from user_actions
    const [matchInfo] = await pool.execute(
      `SELECT GREATEST(a1.created_at, a2.created_at) as match_created_at
       FROM user_actions a1
       JOIN user_actions a2 ON a1.user_id = a2.target_user_id AND a1.target_user_id = a2.user_id
       WHERE a1.user_id = ? AND a1.target_user_id = ?
         AND a1.action_type = 'like' AND a2.action_type = 'like'`,
      [user1Id, user2Id]
    );
    
    const matchCreatedAt = matchInfo.length > 0 ? matchInfo[0].match_created_at : new Date();
    
    // Create new conversation
    const [result] = await pool.execute(
      'INSERT INTO conversations (user_id_1, user_id_2) VALUES (?, ?)',
      [user1Id, user2Id]
    );
    
    // Initialize match timer (7-day expiry)
    await matchExpiryService.initializeMatchTimer(result.insertId, matchCreatedAt);
    
    res.status(201).json({ conversationId: result.insertId, existed: false });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    
    console.log('GET messages - conversationId:', conversationId, 'limit:', limit, 'before:', before, 'userId:', userId);
    
    // Parse and validate conversationId first
    const convId = parseInt(conversationId);
    if (isNaN(convId) || convId < 1) {
      console.error('Invalid conversationId:', conversationId);
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    // Verify user is part of this conversation
    const [convCheck] = await pool.execute(
      'SELECT 1 FROM conversations WHERE id = ? AND (user_id_1 = ? OR user_id_2 = ?)',
      [convId, userId, userId]
    );
    
    if (convCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Parse limit
    const limitValue = parseInt(limit);
    const finalLimit = (isNaN(limitValue) || limitValue < 1 || limitValue > 100) ? 50 : limitValue;
    
    // Build params array
    const params = [convId];
    let beforeClause = '';
    
    if (before) {
      const beforeId = parseInt(before);
      if (!isNaN(beforeId) && beforeId > 0) {
        beforeClause = ' AND m.id < ?';
        params.push(beforeId);
      }
    }
    
    console.log('Final params:', params);
    
    // Execute query - LIMIT cannot be parameterized in MySQL prepared statements
    const query = `
      SELECT 
        m.id,
        m.sender_id as senderId,
        m.type as messageType,
        m.content,
        m.duration as voiceDuration,
        m.status as status,
        m.read_at as readAt,
        m.created_at as createdAt,
        u.first_name as senderFirstName,
        u.last_name as senderLastName
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ?${beforeClause}
      ORDER BY m.id DESC 
      LIMIT ${finalLimit}
    `;
    
    const [messages] = await pool.execute(query, params);
    
    // Format messages
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      messageType: msg.messageType.toLowerCase(),
      content: msg.content,
      voiceDuration: msg.voiceDuration,
      status: msg.status,
      isRead: msg.status === 'READ',
      isSent: msg.senderId === userId,
      createdAt: msg.createdAt,
      sender: {
        firstName: msg.senderFirstName,
        lastName: msg.senderLastName
      }
    }));
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message in a conversation
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { messageType, content, voiceDuration } = req.body;
    
    // Validate message type
    if (!['text', 'voice'].includes(messageType)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    
    // Validate content
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Verify user is part of this conversation
    const [convCheck] = await pool.execute(
      'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ? AND (user_id_1 = ? OR user_id_2 = ?)',
      [parseInt(conversationId), userId, userId]
    );
    
    if (convCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Insert message
    const [result] = await pool.execute(
      `INSERT INTO messages (conversation_id, sender_id, type, content, duration) 
       VALUES (?, ?, ?, ?, ?)`,
      [parseInt(conversationId), userId, messageType.toUpperCase(), content, voiceDuration || null]
    );
    
    // Update conversation's updated_at
    await pool.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [parseInt(conversationId)]
    );
    
    // Track first message and replies for match expiry system
    const isFirstMessage = await matchExpiryService.recordFirstMessage(parseInt(conversationId), userId);
    const isReply = await matchExpiryService.recordReply(parseInt(conversationId), userId);
    
    console.log('[Chat] Message sent - isFirstMessage:', isFirstMessage, 'isReply:', isReply);
    
    // If this was the first message or a reply, emit socket event to update matched profiles
    if (isFirstMessage || isReply) {
      const io = req.app.get('io');
      const conversation = convCheck[0];
      const otherUserId = conversation.user_id_1 === userId ? conversation.user_id_2 : conversation.user_id_1;
      
      // Emit to sender (profile should be removed from their matched section)
      if (isFirstMessage) {
        io.to(`user:${userId}`).emit('match_moved_to_chat', {
          conversationId: parseInt(conversationId),
          otherUserId: otherUserId
        });
      }
      
      // Emit to both users when reply happens (profile should be removed from both matched sections)
      if (isReply) {
        io.to(`user:${userId}`).emit('match_moved_to_chat', {
          conversationId: parseInt(conversationId),
          otherUserId: otherUserId
        });
        io.to(`user:${otherUserId}`).emit('match_moved_to_chat', {
          conversationId: parseInt(conversationId),
          otherUserId: userId
        });
      }
    }
    
    // Get the created message with sender info
    const [messages] = await pool.execute(
      `SELECT 
        m.id,
        m.sender_id as senderId,
        m.type as messageType,
        m.content,
        m.duration as voiceDuration,
        m.status as status,
        m.created_at as createdAt,
        u.first_name as senderFirstName,
        u.last_name as senderLastName
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?`,
      [result.insertId]
    );
    
    const message = {
      id: messages[0].id,
      senderId: messages[0].senderId,
      messageType: messages[0].messageType.toLowerCase(),
      content: messages[0].content,
      voiceDuration: messages[0].voiceDuration,
      status: messages[0].status,
      isRead: messages[0].status === 'READ',
      createdAt: messages[0].createdAt,
      sender: {
        firstName: messages[0].senderFirstName,
        lastName: messages[0].senderLastName
      }
    };
    
    // Emit socket event to the other user
    const io = req.app.get('io');
    const socketConfig = require('../config/socket');
    const conversation = convCheck[0];
    const otherUserId = conversation.user_id_1 === userId ? conversation.user_id_2 : conversation.user_id_1;
    
    // Check if recipient is online (from socket.js onlineUsers)
    const onlineUsers = socketConfig.getOnlineUsers();
    const isRecipientOnline = onlineUsers.has(otherUserId);
    console.log(`HTTP Route - Recipient ${otherUserId} online:`, isRecipientOnline, 'Online users:', Array.from(onlineUsers.keys()));
    
    // If recipient is online, mark as DELIVERED
    if (isRecipientOnline) {
      await pool.execute(
        'UPDATE messages SET status = ? WHERE id = ?',
        ['DELIVERED', message.id]
      );
      message.status = 'DELIVERED';
      console.log(`HTTP Route - Message ${message.id} marked as DELIVERED`);
    }
    
    // Emit to recipient
    io.to(`user:${otherUserId}`).emit('new_message', {
      conversationId: parseInt(conversationId),
      message
    });
    
    // If recipient is online, send delivery receipt to sender
    if (isRecipientOnline) {
      console.log(`HTTP Route - Emitting delivery receipt to user:${userId}`);
      io.to(`user:${userId}`).emit('message_delivered', {
        conversationId: parseInt(conversationId),
        messageId: message.id
      });
    }
    
    // Return message with isSent for the API caller (sender)
    res.status(201).json({
      ...message,
      isSent: true
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    
    // Verify user is part of this conversation
    const [convCheck] = await pool.execute(
      'SELECT 1 FROM conversations WHERE id = ? AND (user_id_1 = ? OR user_id_2 = ?)',
      [parseInt(conversationId), userId, userId]
    );
    
    if (convCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }
    
    // Mark all messages from the other user as read
    await pool.execute(
      `UPDATE messages 
       SET status = 'READ', read_at = CURRENT_TIMESTAMP 
       WHERE conversation_id = ? 
       AND sender_id != ? 
       AND status != 'READ'`,
      [parseInt(conversationId), userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete message
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { deleteType } = req.body; // 'for_me' or 'for_everyone'
    
    const msgId = parseInt(messageId);
    if (isNaN(msgId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    
    // Get message details with retry on connection error
    let messages;
    try {
      [messages] = await pool.execute(
        `SELECT m.*, c.user_id_1, c.user_id_2 
         FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE m.id = ?`,
        [msgId]
      );
    } catch (dbError) {
      console.error('Database error getting message:', dbError.message);
      if (dbError.code === 'ECONNRESET' || dbError.code === 'PROTOCOL_CONNECTION_LOST') {
        // Retry once
        [messages] = await pool.execute(
          `SELECT m.*, c.user_id_1, c.user_id_2 
           FROM messages m
           JOIN conversations c ON c.id = m.conversation_id
           WHERE m.id = ?`,
          [msgId]
        );
      } else {
        throw dbError;
      }
    }
    
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const message = messages[0];
    
    // Check if user is part of the conversation
    if (message.user_id_1 !== userId && message.user_id_2 !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const isSender = message.sender_id === userId;
    
    if (deleteType === 'for_everyone') {
      // Only sender can delete for everyone
      if (!isSender) {
        return res.status(403).json({ error: 'Only sender can delete for everyone' });
      }
      
      // Check if message was sent within last 48 hours (like WhatsApp)
      const messageAge = Date.now() - new Date(message.created_at).getTime();
      const maxAge = 48 * 60 * 60 * 1000; // 48 hours
      
      if (messageAge > maxAge) {
        return res.status(400).json({ error: 'Message too old to delete for everyone' });
      }
      
      // Mark as deleted for both users
      try {
        await pool.execute(
          `UPDATE messages 
           SET deleted_for_sender = 1, deleted_for_recipient = 1, deleted_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [msgId]
        );
      } catch (dbError) {
        console.error('Database error updating message:', dbError.message);
        if (dbError.code === 'ECONNRESET' || dbError.code === 'PROTOCOL_CONNECTION_LOST') {
          await pool.execute(
            `UPDATE messages 
             SET deleted_for_sender = 1, deleted_for_recipient = 1, deleted_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [msgId]
          );
        } else {
          throw dbError;
        }
      }
      
      // Emit socket event for delete_for_everyone
      const io = req.app.get('io');
      if (io) {
        const roomName = `conversation:${message.conversation_id}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        const clientsInRoom = room ? Array.from(room) : [];
        console.log('Emitting message_deleted to room:', roomName, 'messageId:', msgId);
        console.log('Clients in room:', clientsInRoom.length, clientsInRoom);
        io.to(roomName).emit('message_deleted', {
          messageId: msgId,
          conversationId: message.conversation_id,
          deleteType: 'for_everyone'
        });
      } else {
        console.log('Socket.IO not available for message_deleted event');
      }
      
      res.json({ success: true, deleteType: 'for_everyone' });
    } else {
      // Delete for me only
      if (isSender) {
        try {
          await pool.execute(
            `UPDATE messages 
             SET deleted_for_sender = 1, deleted_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [msgId]
          );
        } catch (dbError) {
          console.error('Database error updating message:', dbError.message);
          if (dbError.code === 'ECONNRESET' || dbError.code === 'PROTOCOL_CONNECTION_LOST') {
            await pool.execute(
              `UPDATE messages 
               SET deleted_for_sender = 1, deleted_at = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [msgId]
            );
          } else {
            throw dbError;
          }
        }
      } else {
        try {
          await pool.execute(
            `UPDATE messages 
             SET deleted_for_recipient = 1, deleted_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [msgId]
          );
        } catch (dbError) {
          console.error('Database error updating message:', dbError.message);
          if (dbError.code === 'ECONNRESET' || dbError.code === 'PROTOCOL_CONNECTION_LOST') {
            await pool.execute(
              `UPDATE messages 
               SET deleted_for_recipient = 1, deleted_at = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [msgId]
            );
          } else {
            throw dbError;
          }
        }
      }
      
      res.json({ success: true, deleteType: 'for_me' });
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
