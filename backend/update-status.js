const pool = require('./config/db');

async function updateStatus() {
  try {
    const [result] = await pool.execute(
      'UPDATE messages SET status = "SENT" WHERE status IS NULL'
    );
    console.log('✅ Updated', result.affectedRows, 'messages with NULL status to SENT');
    
    // Also update any empty strings
    const [result2] = await pool.execute(
      'UPDATE messages SET status = "SENT" WHERE status = ""'
    );
    console.log('✅ Updated', result2.affectedRows, 'messages with empty status to SENT');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStatus();
