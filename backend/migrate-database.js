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

async function migrateDatabase() {
  let oldConnection;
  let newConnection;

  try {
    console.log('🔌 Connecting to old database...');
    oldConnection = await mysql.createConnection(oldDbConfig);
    console.log('✅ Connected to old database');

    console.log('🔌 Connecting to new database...');
    newConnection = await mysql.createConnection(newDbConfig);
    console.log('✅ Connected to new database');

    // Get list of all tables from old database
    const [tables] = await oldConnection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [oldDbConfig.database]
    );

    console.log(`\n📋 Found ${tables.length} tables to migrate:`);
    tables.forEach(table => console.log(`   - ${table.TABLE_NAME}`));

    // Disable foreign key checks in new database
    await newConnection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableInfo of tables) {
      const tableName = tableInfo.TABLE_NAME;
      console.log(`\n📦 Migrating table: ${tableName}`);

      try {
        // Get table structure from old database
        const [createTableResult] = await oldConnection.query(`SHOW CREATE TABLE ${tableName}`);
        const createTableSQL = createTableResult[0]['Create Table'];

        // Check if table exists in new database
        const [existingTables] = await newConnection.query(
          'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
          [newDbConfig.database, tableName]
        );

        if (existingTables.length === 0) {
          // Create table in new database
          console.log(`   ➕ Creating table ${tableName}...`);
          await newConnection.query(createTableSQL);
          console.log(`   ✅ Table ${tableName} created`);
        } else {
          console.log(`   ℹ️  Table ${tableName} already exists, skipping creation`);
        }

        // Get row count
        const [countResult] = await oldConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = countResult[0].count;
        console.log(`   📊 Found ${rowCount} rows to migrate`);

        if (rowCount === 0) {
          console.log(`   ⏭️  No data to migrate for ${tableName}`);
          continue;
        }

        // Fetch all data from old database
        const [rows] = await oldConnection.query(`SELECT * FROM ${tableName}`);

        if (rows.length > 0) {
          // Get column names
          const columns = Object.keys(rows[0]);
          const columnNames = columns.join(', ');
          const placeholders = columns.map(() => '?').join(', ');

          // Clear existing data in new database table (optional - comment out if you want to preserve existing data)
          console.log(`   🗑️  Clearing existing data in ${tableName}...`);
          await newConnection.query(`DELETE FROM ${tableName}`);

          // Insert data in batches
          const batchSize = 100;
          let insertedCount = 0;

          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const values = batch.map(row => columns.map(col => row[col]));

            const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES ${batch.map(() => `(${placeholders})`).join(', ')}`;
            const flatValues = values.flat();

            await newConnection.query(insertSQL, flatValues);
            insertedCount += batch.length;
            console.log(`   ⏳ Migrated ${insertedCount}/${rowCount} rows...`);
          }

          console.log(`   ✅ Successfully migrated ${insertedCount} rows to ${tableName}`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating table ${tableName}:`, error.message);
        // Continue with next table even if one fails
      }
    }

    // Re-enable foreign key checks
    await newConnection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   Total tables processed: ${tables.length}`);

    // Verify migration by checking row counts
    console.log('\n🔍 Verifying migration...');
    for (const tableInfo of tables) {
      const tableName = tableInfo.TABLE_NAME;
      try {
        const [oldCount] = await oldConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const [newCount] = await newConnection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        
        const oldRows = oldCount[0].count;
        const newRows = newCount[0].count;
        const status = oldRows === newRows ? '✅' : '⚠️';
        
        console.log(`   ${status} ${tableName}: ${oldRows} → ${newRows} rows`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: Could not verify`);
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (oldConnection) {
      await oldConnection.end();
      console.log('\n🔌 Disconnected from old database');
    }
    if (newConnection) {
      await newConnection.end();
      console.log('🔌 Disconnected from new database');
    }
  }
}

// Run migration
console.log('🚀 Starting database migration...\n');
migrateDatabase()
  .then(() => {
    console.log('\n✅ All done! Your data has been migrated to the new database.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
