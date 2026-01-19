const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runBlocksMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-blocks-table.sql');
    const sql = await fs.readFile(sqlFile, 'utf8');

    // Execute the SQL
    console.log('Running blocks table migration...');
    await connection.query(sql);
    console.log('✓ Blocks table created successfully');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runBlocksMigration();
