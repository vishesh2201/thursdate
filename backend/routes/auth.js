const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Registration attempt for:', email);
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with default approval and onboarding status set to false
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, false, false]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      userId: result.insertId
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Valid mobile number is required' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5 minute expiry
    otpStore.set(mobileNumber, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    // In production, send SMS via Twilio/AWS SNS
    console.log(`OTP for ${mobileNumber}: ${otp}`);
    
    // For development, return OTP in response (remove in production)
    res.json({
      message: 'OTP sent successfully',
      // Remove this line in production:
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    
    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }
    
    const storedData = otpStore.get(mobileNumber);
    
    if (!storedData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }
    
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(mobileNumber);
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // OTP verified successfully, remove from store
    otpStore.delete(mobileNumber);
    
    res.json({
      message: 'OTP verified successfully',
      verified: true
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Delete account endpoint
router.delete('/account', auth, async (req, res) => {
  try {
    // Delete user from database
    await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
