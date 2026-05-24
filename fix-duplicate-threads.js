#!/usr/bin/env node

/**
 * Fix Duplicate Message Threads Migration
 * 
 * This script:
 * 1. Removes duplicate message threads (keeps oldest per student-teacher pair)
 * 2. Adds unique constraint to prevent future duplicates
 * 3. Creates index for faster lookups
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('========================================');
  console.log('Fixing Duplicate Message Threads');
  console.log('========================================\n');

  try {
    // Read migration SQL
    const sqlPath = path.join(__dirname, 'db', 'migrations', 'fix_duplicate_message_threads.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...\n');

    // Execute migration
    const result = await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('Changes made:');
    console.log('- Removed duplicate message threads');
    console.log('- Added unique constraint on (student_id, teacher_id)');
    console.log('- Created index for faster lookups\n');

    console.log('========================================');
    console.log('Migration Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Migration failed:\n');
    console.error(error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
