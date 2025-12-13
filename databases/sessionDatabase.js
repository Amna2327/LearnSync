import pool from "../db.js";

export async function saveSessionToDatabase(desc, student_id, instructor_id, start_time, duration_minutes, status = 'pending') { // 🟥
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

// Accept a session and create a payment in a transaction
export async function acceptSessionWithPayment_transactional(sessionId, instructorId, amount) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Update session status to 'accepted' (no amount column in sessions)
        const sessionUpdate = await client.query(
            `UPDATE sessions
             SET status = 'accepted'
             WHERE session_id = $1 AND instructor_id = $2
             RETURNING *`,
            [sessionId, instructorId]
        );

        if (sessionUpdate.rowCount === 0) {
            throw new Error("Session not found or unauthorized");
        }

        const session = sessionUpdate.rows[0];

        // 2. Insert payment record
        const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

        const paymentInsert = await client.query(
            `INSERT INTO payments (transaction_id, session_id, student_id, amount, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [
                transactionId,
                session.session_id,
                session.student_id,
                amount
            ]
        );

        const payment = paymentInsert.rows[0];

        await client.query("COMMIT");

        return { session, payment };
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Transactional accept failed:", err);
        return null;
    } finally {
        client.release();
    }
}

// Reject a session
export async function rejectSession(sessionId, instructorId) {
    try {
        const result = await pool.query(
            `UPDATE sessions
             SET status = 'rejected'
             WHERE session_id = $1 AND instructor_id = $2
             RETURNING *`,
            [sessionId, instructorId]
        );

        return result.rowCount > 0 ? result.rows[0] : null;
    } catch (err) {
        console.error("Reject session failed:", err);
        return null;
    }
}

