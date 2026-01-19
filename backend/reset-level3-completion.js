const pool = require('./config/db');

async function resetLevel3Completion() {
  try {
    // Reset level3_questions_completed to FALSE for all users
    const [result] = await pool.execute(
      'UPDATE users SET level3_questions_completed = FALSE WHERE level3_questions_completed = TRUE'
    );
    
    console.log(`✓ Reset Level 3 completion for ${result.affectedRows} users`);
    console.log('Level 3 will now be marked complete only when users upload face photos');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetLevel3Completion();
