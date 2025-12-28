const pool = require('../config/db');

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

module.exports = { initializeSocketHandlers };
