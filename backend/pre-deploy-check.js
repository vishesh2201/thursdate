#!/usr/bin/env node

/**
 * Pre-Deployment Checklist Script
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Deployment Checks...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Environment files
console.log('📝 Checking environment files...');
const envExample = path.join(__dirname, '.env.example');
const envProduction = path.join(__dirname, '.env.production');

if (!fs.existsSync(envExample)) {
  console.log('   ❌ .env.example is missing');
  hasErrors = true;
} else {
  console.log('   ✅ .env.example exists');
}

if (!fs.existsSync(envProduction)) {
  console.log('   ⚠️  .env.production is missing (template only)');
  hasWarnings = true;
} else {
  console.log('   ✅ .env.production exists');
}

// Check 2: Required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = require('./package.json');
const requiredDeps = [
  'express',
  'socket.io',
  'mysql2',
  'jsonwebtoken',
  'dotenv',
  'cors',
  'cloudinary',
];

requiredDeps.forEach((dep) => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep} installed`);
  } else {
    console.log(`   ❌ ${dep} is missing`);
    hasErrors = true;
  }
});

// Check 3: render.yaml exists
console.log('\n🔧 Checking Render configuration...');
const renderConfig = path.join(__dirname, 'render.yaml');
if (fs.existsSync(renderConfig)) {
  console.log('   ✅ render.yaml found');
} else {
  console.log('   ❌ render.yaml is missing');
  hasErrors = true;
}

// Check 4: Server file exists
console.log('\n🖥️  Checking server file...');
const serverFile = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFile)) {
  console.log('   ✅ server.js found');
  
  // Check for health endpoint
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  if (serverContent.includes('/api/health')) {
    console.log('   ✅ Health check endpoint found');
  } else {
    console.log('   ⚠️  Health check endpoint not found');
    hasWarnings = true;
  }
} else {
  console.log('   ❌ server.js is missing');
  hasErrors = true;
}

// Check 5: Migration files
console.log('\n🗄️  Checking database migrations...');
const migrationsDir = path.join(__dirname, 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  console.log(`   ✅ Found ${migrations.length} SQL migrations`);
} else {
  console.log('   ⚠️  No migrations directory found');
  hasWarnings = true;
}

// Check 6: .gitignore includes .env
console.log('\n🔒 Checking .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('   ✅ .env is in .gitignore');
  } else {
    console.log('   ❌ .env is NOT in .gitignore - SECURITY RISK!');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  .gitignore not found');
  hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORS FOUND - Fix these before deploying!');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS FOUND - Review before deploying');
  console.log('✅ No critical errors detected');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED - Ready to deploy!');
  process.exit(0);
}
