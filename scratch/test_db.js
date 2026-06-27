import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully!");

    // Check if teacher_attendance table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teacher_attendance'
      );
    `);
    console.log("Does teacher_attendance table exist?", tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Query columns
      const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'teacher_attendance';
      `);
      console.log("Columns in teacher_attendance:");
      cols.rows.forEach(c => console.log(` - ${c.column_name}: ${c.data_type}`));

      // Query row count
      const countRes = await client.query('SELECT COUNT(*) FROM teacher_attendance');
      console.log("Total records in teacher_attendance:", countRes.rows[0].count);

      // Query sample records
      const records = await client.query('SELECT * FROM teacher_attendance LIMIT 5');
      console.log("Sample records:", records.rows);
    }

    // Query teachers count
    const teachers = await client.query("SELECT id, name, role, email FROM users WHERE role = 'teacher'");
    console.log("Total teachers in users table:", teachers.rows.length);
    console.log("Teachers list:", teachers.rows);

  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    await client.end();
  }
}

main();
