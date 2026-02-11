// backend/routes/reports.js
// Purpose: Handle user reports for admin moderation

const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Submit a report
router.post('/report-user', auth, async (req, res) => {
  try {
    const reporterId = req.user.userId;
    const { reportedUserId, conversationId, reason, description } = req.body;

    // Validation
    if (!reportedUserId || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'reportedUserId and reason are required' 
      });
    }

    // Prevent self-reporting
    if (parseInt(reportedUserId) === reporterId) {
      return res.status(400).json({ 
        error: 'Cannot report yourself' 
      });
    }

    // Validate reason
    const validReasons = [
      'inappropriate_messages',
      'fake_profile',
      'harassment',
      'spam',
      'other'
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ 
        error: 'Invalid reason',
        validReasons 
      });
    }

    // Validate description length
    if (description && description.length > 500) {
      return res.status(400).json({ 
        error: 'Description too long',
        maxLength: 500 
      });
    }

    // Check if reported user exists
    const [reportedUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [reportedUserId]
    );
    if (reportedUser.length === 0) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Verify conversation exists if provided
    if (conversationId) {
      const [conversation] = await pool.execute(
        `SELECT id FROM conversations 
         WHERE id = ? 
         AND (user_id_1 = ? OR user_id_2 = ?)
         AND (user_id_1 = ? OR user_id_2 = ?)`,
        [conversationId, reporterId, reporterId, reportedUserId, reportedUserId]
      );
      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found or invalid' });
      }
    }

    // Check for duplicate reports within 24 hours
    const [existingReports] = await pool.execute(
      `SELECT id FROM user_reports 
       WHERE reported_user_id = ? 
       AND reported_by_user_id = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [reportedUserId, reporterId]
    );
    
    if (existingReports.length > 0) {
      return res.status(429).json({ 
        error: 'You have already reported this user recently',
        retryAfter: '24 hours'
      });
    }

    // Insert report
    const [result] = await pool.execute(
      `INSERT INTO user_reports 
       (reported_user_id, reported_by_user_id, conversation_id, reason, description) 
       VALUES (?, ?, ?, ?, ?)`,
      [reportedUserId, reporterId, conversationId || null, reason, description || null]
    );

    console.log('Report submitted:', {
      reportId: result.insertId,
      reportedUserId,
      reporterId,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Thanks for reporting. Our team will review this.',
      reportId: result.insertId
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ 
      error: 'Failed to submit report',
      details: error.message 
    });
  }
});

module.exports = router;
