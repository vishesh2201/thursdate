const mysql = require('mysql2/promise');
require('dotenv').config();

// Old database configuration (if migrating from old DB)
const oldDbConfig = {
  host: process.env.OLD_DB_HOST || 'old-db-host',
  user: process.env.OLD_DB_USER || 'avnadmin',
  password: process.env.OLD_DB_PASSWORD,
  database: process.env.OLD_DB_NAME || 'defaultdb',
  port: parseInt(process.env.OLD_DB_PORT) || 23616,
  ssl: {
    rejectUnauthorized: false
  }
};

// New database configuration
const newDbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false
  }
};

async function testConnection(config, name) {
  console.log(`\n🔌 Testing connection to ${name}...`);
  try {
    const connection = await mysql.createConnection(config);
    console.log(`✅ Successfully connected to ${name}`);
    
    // Get database info
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [config.database]
    );
    
    console.log(`📋 Found ${tables.length} tables:`);
    
    for (const tableInfo of tables) {
      const tableName = tableInfo.TABLE_NAME;
      const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult[0].count;
      console.log(`   - ${tableName}: ${rowCount} rows`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error(`❌ Failed to connect to ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Database Connection Test');
  console.log('============================');
  
  const oldDbConnected = await testConnection(oldDbConfig, 'OLD DATABASE');
  const newDbConnected = await testConnection(newDbConfig, 'NEW DATABASE');
  
  console.log('\n📊 Summary:');
  console.log(`   Old Database: ${oldDbConnected ? '✅ Connected' : '❌ Not accessible'}`);
  console.log(`   New Database: ${newDbConnected ? '✅ Connected' : '❌ Not accessible'}`);
  
  if (!oldDbConnected) {
    console.log('\n⚠️  Warning: Old database is not accessible.');
    console.log('   This could mean:');
    console.log('   1. The database has been decommissioned');
    console.log('   2. Network connectivity issues');
    console.log('   3. Incorrect credentials or hostname');
    console.log('\n💡 If the old database is no longer accessible and you have:');
    console.log('   - A SQL dump file, you can import it directly');
    console.log('   - Already migrated data, you can proceed with the new database');
  }
  
  if (!newDbConnected) {
    console.log('\n⚠️  Warning: New database is not accessible.');
    console.log('   Please check the credentials and network connectivity.');
  }
  
  if (oldDbConnected && newDbConnected) {
    console.log('\n✅ Both databases are accessible!');
    console.log('💡 You can now run: node migrate-database.js');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
