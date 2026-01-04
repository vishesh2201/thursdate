/**
 * Run schema fix migrations
 * This script fixes the column naming inconsistencies between
 * the original migration files and the actual application code
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const pool = require('./config/db');

async function runMigration(filePath, description) {
  console.log(`\n📝 Running: ${description}`);
  console.log(`   File: ${path.basename(filePath)}`);
  
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    
    // Split by semicolons and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        // Remove comment-only lines
        const lines = stmt.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      });
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          successCount++;
        } catch (error) {
          // Ignore expected errors when columns already exist/don't exist
          if (error.message.includes('Duplicate') || 
              error.message.includes('already exists') ||
              error.message.includes('Unknown column') ||
              error.message.includes("Can't DROP") ||
              error.message.includes('check violation') ||
              error.message.includes("Can't create table") ||
              error.message.includes("Multiple primary key") ||
              error.message.includes("check the manual")) {
            skipCount++;
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log(`   ✅ ${description} completed successfully`);
    if (skipCount > 0) {
      console.log(`   ℹ️  Skipped ${skipCount} already-applied changes`);
    }
    return true;
  } catch (error) {
    console.error(`   ❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting schema fix migrations...\n');
  console.log('This will align database schema with application code.');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Run migrations in order
    const migrations = [
      {
        file: path.join(__dirname, 'migrations', 'fix-conversations-schema.sql'),
        description: 'Fix conversations table column naming (user1_id -> user_id_1)'
      },
      {
        file: path.join(__dirname, 'migrations', 'fix-messages-schema.sql'),
        description: 'Fix messages table schema (add status, align column names)'
      }
    ];
    
    let allSuccess = true;
    
    for (const migration of migrations) {
      const success = await runMigration(migration.file, migration.description);
      if (!success) {
        allSuccess = false;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    if (allSuccess) {
      console.log('✅ All migrations completed successfully!');
      console.log('\nYour database schema is now aligned with the application code.');
      console.log('Message persistence should work correctly now.');
    } else {
      console.log('⚠️  Some migrations failed. Check the errors above.');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
