import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  console.log("Connecting...");
  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // Check if table exists
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'teacher_attendance'
      );
    `);
    console.log("Does teacher_attendance table exist?", res.rows[0].exists);

    if (res.rows[0].exists) {
      // Describe the table columns
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'teacher_attendance';
      `);
      console.log("Columns:");
      console.log(cols.rows);

      // Check current rows
      const rows = await client.query(`SELECT count(*) FROM teacher_attendance;`);
      console.log("Number of rows:", rows.rows[0].count);
    } else {
      console.log("Table does not exist. Let's create it if needed.");
    }
    
    // Let's print users count by role
    const usersRes = await client.query(`
      SELECT role, count(*) FROM users GROUP BY role;
    `);
    console.log("Users by role:", usersRes.rows);

    await client.end();
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

main();
