import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server with authentication
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Join a conversation room
   * @param {number} conversationId - ID of the conversation to join
   */
  joinConversation(conversationId) {
    if (this.socket) {
      console.log('Socket.emit join_conversation:', conversationId, 'Socket connected:', this.socket.connected);
      this.socket.emit('join_conversation', conversationId);
    } else {
      console.error('Cannot join conversation - socket not initialized');
    }
  }

  /**
   * Leave a conversation room
   * @param {number} conversationId - ID of the conversation to leave
   */
  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  /**
   * Emit typing start event
   * @param {number} conversationId - ID of the conversation
   * @param {number} otherUserId - ID of the other user in the conversation
   */
  startTyping(conversationId, otherUserId) {
    if (this.socket) {
      this.socket.emit('typing_start', { conversationId, otherUserId });
    }
  }

  /**
   * Emit typing stop event
   * @param {number} conversationId - ID of the conversation
   * @param {number} otherUserId - ID of the other user in the conversation
   */
  stopTyping(conversationId, otherUserId) {
    if (this.socket) {
      this.socket.emit('typing_stop', { conversationId, otherUserId });
    }
  }

  /**
   * Mark messages as read
   * @param {number} conversationId - ID of the conversation
   * @param {Array<number>} messageIds - IDs of messages to mark as read
   */
  markMessagesAsRead(conversationId, messageIds) {
    if (this.socket) {
      this.socket.emit('message_read', { conversationId, messageIds });
    }
  }

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function to handle new messages
   */
  onNewMessage(callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has('new_message')) {
        this.socket.off('new_message', this.listeners.get('new_message'));
      }
      this.socket.on('new_message', callback);
      this.listeners.set('new_message', callback);
    }
  }

  /**
   * Listen for typing events
   * @param {Function} callback - Callback function to handle typing events
   */
  onUserTyping(callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has('user_typing')) {
        this.socket.off('user_typing', this.listeners.get('user_typing'));
      }
      this.socket.on('user_typing', callback);
      this.listeners.set('user_typing', callback);
    }
  }

  /**
   * Listen for message read receipts
   * @param {Function} callback - Callback function to handle read receipts
   */
  onMessagesRead(callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has('messages_read')) {
        this.socket.off('messages_read', this.listeners.get('messages_read'));
      }
      this.socket.on('messages_read', callback);
      this.listeners.set('messages_read', callback);
    }
  }

  /**
   * Request user status
   * @param {number} userId - ID of the user to check status
   */
  requestUserStatus(userId) {
    if (this.socket) {
      this.socket.emit('request_user_status', userId);
    }
  }

  /**
   * Listen for user status changes
   * @param {Function} callback - Callback function to handle status changes
   */
  onUserStatus(callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has('user_status')) {
        this.socket.off('user_status', this.listeners.get('user_status'));
      }
      this.socket.on('user_status', callback);
      this.listeners.set('user_status', callback);
    }
  }

  /**
   * Listen for match moved to chat event (when first message sent or replied)
   * @param {Function} callback - Callback function to handle match moved event
   */
  onMatchMovedToChat(callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has('match_moved_to_chat')) {
        this.socket.off('match_moved_to_chat', this.listeners.get('match_moved_to_chat'));
      }
      this.socket.on('match_moved_to_chat', callback);
      this.listeners.set('match_moved_to_chat', callback);
    }
  }

  /**
   * Remove a specific event listener
   * @param {string} event - Event name
   */
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  /**
   * Add a generic event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.socket) {
      // Remove old listener if exists to prevent duplicates
      if (this.listeners.has(event)) {
        this.socket.off(event, this.listeners.get(event));
      }
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
