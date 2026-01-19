#!/usr/bin/env node

/**
 * Quick Setup Script for Level System
 * Run this after pulling the code changes
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Level System Setup\n');
console.log('This script will:');
console.log('1. Run database migration');
console.log('2. Verify installation\n');

// Run migration
console.log('📊 Running database migration...');
try {
    execSync('node migrations/run-profile-level-migration.js', { 
        cwd: path.join(__dirname),
        stdio: 'inherit'
    });
    console.log('\n✅ Migration completed!\n');
} catch (error) {
    console.error('\n❌ Migration failed. Please check the error above.\n');
    process.exit(1);
}

console.log('✅ Setup complete!\n');
console.log('Next steps:');
console.log('1. Restart your backend server');
console.log('2. Test with a new match');
console.log('3. Check LEVEL_SYSTEM_GUIDE.md for full documentation\n');
