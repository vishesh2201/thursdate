const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, defaultValue = null) => {
  if (!jsonString) return defaultValue;
  try {
    if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
    }
    return jsonString;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

// Helper function to validate database connection
const validateConnection = async () => {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection validation failed:', error);
    return false;
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@luyona.com'];
        if (!adminEmails.includes(users[0].email)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Centralized, null-safe data transformation function
const transformUser = (user) => {
    const intent = safeJsonParse(user.intent, {});
    const dobDate = user.dob ? new Date(user.dob) : null;
    
    return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        gender: user.gender || null,
        dob: user.dob || null,
        currentLocation: user.current_location || null,
        profilePicUrl: user.profile_pic_url || null,
        intent: intent,
        onboardingComplete: !!user.onboarding_complete,
        approval: !!user.approval, 
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        age: dobDate ? Math.floor((new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        hasProfilePic: !!user.profile_pic_url,
        hasLifestyleImages: intent && intent.lifestyleImageUrls && intent.lifestyleImageUrls.filter(Boolean).length > 0,
        lifestyleImageCount: intent && intent.lifestyleImageUrls ? intent.lifestyleImageUrls.filter(Boolean).length : 0
    };
};

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    const transformedUsers = users.map(transformUser);

    res.json({
      users: transformedUsers,
      total: transformedUsers.length,
      approved: transformedUsers.filter(u => u.approval).length,
      pending: transformedUsers.filter(u => !u.approval).length,
      completedOnboarding: transformedUsers.filter(u => u.onboardingComplete).length
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get waitlisted users (users not yet approved)
router.get('/waitlist', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      WHERE approval = false
      ORDER BY created_at ASC
    `);

    const transformedUsers = users.map(transformUser);

    res.json({
      users: transformedUsers,
      total: transformedUsers.length
    });

  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Approve or reject a user
router.put('/users/:userId/approval', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { userId } = req.params;
    const { approval, reason } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute(
      'UPDATE users SET approval = ? WHERE id = ?',
      [approval, userId]
    );

    res.json({ 
      message: `User ${approval ? 'approved' : 'rejected'} successfully`,
      userId: userId,
      approval: approval
    });

  } catch (error) {
    console.error('Update approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get user details (admin only)
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { userId } = req.params;

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, favourite_travel_destination, last_holiday_places, 
        favourite_places_to_go, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    const transformedUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        gender: user.gender || null,
        dob: user.dob || null,
        currentLocation: user.current_location || null,
        favouriteTravelDestination: safeJsonParse(user.favourite_travel_destination, []),
        lastHolidayPlaces: user.last_holiday_places || null,
        favouritePlacesToGo: safeJsonParse(user.favourite_places_to_go, []),
        intent: safeJsonParse(user.intent, {}),
        profilePicUrl: user.profile_pic_url || null,
        onboardingComplete: !!user.onboarding_complete,
        approval: !!user.approval,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        age: user.dob ? Math.floor((new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    };

    res.json(transformedUser);

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get admin dashboard statistics
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalResult[0].total;

    const [approvedResult] = await pool.execute('SELECT COUNT(*) as approved FROM users WHERE approval = true');
    const approvedUsers = approvedResult[0].approved;

    const [pendingResult] = await pool.execute('SELECT COUNT(*) as pending FROM users WHERE approval = false');
    const pendingUsers = pendingResult[0].pending;

    const [onboardingResult] = await pool.execute('SELECT COUNT(*) as completed FROM users WHERE onboarding_complete = true');
    const completedOnboarding = onboardingResult[0].completed;

    const [profilePicResult] = await pool.execute('SELECT COUNT(*) as withPic FROM users WHERE profile_pic_url IS NOT NULL');
    const usersWithProfilePic = profilePicResult[0].withPic;

    const [recentResult] = await pool.execute(`
      SELECT COUNT(*) as recent FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    const recentRegistrations = recentResult[0].recent;

    const stats = {
      totalUsers,
      approvedUsers,
      pendingUsers,
      completedOnboarding,
      usersWithProfilePic,
      recentRegistrations,
      approvalRate: totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ========================================
// REPORT MANAGEMENT ROUTES (ADMIN ONLY)
// ========================================

// Get all reports with full context
router.get('/reports', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { status } = req.query;

    let query = `
      SELECT 
        r.id,
        r.reported_user_id,
        r.reported_by_user_id,
        r.conversation_id,
        r.reason,
        r.description,
        r.status,
        r.admin_notes,
        r.created_at,
        r.reviewed_at,
        r.reviewed_by,
        ru.first_name as reported_first_name,
        ru.last_name as reported_last_name,
        ru.email as reported_email,
        ru.profile_pic_url as reported_profile_pic,
        rbu.first_name as reporter_first_name,
        rbu.last_name as reporter_last_name,
        rbu.email as reporter_email,
        (SELECT COUNT(*) FROM user_reports WHERE reported_user_id = r.reported_user_id) as total_reports_against_user
      FROM user_reports r
      JOIN users ru ON r.reported_user_id = ru.id
      JOIN users rbu ON r.reported_by_user_id = rbu.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reports] = await pool.execute(query, params);

    // Format response
    const formattedReports = reports.map(report => ({
      id: report.id,
      reportedUser: {
        id: report.reported_user_id,
        firstName: report.reported_first_name,
        lastName: report.reported_last_name,
        email: report.reported_email,
        profilePicUrl: report.reported_profile_pic
      },
      reportedBy: {
        id: report.reported_by_user_id,
        firstName: report.reporter_first_name,
        lastName: report.reporter_last_name,
        email: report.reporter_email
      },
      conversationId: report.conversation_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      adminNotes: report.admin_notes,
      createdAt: report.created_at,
      reviewedAt: report.reviewed_at,
      reviewedBy: report.reviewed_by,
      totalReportsAgainstUser: report.total_reports_against_user
    }));

    res.json({
      reports: formattedReports,
      total: formattedReports.length,
      pending: formattedReports.filter(r => r.status === 'pending').length,
      reviewed: formattedReports.filter(r => r.status === 'reviewed').length,
      actionTaken: formattedReports.filter(r => r.status === 'action_taken').length
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get detailed report with conversation messages
router.get('/reports/:reportId', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { reportId } = req.params;

    // Get report details
    const [reports] = await pool.execute(
      `SELECT 
        r.id,
        r.reported_user_id,
        r.reported_by_user_id,
        r.conversation_id,
        r.reason,
        r.description,
        r.status,
        r.admin_notes,
        r.created_at,
        r.reviewed_at,
        r.reviewed_by,
        ru.first_name as reported_first_name,
        ru.last_name as reported_last_name,
        ru.email as reported_email,
        ru.profile_pic_url as reported_profile_pic,
        ru.gender as reported_gender,
        ru.dob as reported_dob,
        ru.current_location as reported_location,
        rbu.first_name as reporter_first_name,
        rbu.last_name as reporter_last_name,
        rbu.email as reporter_email,
        rbu.profile_pic_url as reporter_profile_pic
      FROM user_reports r
      JOIN users ru ON r.reported_user_id = ru.id
      JOIN users rbu ON r.reported_by_user_id = rbu.id
      WHERE r.id = ?`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    // Get conversation messages if conversation exists
    let messages = [];
    if (report.conversation_id) {
      const [msgs] = await pool.execute(
        `SELECT 
          m.id, m.sender_id, m.content, m.type, m.status, m.created_at,
          u.first_name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         AND m.deleted_for_sender = FALSE
         AND m.deleted_for_recipient = FALSE
         ORDER BY m.created_at DESC
         LIMIT 50`,
        [report.conversation_id]
      );
      messages = msgs;
    }

    // Get previous reports on same user
    const [previousReports] = await pool.execute(
      `SELECT 
        id, reason, created_at, status
       FROM user_reports
       WHERE reported_user_id = ? AND id != ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [report.reported_user_id, reportId]
    );

    // Get total report count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_reports WHERE reported_user_id = ?',
      [report.reported_user_id]
    );

    res.json({
      report: {
        id: report.id,
        reportedUser: {
          id: report.reported_user_id,
          firstName: report.reported_first_name,
          lastName: report.reported_last_name,
          email: report.reported_email,
          profilePicUrl: report.reported_profile_pic,
          gender: report.reported_gender,
          dob: report.reported_dob,
          location: report.reported_location
        },
        reportedBy: {
          id: report.reported_by_user_id,
          firstName: report.reporter_first_name,
          lastName: report.reporter_last_name,
          email: report.reporter_email,
          profilePicUrl: report.reporter_profile_pic
        },
        conversationId: report.conversation_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        adminNotes: report.admin_notes,
        createdAt: report.created_at,
        reviewedAt: report.reviewed_at,
        reviewedBy: report.reviewed_by
      },
      messages: messages.reverse(), // Show oldest first
      previousReports,
      totalReportsAgainstUser: countResult[0].total
    });

  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Update report status (mark as reviewed or action taken)
router.put('/reports/:reportId', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.userId;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'action_taken'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Check if report exists
    const [reports] = await pool.execute(
      'SELECT id FROM user_reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update report
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status !== 'pending') {
        updates.push('reviewed_at = NOW()');
        updates.push('reviewed_by = ?');
        params.push(adminId);
      }
    }

    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(adminNotes);
    }

    params.push(reportId);

    await pool.execute(
      `UPDATE user_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    console.log('Report updated:', {
      reportId,
      status,
      adminId
    });

    res.json({
      success: true,
      message: 'Report updated successfully'
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

module.exports = router;
