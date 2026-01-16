/**
 * Debug Script: Check User Existence and Profile Route
 * This script verifies if the user exists and the route is working
 */

const pool = require('./config/db');

async function debugUser() {
  console.log('🔍 Debugging user ID 22...\n');
  
  try {
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, first_name, last_name, email, approval FROM users WHERE id = ?',
      [22]
    );
    
    if (users.length === 0) {
      console.log('❌ User ID 22 does NOT exist in database');
    } else {
      const user = users[0];
      console.log('✅ User ID 22 found:');
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Approved: ${user.approval ? 'YES' : 'NO'}`);
      
      if (!user.approval) {
        console.log('\n⚠️  WARNING: User is NOT approved!');
        console.log('   The profile endpoint requires approval = true');
      }
    }
    
    // Check total users
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM users');
    console.log(`\n📊 Total users in database: ${count[0].total}`);
    
    // List all users
    const [allUsers] = await pool.execute(
      'SELECT id, first_name, last_name, approval FROM users ORDER BY id'
    );
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log(`   ID ${u.id}: ${u.first_name} ${u.last_name} (${u.approval ? 'Approved' : 'Not approved'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugUser()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  });
