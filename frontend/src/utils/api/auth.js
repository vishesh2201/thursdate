// frontend/src/utils/api/auth.js

import { API_BASE_URL } from '../config';
import { getToken, setToken, removeToken } from '../tokenManager';
import { 
    ADMIN_EMAIL, 
    ADMIN_PASSWORD, 
    DUMMY_EMAIL, 
    DUMMY_PASSWORD, 
    MOCK_TOKEN_PREFIX, 
    isMockMode,
    MOCK_STORAGE_KEY
} from '../mockMode';
import { authRequest } from '../apiClient';

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

    // Send Email OTP
    sendEmailOTP: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/send-email-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send OTP');
        }

        const data = await response.json();
        return data;
    },

    // Verify Email OTP
    verifyEmailOTP: async (email, otp) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Invalid OTP');
        }

        const data = await response.json();
        
        // Store token if returned (auto-login after OTP verification)
        if (data.token) {
            setToken(data.token);
        }
        
        return data;
    },

    // Resend Email OTP
    resendEmailOTP: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/resend-email-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to resend OTP');
        }

        const data = await response.json();
        return data;
    },
};
