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

    // Unsend message (deletes for both users, within 12 hours)
    deleteMessage: async (messageId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating message unsend.");
            return { success: true };
        }
        
        return authRequest(`/chat/messages/${messageId}`, {
            method: 'DELETE',
        });
    },

    // Block user - One-sided block that also removes match and conversation
    blockUser: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating block user.");
            return { success: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/block`, {
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

    // ✅ Get level status for conversation
    getLevelStatus: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating level status.");
            return {
                messageCount: 0,
                currentLevel: 1,
                level2ThresholdReached: false,
                level2UserCompleted: false,
                level2PartnerCompleted: false,
                level2BothCompleted: false,
                level2Visible: false,
                level3ThresholdReached: false,
                level3UserConsent: false,
                level3PartnerConsent: false,
                level3BothConsent: false,
                level3Visible: false,
                partnerName: 'Mock User'
            };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/level-status`, {
            method: 'GET',
        });
    },

    // ✅ Mark Level 2 as completed
    completeLevel2: async (conversationId) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating Level 2 completion.");
            return { bothCompleted: true };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/complete-level2`, {
            method: 'POST',
        });
    },

    // ✅ Set Level 2 consent
    setLevel2Consent: async (conversationId, consent) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating Level 2 consent.");
            return { bothConsented: consent };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/set-level2-consent`, {
            method: 'POST',
            body: JSON.stringify({ consent }),
        });
    },

    // ✅ Set Level 3 consent
    setLevel3Consent: async (conversationId, consent) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating Level 3 consent.");
            return { bothConsented: consent };
        }
        
        return authRequest(`/chat/conversations/${conversationId}/set-level3-consent`, {
            method: 'POST',
            body: JSON.stringify({ consent }),
        });
    },

    // Report user
    reportUser: async (reportedUserId, conversationId, reason, description) => {
        if (isMockMode()) {
            console.log("MOCK MODE: Simulating user report.");
            return { 
                success: true, 
                message: 'Thanks for reporting. Our team will review this.',
                reportId: Date.now()
            };
        }
        
        return authRequest('/report-user', {
            method: 'POST',
            body: JSON.stringify({ 
                reportedUserId, 
                conversationId, 
                reason, 
                description 
            }),
        });
    },
};
