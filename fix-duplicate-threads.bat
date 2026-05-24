@echo off
echo ========================================
echo Fixing Duplicate Message Threads
echo ========================================
echo.
echo This script will:
echo 1. Remove duplicate message threads
echo 2. Keep only the oldest thread per student-teacher pair
echo 3. Add unique constraint to prevent future duplicates
echo.
echo WARNING: This will modify your database!
echo Make sure you have a backup before proceeding.
echo.
pause

echo.
echo Running migration...
echo.

REM Get database connection from .env file
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr DATABASE_URL') do set %%a=%%b

REM Run the migration using psql or node
node -e "const { Pool } = require('pg'); const fs = require('fs'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); const sql = fs.readFileSync('db/migrations/fix_duplicate_message_threads.sql', 'utf8'); pool.query(sql).then(() => { console.log('Migration completed successfully!'); process.exit(0); }).catch(err => { console.error('Migration failed:', err); process.exit(1); });"

echo.
echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Duplicate threads have been removed.
echo A unique constraint has been added.
echo.
pause
