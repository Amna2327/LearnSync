import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config(); // load env

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise()

export default pool; //exports the connection for reuse later