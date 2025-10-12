// backend/setup-admin.js
require('dotenv').config();
const pool = require('./config/db');

async function setupAdmin() {
  console.log('🔧 Setting up admin access...\n');
  
  try {
    // Check current admin emails
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@luyona.com'];
    console.log('Current admin emails:', adminEmails);
    
    // Get all users
    const [users] = await pool.execute('SELECT id, email FROM users');
    console.log('\nAvailable users:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}`);
    });
    
    // Check if any existing users are admins
    const adminUsers = users.filter(user => adminEmails.includes(user.email));
    console.log('\nCurrent admin users:');
    if (adminUsers.length > 0) {
      adminUsers.forEach(user => {
        console.log(`  ✅ ${user.email} (ID: ${user.id})`);
      });
    } else {
      console.log('  ❌ No admin users found');
    }
    
    // Suggest setup
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n💡 To make ${firstUser.email} an admin, add this to your .env file:`);
      console.log(`ADMIN_EMAILS=${firstUser.email}`);
      
      // Also suggest adding the user we saw in the diagnosis
      if (firstUser.email !== 'arjundeshmukh26@gmail.com') {
        console.log(`\n💡 Or to make arjundeshmukh26@gmail.com an admin:`);
        console.log(`ADMIN_EMAILS=arjundeshmukh26@gmail.com`);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
    console.log('\n🔧 Admin setup check complete');
  }
}

setupAdmin();