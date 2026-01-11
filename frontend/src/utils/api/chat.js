// frontend/src/utils/api/chat.js

import { isMockMode } from '../mockMode';
import { authRequest } from '../apiClient';

// Chat API
export const chatAPI = {
    // Get all conversations for the current user
    getConversations: async () => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty conversations.");
            return [];
        }
        
        return authRequest('/chat/conversations', {
            method: 'GET',
        });
    },

    // Get or create a conversation with a matched user
    createConversation: async (otherUserId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating conversation creation.");
            return { conversationId: Date.now(), existed: false };
        }
        
        return authRequest('/chat/conversations', {
            method: 'POST',
            body: JSON.stringify({ otherUserId }),
        });
    },

    // Get messages for a conversation
    getMessages: async (conversationId, limit = 50, before = null) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty messages.");
            return [];
        }
        
        const params = new URLSearchParams({ limit: limit.toString() });
        if (before) {
            params.append('before', before);
        }
        
        return authRequest(`/chat/conversations/${conversationId}/messages?${params.toString()}`, {
            method: 'GET',
        });
    },

    // Send a message in a conversation
    sendMessage: async (conversationId, messageType, content, voiceDuration = null) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating message send.");
            return {
                id: Date.now(),
                senderId: 1,
                messageType,
                content,
                voiceDuration,
                isRead: false,
                isSent: true,
                createdAt: new Date().toISOString(),
            };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ messageType, content, voiceDuration }),
        });
    },

    // Mark messages as read
    markAsRead: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating mark as read.");
            return { success: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/read`, {
            method: 'PUT',
        });
    },

    // Delete message
    deleteMessage: async (messageId, deleteType) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating message delete.");
            return { success: true, deleteType };
        }
        
        return authRequest(`/chat/messages/${messageId}`, {
            method: 'DELETE',
            body: JSON.stringify({ deleteType }),
        });
    },

    // Clear chat - Delete all messages but keep conversation
    clearChat: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating clear chat.");
            return { success: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/clear`, {
            method: 'POST',
        });
    },

    // Unmatch - Remove match and delete conversation for both users
    unmatch: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating unmatch.");
            return { success: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/unmatch`, {
            method: 'DELETE',
        });
    },

    // Delete conversation - Remove from current user's view only
    deleteConversation: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating delete conversation.");
            return { success: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}`, {
            method: 'DELETE',
        });
    },
};
