// services/studentService.js
import {
    getStudentDetails,
    insertStudentDetails,
    updateStudentDetails,
    getStudentSessions
} from "../databases/userDatabase.js";
import { DateTime } from "luxon";

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
