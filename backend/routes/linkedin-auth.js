const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

// LinkedIn OAuth endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Initiate OAuth flow
router.get('/linkedin', (req, res) => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        scope: 'openid profile email'
    });
    
    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
});

// OAuth callback handler
router.get('/linkedin/callback', async (req, res) => {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (error) {
        console.error('LinkedIn OAuth error:', error);
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_auth_failed`);
    }
    
    if (!code) {
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_no_code`);
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, null, {
            params: {
                grant_type: 'authorization_code',
                code: code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: process.env.LINKEDIN_CALLBACK_URL
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        console.log('LinkedIn access token received');
        
        // Fetch user info using OpenID Connect userinfo endpoint
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        const userInfo = userInfoResponse.data;
        console.log('LinkedIn user info:', JSON.stringify(userInfo, null, 2));
        
        // Extract profile URL (LinkedIn provides this in the userinfo response)
        const profileUrl = userInfo.sub ? `https://www.linkedin.com/in/${userInfo.sub}` : '';
        
        // Find or create user in database
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [userInfo.email]
        );
        
        let userId;
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            // Update LinkedIn info for existing user
            await pool.execute(
                'UPDATE users SET linkedin = ? WHERE id = ?',
                [profileUrl, userId]
            );
        } else {
            // Create new user
            const [result] = await pool.execute(
                'INSERT INTO users (email, linkedin, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
                [userInfo.email, profileUrl, false, false]
            );
            userId = result.insertId;
        }
        
        // Generate JWT token for your app with userId
        const token = jwt.sign(
            { 
                userId: userId,
                linkedinId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                linkedinVerified: true 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        // Redirect back to frontend with success
        res.redirect(`${frontendUrl}/social-presence?linkedin_verified=true&token=${token}&linkedin_url=${encodeURIComponent(profileUrl)}`);
    } catch (error) {
        console.error('LinkedIn callback error:', error.response?.data || error.message);
        res.redirect(`${frontendUrl}/social-presence?error=linkedin_callback_failed`);
    }
});

module.exports = router;
