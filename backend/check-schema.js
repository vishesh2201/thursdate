const pool = require('./config/db');

async function checkSchema() {
  try {
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM messages WHERE Field = 'status'"
    );
    console.log('Status column:', columns);
    
    const [sample] = await pool.execute(
      'SELECT id, type, status, created_at FROM messages LIMIT 5'
    );
    console.log('\nSample messages:', sample);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
