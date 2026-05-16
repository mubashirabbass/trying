
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function findUser() {
    const pool = new pg.Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        const res = await pool.query('SELECT email FROM users WHERE role = \'admin\' LIMIT 1');
        console.log("Admin user:", res.rows[0]);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

findUser();
