// frontend/src/utils/api/upload.js

import { API_BASE_URL } from '../config';
import { getToken } from '../tokenManager';
import { isMockMode } from '../mockMode';

// Image Upload API
export const uploadAPI = {
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

    // Upload face photo (MOCK or LIVE)
    uploadFacePhoto: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating face photo upload.");
            // ✅ FIX: Use placeholder images instead of blob URLs
            // Blob URLs don't work when viewed by other users or after refresh
            const placeholders = [
                'https://randomuser.me/api/portraits/men/1.jpg',
                'https://randomuser.me/api/portraits/men/2.jpg',
                'https://randomuser.me/api/portraits/men/3.jpg',
                'https://randomuser.me/api/portraits/women/1.jpg',
                'https://randomuser.me/api/portraits/women/2.jpg',
                'https://randomuser.me/api/portraits/women/3.jpg',
            ];
            const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: randomPlaceholder };
        }

        // LIVE MODE: Proceed with actual backend call
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/face-photo`, {
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

    // Verify and upload profile photo (compares with reference face photo)
    uploadProfilePhotoVerify: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating profile photo verification.");
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            return { url: tempUrl, faceVerification: true, similarity: 95.5 };
        }

        // LIVE MODE: Proceed with actual backend call
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/profile-photo-verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Verification failed');
        }

        return response.json();
    },
};
