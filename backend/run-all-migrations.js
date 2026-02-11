#!/usr/bin/env node
/**
 * Run all database migrations
 * This connects to your production database using credentials from .env
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

const migrations = [
  'migrations/run-sql-migration.js migrations/create-chat-tables.sql',
  'migrations/run-sql-migration.js migrations/create-daily-games.sql',
  'migrations/run-sql-migration.js migrations/create-match-levels.sql',
  'migrations/run-sql-migration.js migrations/add-profile-level-system.sql',
  'migrations/run-sql-migration.js migrations/create-blocks-table.sql',
  'migrations/run-sql-migration.js migrations/create-user-reports-table.sql',
  'migrations/run-sql-migration.js migrations/add-profile-columns.sql',
  'run-daily-games-migration.js'
];

console.log('🚀 Running all database migrations...\n');
console.log('Database:', process.env.DB_HOST);
console.log('Database Name:', process.env.DB_NAME);
console.log('---\n');

let completed = 0;
let failed = 0;

function runMigration(index) {
  if (index >= migrations.length) {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Completed: ${completed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
      console.log('\n✅ All migrations completed successfully!');
      console.log('Your database is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some migrations failed. Check errors above.');
      process.exit(1);
    }
    return;
  }

  const migration = migrations[index];
  console.log(`\n📝 Running: ${migration}`);
  
  exec(`node ${migration}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (stderr) console.log(`   Error: ${stderr}`);
      failed++;
    } else {
      console.log(`   ✅ Success`);
      if (stdout) console.log(stdout.trim());
      completed++;
    }
    
    // Run next migration
    runMigration(index + 1);
  });
}

// Start running migrations
runMigration(0);
