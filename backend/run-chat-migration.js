// Run this script to create the chat system database tables
// Usage: node run-chat-migration.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection (matching db.js config)
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true,
      charset: "utf8mb4"
    };

    // Add SSL if using Aiven or other cloud database
    if (process.env.DB_SSL_CA) {
      try {
        const caPath = path.join(__dirname, 'config', 'ca.pem');
        if (fs.existsSync(caPath)) {
          config.ssl = {
            ca: fs.readFileSync(caPath)
          };
          console.log('Using SSL connection');
        }
      } catch (sslError) {
        console.log('SSL cert not found, using non-SSL connection');
      }
    }

    connection = await mysql.createConnection(config);

    console.log('✅ Connected to database');

    // Read the migration SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'create-chat-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running chat system migration...');

    // Split SQL into individual statements to avoid execution issues
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt && !stmt.startsWith('--')) {
        try {
          await connection.query(stmt);
          console.log(`  Step ${i + 1}/${statements.length} completed`);
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
            console.log(`  Step ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Chat system tables created successfully!');
    console.log('   - conversations table created');
    console.log('   - messages table created');
    console.log('   - user_conversations view created');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runMigration();
