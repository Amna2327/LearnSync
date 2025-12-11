import pool from "../db.js";

export async function saveSessionToDatabase(desc, student_id, instructor_id, start_time, duration_minutes, status='pending') { // 🟥
    try {
        const result = await pool.query(
            `INSERT INTO sessions (description, student_id, instructor_id, start_time, duration_minutes, status)
             VALUES ($1, $2, $3, $4, $5, $6)`, // 🟥
            [desc, student_id, instructor_id, start_time, duration_minutes, status] // 🟥
        );

        return result.rowCount === 1; // TRUE if insert succeeded
    } catch (err) {
        console.error("Error in saveSession [database]:", err);
        return false;
    }
}
