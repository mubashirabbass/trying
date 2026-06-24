import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  try {
    await client.connect();
    
    // Hash 'admin123'
    const passwordHash = await bcrypt.hash("admin123", 12);
    
    // Update admin@gmail.com password
    const res = await client.query("UPDATE users SET password_hash = $1 WHERE email = 'admin@gmail.com' RETURNING id, email;", [passwordHash]);
    console.log("Updated admin password:", res.rows);
    
    await client.end();
  } catch (err) {
    console.error(err);
  }
}

main();
