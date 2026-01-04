const pool = require('../config/db');
const matchExpiryService = require('../services/matchExpiry');

// Track online users
const onlineUsers = new Map();

/**
 * Initialize Socket.IO event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userEmail})`);
    
    // Mark user as online
    onlineUsers.set(socket.userId, socket.id);
    
    // Broadcast user online status
    io.emit('user_status', { userId: socket.userId, isOnline: true });
    
    // Join user to their personal room for targeted messages
    socket.join(`user:${socket.userId}`);
    
    // Handle user joining a conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    // Handle user leaving a conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Handle typing indicator
    socket.on('typing_start', ({ conversationId, otherUserId }) => {
      io.to(`user:${otherUserId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: true
      });
    });
    
    socket.on('typing_stop', ({ conversationId, otherUserId }) => {
      io.to(`user:${otherUserId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        isTyping: false
      });
    });
    
    // Handle sending messages via Socket.IO
    socket.on('send_message', async ({ conversationId, messageType, content, voiceDuration }) => {
      try {
        const userId = socket.userId;
        
        // Validate message type
        if (!['text', 'voice'].includes(messageType)) {
          socket.emit('message_error', { 
            error: 'Invalid message type',
            conversationId 
          });
          return;
        }
        
        // Validate content
        if (!content) {
          socket.emit('message_error', { 
            error: 'Message content is required',
            conversationId 
          });
          return;
        }
        
        // Verify user is part of this conversation
        const [convCheck] = await pool.execute(
          'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ? AND (user_id_1 = ? OR user_id_2 = ?)',
          [parseInt(conversationId), userId, userId]
        );
        
        if (convCheck.length === 0) {
          socket.emit('message_error', { 
            error: 'Access denied to this conversation',
            conversationId 
          });
          return;
        }
        
        // Insert message into database
        const [result] = await pool.execute(
          `INSERT INTO messages (conversation_id, sender_id, type, content, duration, status) 
           VALUES (?, ?, ?, ?, ?, 'SENT')`,
          [parseInt(conversationId), userId, messageType.toUpperCase(), content, voiceDuration || null]
        );
        
        // Update conversation's updated_at timestamp
        await pool.execute(
          'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [parseInt(conversationId)]
        );
        
        // Get the saved message with sender info
        const [messages] = await pool.execute(
          `SELECT 
            m.id,
            m.sender_id as senderId,
            m.type as messageType,
            m.content,
            m.duration as voiceDuration,
            m.status,
            m.created_at as createdAt,
            u.first_name as senderFirstName,
            u.last_name as senderLastName
          FROM messages m
          JOIN users u ON u.id = m.sender_id
          WHERE m.id = ?`,
          [result.insertId]
        );
        
        const savedMessage = {
          id: messages[0].id,
          senderId: messages[0].senderId,
          messageType: messages[0].messageType.toLowerCase(),
          content: messages[0].content,
          voiceDuration: messages[0].voiceDuration,
          isRead: messages[0].status === 'READ',
          status: messages[0].status,
          createdAt: messages[0].createdAt,
          sender: {
            firstName: messages[0].senderFirstName,
            lastName: messages[0].senderLastName
          }
        };
        
        // Determine the other user
        const conversation = convCheck[0];
        const otherUserId = conversation.user_id_1 === userId ? conversation.user_id_2 : conversation.user_id_1;
        
        // Check if recipient is online
        const isRecipientOnline = onlineUsers.has(otherUserId);
        console.log(`Recipient ${otherUserId} online status:`, isRecipientOnline, 'Online users:', Array.from(onlineUsers.keys()));
        
        // If recipient is online, mark as DELIVERED
        if (isRecipientOnline) {
          await pool.execute(
            'UPDATE messages SET status = ? WHERE id = ?',
            ['DELIVERED', savedMessage.id]
          );
          savedMessage.status = 'DELIVERED';
          console.log(`Message ${savedMessage.id} marked as DELIVERED`);
        }
        
        // Emit to sender (acknowledgment) with current status
        socket.emit('message_sent', {
          conversationId: parseInt(conversationId),
          message: savedMessage
        });
        
        // Emit to recipient (real-time delivery)
        io.to(`user:${otherUserId}`).emit('new_message', {
          conversationId: parseInt(conversationId),
          message: savedMessage
        });
        
        // If recipient is online, send delivery receipt to sender
        if (isRecipientOnline) {
          console.log(`Emitting delivery receipt to user:${userId}`);
          io.to(`user:${userId}`).emit('message_delivered', {
            conversationId: parseInt(conversationId),
            messageId: savedMessage.id
          });
        }
        
        console.log(`Message ${savedMessage.id} sent from user ${userId} to user ${otherUserId} (status: ${savedMessage.status})`);
        
        // Track first message and replies for match expiry system
        const isFirstMessage = await matchExpiryService.recordFirstMessage(parseInt(conversationId), userId);
        const isReply = await matchExpiryService.recordReply(parseInt(conversationId), userId);
        
        // If this was the first message or a reply, update matched profiles for both users
        if (isFirstMessage) {
          console.log(`First message sent in conversation ${conversationId} by user ${userId}`);
          // Remove from matched profiles for sender, keep for recipient
          io.to(`user:${userId}`).emit('match_moved_to_chat', {
            conversationId: parseInt(conversationId),
            otherUserId: otherUserId
          });
        }
        
        if (isReply) {
          console.log(`Reply received in conversation ${conversationId} from user ${userId}`);
          // Remove from matched profiles for both users
          io.to(`user:${userId}`).emit('match_moved_to_chat', {
            conversationId: parseInt(conversationId),
            otherUserId: otherUserId
          });
          io.to(`user:${otherUserId}`).emit('match_moved_to_chat', {
            conversationId: parseInt(conversationId),
            otherUserId: userId
          });
        }
        
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('message_error', { 
          error: 'Failed to send message',
          conversationId 
        });
      }
    });
    
    // Handle message read receipts
    socket.on('message_read', async ({ conversationId, messageIds }) => {
      try {
        // Update messages as read in database
        if (messageIds && messageIds.length > 0) {
          const placeholders = messageIds.map(() => '?').join(',');
          await pool.execute(
            `UPDATE messages 
             SET status = 'READ', read_at = CURRENT_TIMESTAMP 
             WHERE id IN (${placeholders}) 
             AND sender_id != ?`,
            [...messageIds, socket.userId]
          );
        }
        
        // Get conversation info to notify the other user
        const [conversations] = await pool.execute(
          'SELECT user_id_1, user_id_2 FROM conversations WHERE id = ?',
          [conversationId]
        );
        
        if (conversations.length > 0) {
          const conv = conversations[0];
          const otherUserId = conv.user_id_1 === socket.userId ? conv.user_id_2 : conv.user_id_1;
          
          io.to(`user:${otherUserId}`).emit('messages_read', {
            conversationId,
            messageIds,
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Error handling message_read:', error);
      }
    });
    
    // Handle user status request
    socket.on('request_user_status', (userId) => {
      const isOnline = onlineUsers.has(userId);
      socket.emit('user_status', { userId, isOnline });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Mark user as offline
      onlineUsers.delete(socket.userId);
      
      // Broadcast user offline status
      io.emit('user_status', { userId: socket.userId, isOnline: false });
    });
  });
};

module.exports = { 
  initializeSocketHandlers,
  getOnlineUsers: () => onlineUsers
};
