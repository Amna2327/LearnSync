// services/studentService.js
import {
    getStudentDetails,
    insertStudentDetails,
    updateStudentDetails,
    getStudentSessions,
    getSessionById,
    updateSessionStatus,
    getPendingPaymentBySession,
    updatePaymentStatus,
    insertMeeting,
    getFreeZoomAccount
} from "../databases/userDatabase.js"; // make sure these DB funcs exist
import { DateTime } from "luxon";
import pool from "../db.js";

// Get student profile
export async function getStudentDetailsService(studentId) {
    return await getStudentDetails(studentId);
}

// Create student profile (first time)
export async function createStudentProfileService(studentId, educationLevel, subjectTags) {
    return await insertStudentDetails(studentId, educationLevel, subjectTags);
}

// Update existing student profile
export async function updateStudentProfileService(studentId, educationLevel, subjectTags) {
    return await updateStudentDetails(studentId, educationLevel, subjectTags);
}

// Get student sessions with timezone conversion
export async function getStudentSessionsService(studentId, userTimeZone) {
    const sessions = await getStudentSessions(studentId);

    const convertedSessions = sessions.map(s => {
        console.log("[DEBUG] Raw session start_time type:", typeof s.start_time, s.start_time);

        // Convert to Luxon DateTime — use fromJSDate if it's a Date object
        const dt = (s.start_time instanceof Date)
            ? DateTime.fromJSDate(s.start_time, { zone: 'utc' })
            : DateTime.fromISO(s.start_time, { zone: 'utc' });

        console.log("[DEBUG] Luxon DateTime valid?:", dt.isValid, dt.toString());

        const localTime = dt.setZone(userTimeZone).toISO({ suppressMilliseconds: true });

        console.log(`[DEBUG] Session ${s.session_id}: UTC=${s.start_time}, Local(${userTimeZone})=${localTime}`);

        return { ...s, local_start_time: localTime };
    });

    return convertedSessions;
}

/* existing functions here... */

// ============================
// PAY NOW TRANSACTION
// ============================
export async function payNowForSession(studentId, sessionId) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Fetch session first
        const session = await getSessionById(client, sessionId);
        if (!session) throw new Error("Session not found");

        // 2. Check authorization
        console.log("PayNow check:", { studentId, sessionStudentId: session.student_id, sessionId });
        if (session.student_id !== Number(studentId)) throw new Error("Not authorized for this session");


        // 3. Validate payment
        const payment = await getPendingPaymentBySession(client, sessionId);
        if (!payment) throw new Error("No pending payment found");

        // 4. Pick free Zoom account
        const zoomAccount = await getFreeZoomAccount(client);
        if (!zoomAccount) throw new Error("No free Zoom account available");

        // 5. Update payment status
        await updatePaymentStatus(client, payment.transaction_id, "success");

        // 6. Insert meeting
        const meeting = await insertMeeting(client, {
            session_id: sessionId,
            zoom_account_id: zoomAccount.id,
            link: `https://zoom.mock/${Date.now()}_${sessionId}`
        });

        // 7. Update session status
        await updateSessionStatus(client, sessionId, "scheduled");

        await client.query("COMMIT");
        return { success: true, meeting, payment };

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PayNow transaction failed:", err);
        return { success: false, error: err.message };
    } finally {
        client.release();
    }
}
