const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  CREATE TABLE IF NOT EXISTS franchise_applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`).then(() => {
  console.log('franchise_applications table created successfully!');
  pool.end();
}).catch(e => {
  console.error('Error:', e.message);
  pool.end();
  process.exit(1);
});
