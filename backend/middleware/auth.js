const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - checking token');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both userId (from email/password login) and linkedinId (from LinkedIn login)
    // For backward compatibility, if userId is not present, we need to look it up
    if (!decoded.userId && decoded.linkedinId && decoded.email) {
      console.log('Token has linkedinId but no userId, looking up in database...');
      const pool = require('../config/db');
      try {
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [decoded.email]);
        if (users.length > 0) {
          decoded.userId = users[0].id;
          console.log('Found userId from email:', decoded.userId);
        } else {
          console.log('No user found for email:', decoded.email);
          return res.status(401).json({ error: 'User not found. Please log in again.' });
        }
      } catch (dbError) {
        console.error('Database error during userId lookup:', dbError);
        return res.status(500).json({ error: 'Internal server error.' });
      }
    }
    
    console.log('Token verified, user ID:', decoded.userId);
    
    if (!decoded.userId) {
      console.log('No userId in token');
      return res.status(401).json({ error: 'Invalid token format. Please log in again.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth; 