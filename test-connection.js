require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default postgres DB first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✓ Connected to PostgreSQL successfully');
    console.log('Current time:', res.rows[0]);
    
    // Check if database exists
    const dbCheck = await pool.query(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`✓ Database '${process.env.DB_NAME}' exists`);
    } else {
      console.log(`✗ Database '${process.env.DB_NAME}' does not exist`);
      console.log('Creating database...');
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✓ Database '${process.env.DB_NAME}' created`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  }
})();
