import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // loads .env

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT || 5432,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Test connection function
export async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connection test successful:', result.rows[0]);
        return true;
    } catch (err) {
        console.error('❌ Database connection test failed:', {
            message: err.message,
            code: err.code,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            user: process.env.PGUSER
        });
        return false;
    }
}

export default pool;