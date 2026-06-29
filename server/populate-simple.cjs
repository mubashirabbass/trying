const { Pool } = require('pg');

// Simple script to populate entry records using raw SQL
async function populateEntryRecords() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🚀 Starting to populate entry records...');
    
    // Check if entry records table exists and has data
    const existingCount = await pool.query('SELECT COUNT(*) FROM entry_records');
    console.log(`📊 Existing entry records: ${existingCount.rows[0].count}`);
    
    if (existingCount.rows[0].count > 0) {
      console.log('✅ Entry records already exist');
      return;
    }

    // Get students with enrollments
    const studentsQuery = `
      SELECT DISTINCT 
        u.id,
        u.name,
        u.reg_no,
        u.created_at
      FROM users u
      INNER JOIN enrollments e ON u.id = e.user_id
      WHERE u.role = 'student' AND u.is_active = true
      LIMIT 10
    `;
    
    const students = await pool.query(studentsQuery);
    console.log(`👥 Found ${students.rows.length} students`);

    if (students.rows.length === 0) {
      console.log('❌ No students found');
      return;
    }

    // Create sample entry records
    const currentMonth = new Date().toLocaleDateString("en-GB", { 
      month: "long", 
      year: "numeric" 
    });

    const insertPromises = students.rows.map(async (student, index) => {
      const insertQuery = `
        INSERT INTO entry_records (
          student_name,
          hist_no,
          course,
          admission_date,
          duration,
          receipt_no,
          amount,
          month,
          is_auto_generated,
          user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      
      const values = [
        student.name,
        student.reg_no || `REG-${String(index + 1).padStart(3, '0')}`,
        'Computer Course',
        new Date(student.created_at).toLocaleDateString('en-GB'),
        '6 Months',
        `RCP-${String(index + 1).padStart(3, '0')}`,
        15000 + (index * 1000), // Varying amounts
        currentMonth,
        true, // Auto generated
        student.id
      ];
      
      await pool.query(insertQuery, values);
      console.log(`✅ Created entry record for: ${student.name}`);
    });

    await Promise.all(insertPromises);
    
    // Final count
    const finalCount = await pool.query('SELECT COUNT(*) FROM entry_records');
    console.log(`🎉 Successfully created ${finalCount.rows[0].count} entry records!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config({ path: '../.env' });

populateEntryRecords()
  .then(() => {
    console.log('✅ Population completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Population failed:', error);
    process.exit(1);
  });