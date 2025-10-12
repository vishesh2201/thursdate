// frontend/src/utils/api.js

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
console.log("API_BASE_URL set to:", import.meta.env.VITE_BACKEND_API_URL);


// --- MOCK CONSTANTS & HELPERS ---
const DUMMY_EMAIL = "sanwari.nair@gmail.com";
const DUMMY_PASSWORD = "frick123";

// ADDED: MOCK ADMIN CREDENTIALS FOR ADMIN LOGIN TESTING
const ADMIN_EMAIL = "admin@luyona.com";
const ADMIN_PASSWORD = "adminpassword"; // Use a unique mock password

const MOCK_TOKEN_PREFIX = "MOCK_SANWARI_"; // Unique prefix for the mock token
const MOCK_STORAGE_KEY = 'mockUserProfile';

const isMockMode = () => {
    const token = getToken();
    return token && token.startsWith(MOCK_TOKEN_PREFIX);
};

const getMockProfile = () => {
    const json = localStorage.getItem(MOCK_STORAGE_KEY);
    return json ? JSON.parse(json) : {};
};

const setMockProfile = (profile) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(profile));
};
// ---------------------------------


// Helper function to get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function to set auth token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Helper function to remove auth token from localStorage
const removeToken = () => {
    localStorage.removeItem('token');
    // We keep mockUserProfile, as we want to preserve the offline progress.
};

// Helper function to make authenticated requests
const authRequest = async (url, options = {}) => {
    if (isMockMode()) {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found (Mock Mode)');
        }
        return {}; 
    }
    
    // LIVE MODE: Proceed with actual backend call
    const token = getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': options.method === 'POST' && options.body instanceof FormData ? undefined : 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// Authentication API
export const authAPI = {
    // Register new user (LIVE MODE ONLY)
    register: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await response.json();
        setToken(data.token);
        return data;
    },

    // Login user (MOCK or LIVE)
    login: async (email, password) => {
        // --- MOCK ADMIN LOGIN INTERCEPTION (New) ---
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            console.warn("MOCK ADMIN LOGIN: Bypassing backend for mock admin account.");
            const mockToken = MOCK_TOKEN_PREFIX + 'ADMIN_' + Date.now();
            setToken(mockToken);
            return { message: "Mock Admin Login Success", token: mockToken };
        }
        // -------------------------------------------

        // --- MOCK USER LOGIN INTERCEPTION (Existing) ---
        if (email === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
            console.warn("MOCK LOGIN: Bypassing backend for dummy account.");
            const mockToken = MOCK_TOKEN_PREFIX + Date.now();
            setToken(mockToken);
            return { message: "Mock Login Success", token: mockToken };
        }
        // --------------------------------

        // LIVE MODE: Proceed with actual backend call
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        setToken(data.token);
        return data;
    },

    // Logout user
    logout: () => {
        removeToken();
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!getToken();
    },

    // Delete account
    deleteAccount: async () => {
        // Mock mode: simply clear data and log out
        if (isMockMode()) {
            localStorage.removeItem(MOCK_STORAGE_KEY);
            removeToken();
            return { message: "Mock account deleted." };
        }
        
        return authRequest('/auth/account', {
            method: 'DELETE',
        });
    },
};

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
};

// Admin API (LIVE MODE ONLY)
export const adminAPI = {
    // ... (rest of adminAPI remains the same)
    getAllUsers: async () => {
        return authRequest('/admin/users');
    },

    // Get waitlisted users
    getWaitlist: async () => {
        return authRequest('/admin/waitlist');
    },

    // Get user details
    getUserDetails: async (userId) => {
        return authRequest(`/admin/users/${userId}`);
    },

    // Approve/Reject user
    updateUserApproval: async (userId, approval, reason = '') => {
        return authRequest(`/admin/users/${userId}/approval`, {
            method: 'PUT',
            body: JSON.stringify({ approval, reason }),
        });
    },

    // Get dashboard stats
    getDashboardStats: async () => {
        return authRequest('/admin/dashboard');
    },
};

// Image Upload API
export const uploadAPI = {
    // ... (uploadProfilePicture and uploadLifestyleImage remain the same)
    // Upload profile picture (MOCK or LIVE)
    uploadProfilePicture: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating profile picture upload.");
            // Generate a temporary mock URL to allow the frontend to display the image.
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: tempUrl };
        }

        // LIVE MODE: Proceed with actual backend call
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },

    // Upload lifestyle image (MOCK or LIVE)
    uploadLifestyleImage: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating lifestyle image upload.");
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: tempUrl };
        }

        // LIVE MODE: Proceed with actual backend call
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/lifestyle-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },
};