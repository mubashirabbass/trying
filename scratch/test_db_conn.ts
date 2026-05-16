
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function testDb() {
    console.log("Connecting to:", process.env.DATABASE_URL);
    const pool = new pg.Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    try {
        const res = await pool.query('SELECT 1');
        console.log("DB Connection OK:", res.rows);
    } catch (err) {
        console.error("DB Connection FAILED:", err);
    } finally {
        await pool.end();
    }
}

testDb();
