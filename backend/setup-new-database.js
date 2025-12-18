const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// New database configuration (from .env)
const newDbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  multipleStatements: true
};

async function setupNewDatabase() {
  let connection;
  
  try {
    console.log('🚀 Setting up new database...\n');
    console.log('🔌 Connecting to new database...');
    connection = await mysql.createConnection(newDbConfig);
    console.log('✅ Connected to new database');
    
    // Read and execute the database.sql file
    const sqlFilePath = path.join(__dirname, 'database.sql');
    console.log('\n📄 Reading database schema from database.sql...');
    
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log('✅ Schema file loaded');
    
    console.log('\n🔨 Creating database schema...');
    
    // Split SQL commands and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        try {
          await connection.query(statement);
        } catch (error) {
          // Ignore errors for DROP TABLE IF EXISTS and USE statements
          if (!error.message.includes('Unknown database') && 
              !error.message.includes('doesn\'t exist')) {
            console.log(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database schema created successfully');
    
    // Verify tables were created
    console.log('\n🔍 Verifying database setup...');
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [newDbConfig.database]
    );
    
    console.log(`\n📋 Found ${tables.length} tables:`);
    for (const tableInfo of tables) {
      const tableName = tableInfo.TABLE_NAME;
      const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult[0].count;
      console.log(`   ✓ ${tableName}: ${rowCount} rows`);
    }
    
    console.log('\n✅ New database is ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. If you have a SQL dump from the old database, you can import it');
    console.log('   2. Or start using the new database with your application');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

setupNewDatabase()
  .then(() => {
    console.log('\n✨ Setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
