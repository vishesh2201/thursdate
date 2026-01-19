// frontend/src/utils/api/user.js

import { isMockMode, getMockProfile, setMockProfile } from '../mockMode';
import { authRequest } from '../apiClient';

// User Profile API
export const userAPI = {
    // Get user profile (MOCK or LIVE)
    getProfile: async () => {
        // --- MOCK PROFILE INTERCEPTION ---
        if (isMockMode()) {
            const mockProfile = getMockProfile();
            
            // Define the complete structure for a brand new, unapproved user
            const minimalNewUser = {
                // Keep initial approval FALSE to force the waitlist screens
                approval: false, 
                // Critical tracking field for Login routing
                onboardingStage: mockProfile.onboardingStage || 'initial', // 'initial', 'info_complete', 'intent_complete'
                onboardingComplete: mockProfile.onboardingComplete || false,
                
                // These fields will be set to undefined/null if not yet saved
                firstName: mockProfile.firstName, 
                lastName: mockProfile.lastName,

                // Preserve all other saved data
                ...mockProfile,
            };

            // If the mock profile is newly created (empty), save the minimal structure
            if (Object.keys(mockProfile).length === 0 || !mockProfile.onboardingStage) {
                setMockProfile(minimalNewUser);
            }
            
            console.log("MOCK PROFILE: Returning local profile data.", minimalNewUser);
            await new Promise(resolve => setTimeout(resolve, 100));
            return minimalNewUser;
        }
        // ---------------------------------
        
        // LIVE MODE: Proceed with actual backend call
        return authRequest('/user/profile');
    },

    // Save user profile (for onboarding - used by UserInfo.jsx) (MOCK or LIVE)
    saveProfile: async (profileData) => {
        if (isMockMode()) {
            console.log("MOCK PROFILE: Saving UserInfo and setting stage to 'info_complete'.", profileData);
            const currentMock = getMockProfile();
            
            // Critical: Update the stage when UserInfo is submitted
            const updatedProfile = { 
                ...currentMock, 
                ...profileData, 
                onboardingStage: 'info_complete' // Mark UserInfo complete
            };
            
            setMockProfile(updatedProfile);
            await new Promise(resolve => setTimeout(resolve, 100));
            return { message: "Mock profile saved successfully" };
        }
        
        return authRequest('/user/profile', {
            method: 'POST',
            body: JSON.stringify(profileData),
        });
    },

    // Update user profile (used by UserIntent.jsx) (MOCK or LIVE)
    updateProfile: async (profileData) => {
        if (isMockMode()) {
            console.log("MOCK PROFILE: Updating UserIntent and setting final flags.", profileData);
            const currentMock = getMockProfile();
            
            // Critical: Update the final stage when UserIntent is submitted
            const updatedProfile = { 
                ...currentMock, 
                ...profileData, 
                onboardingComplete: true, // FINAL STEP COMPLETE
                onboardingStage: 'intent_complete',
                approval: true, // Auto-approve upon final step completion
            };

            setMockProfile(updatedProfile);
            await new Promise(resolve => setTimeout(resolve, 100));
            return { message: "Mock profile updated successfully" };
        }
        
        return authRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    // Get potential matches
    getPotentialMatches: async () => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty matches array");
            return { candidates: [] };
        }

        return authRequest('/user/matches/potential');
    },

    // Record match action (like or skip)
    recordMatchAction: async (targetUserId, actionType) => {
        if (isMockMode()) {
            console.log(`MOCK MODE: Recording ${actionType} for user ${targetUserId}`);
            return { success: true, action: actionType, isMutualMatch: false };
        }

        return authRequest('/user/matches/action', {
            method: 'POST',
            body: JSON.stringify({ targetUserId, actionType })
        });
    },

    // Get mutual matches
    getMutualMatches: async () => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty mutual matches array");
            return { matches: [] };
        }

        return authRequest('/user/matches/mutual');
    },

    // Get matched profiles (for top "Matched" section - time-limited matches)
    getMatchedProfiles: async () => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty matched profiles array");
            return { matches: [] };
        }

        return authRequest('/user/matches/profiles');
    },

    // Get users who liked you
    getLikesReceived: async () => {
        if (isMockMode()) {
            console.log("MOCK MODE: Returning empty likes received array");
            return { likes: [] };
        }

        return authRequest('/user/matches/likes-received');
    },

    // Get another user's profile by ID (always fetches fresh data from backend)
    // ✅ If conversationId provided, backend filters by visibility level
    getUserProfile: async (userId, conversationId = null) => {
        if (isMockMode()) {
            console.log(`MOCK MODE: Returning mock profile for user ${userId}`);
            // Return a mock profile with proper structure
            return {
                id: userId,
                firstName: "John",
                lastName: "Doe",
                name: "John Doe",
                age: 28,
                gender: "Male",
                currentLocation: "New York, NY",
                profilePicUrl: "/chatperson.png",
                intent: {},
                interests: ["Technology", "Travel", "Photography"],
            };
        }

        const url = conversationId 
            ? `/user/profile/${userId}?conversationId=${conversationId}`
            : `/user/profile/${userId}`;
        
        return authRequest(url);
    },
};
