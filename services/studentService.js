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
    insertMeeting
    
} from "../databases/userDatabase.js"; // make sure these DB funcs exist

import { getPaymentAmountfromSessionID } from "../databases/sessionDatabase.js"

import * as zoomService from "./zoomService.js";
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

// Get student sessions with timezone conversion, and payment amount
export async function getStudentSessionsService(studentId, userTimeZone) {
    const sessions = await getStudentSessions(studentId);
    const nowUtc = DateTime.utc();

    // ✅ Use Promise.all with async map
    const convertedSessions = await Promise.all(
        sessions.map(async (s) => {  // ✅ Add async here
            // Robust UTC parsing
            let dtUtc;
            if (typeof s.start_time === "string") {
                let isoString = s.start_time.replace(' ', 'T');
                if (!isoString.endsWith('Z')) {
                    isoString += 'Z';
                }
                dtUtc = DateTime.fromISO(isoString, { zone: 'utc' });
            } else if (s.start_time instanceof Date) {
                dtUtc = DateTime.fromJSDate(s.start_time, { zone: 'utc' });
            } else {
                console.error("Invalid start_time:", s.start_time);
                return { ...s, local_start_time: null, meeting_link: null, meeting_scheduled: false };
            }

            if (!dtUtc.isValid) {
                console.error("Invalid Luxon DateTime:", s.start_time);
                return { ...s, local_start_time: null, meeting_link: null, meeting_scheduled: false };
            }

            // Local time for display
            const localTime = dtUtc.setZone(userTimeZone).toISO({ suppressMilliseconds: true });
            console.log("LOCAL TIME IN SERVICE LAYER WHEN RENDERING SESSIONS: ", localTime);
            
            // ✅ Now you can use await
            let amount = null;
            try {
                const paymentResult = await getPaymentAmountfromSessionID(s.session_id); // ✅ This works now
                console.log("Payment result raw:", paymentResult);
                
                if (paymentResult && paymentResult.length > 0) {
                    const paymentRow = paymentResult[0];
                    console.log("Payment row:", paymentRow);
                    
                    amount = parseFloat(paymentRow.amount);
                    console.log("Parsed amount:", amount, "Type:", typeof amount);
                }
            } catch (err) {
                console.error("Error fetching payment amount:", err);
            }

            // Initialize meeting info
            let meetingLink = s.meeting_link || null;
            let meetingScheduled = !!meetingLink;

            if (meetingLink) {
                const endDtUtc = dtUtc.plus({ minutes: Number(s.duration_minutes) });
                if (nowUtc >= endDtUtc) {
                    meetingLink = null;
                    meetingScheduled = false;
                } else if (dtUtc.diff(nowUtc, 'minutes').minutes > 2) {
                    meetingLink = null;
                    meetingScheduled = true;
                } else {
                    meetingScheduled = true;
                }
            }

            return {
                ...s,
                amount: amount,
                local_start_time: localTime,
                payment_status: s.payment_status || null,
                meeting_link: meetingLink,
                meeting_scheduled: meetingScheduled
            };
        })
    );

    return convertedSessions;
}


// ============================
// PAY NOW TRANSACTION
// ============================
export async function payNowForSession(studentId, sessionId) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Fetch session first
        const session = await getSessionById(client, sessionId);
        const startTimeUTC = DateTime.fromSQL(session.start_time, { zone: 'utc' }).toISO();
        // Result: "2025-12-13T14:15:00.000Z"

        console.log("SESSION ID USED TO FETCH SESSION :  ", sessionId)
        console.log("SESSION SCHEDULED FOR in service layer:  ", session.start_time)

        if (!session) throw new Error("Session not found");

        // 2. Check authorization
        console.log("PayNow check:", { studentId, sessionStudentId: session.student_id, sessionId });
        if (session.student_id !== Number(studentId)) throw new Error("Not authorized for this session");


        // 3. Validate payment
        const payment = await getPendingPaymentBySession(client, sessionId);
        if (!payment) throw new Error("No pending payment found");

        // 4. Pick free Zoom account
        const meeting = await zoomService.createMeeting(session, startTimeUTC);

        if (!meeting.link) throw new Error("Failed to create Zoom meeting");

        // Insert meeting inside the same transaction
        const insertedMeeting = await insertMeeting(client, meeting, sessionId);

        // 5. Update payment status
        await updatePaymentStatus(client, payment.transaction_id, "success");

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