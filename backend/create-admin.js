// backend/create-admin.js
require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n🔐 Admin Account Setup\n');
  
  try {
    // Get admin emails from env
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    console.log('Available admin emails:');
    adminEmails.forEach((email, i) => {
      console.log(`  ${i + 1}. ${email.trim()}`);
    });
    
    const email = await question('\nEnter admin email: ');
    const password = await question('Enter password: ');
    
    if (!email || !password) {
      console.log('❌ Email and password are required');
      rl.close();
      await pool.end();
      return;
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (existingUsers.length > 0) {
      // Update existing user's password
      await pool.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      console.log(`\n✅ Password updated for ${email}`);
    } else {
      // Create new admin user
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, true, true]
      );
      console.log(`\n✅ Admin account created for ${email} (ID: ${result.insertId})`);
    }
    
    console.log('\n✅ You can now login at /admin-login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
