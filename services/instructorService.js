import { getInstructorDetails, insertInstructorDetails, updateInstructorDetails, getInstructorsByTags, getInstructorSessions } from "../databases/userDatabase.js";
import { DateTime } from "luxon";
import { acceptSessionWithPayment_transactional, rejectSession } from "../databases/sessionDatabase.js";

/**
 * Save or update instructor profile including:
 * - certifications (array of URLs)
 * - demoMaterials (array of URLs)
 * - subjectTags (array of strings)
 * - educationLevels (array of strings)
 */
export async function saveInstructorFiles(
    instructorId,
    certifications = [],
    demoMaterials = [],
    subjectTags = [],
    educationLevels = []
) {
    const details = await getInstructorDetails(instructorId);

    if (!details) {
        // Insert new row
        await insertInstructorDetails(
            instructorId,
            certifications,
            demoMaterials,
            subjectTags,
            educationLevels
        );
    } else {
        // Append to existing arrays
        const existingCerts = details.certifications || [];
        const existingDemo = details.demo_material || [];
        const existingSubjects = details.subject_tags || [];
        const existingEducationLevels = details.education_level_tags || [];

        await updateInstructorDetails(
            instructorId,
            [...existingCerts, ...certifications],
            [...existingDemo, ...demoMaterials],
            [...existingSubjects, ...subjectTags],
            [...existingEducationLevels, ...educationLevels]
        );
    }
}

export async function getTaggedInstructorInfo(time_zone, subjectTags = []) {
    console.log("Service - getTaggedInstructorInfo called with:", { time_zone, subjectTags });
    return getInstructorsByTags(subjectTags, time_zone);
}

export async function getInstructorSessionsService(instructorId, userTimeZone) {
    const sessions = await getInstructorSessions(instructorId);
    const nowUtc = DateTime.utc(); // Current UTC time

    const convertedSessions = sessions.map(s => {
        // Robust UTC parsing
        let dtUtc;
        if (typeof s.start_time === "string") {
            // Normalize string to ISO-8601
            let isoString = s.start_time.replace(' ', 'T'); // Replace space with T
            if (!isoString.endsWith('Z')) {
                isoString += 'Z'; // Treat as UTC
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
        console.log(localTime)
        // Initialize meeting info
        let meetingLink = s.meeting_link || null;
        let meetingScheduled = !!meetingLink;

        if (meetingLink) {
            const endDtUtc = dtUtc.plus({ minutes: Number(s.duration_minutes) }); // Session end in UTC

            if (nowUtc >= endDtUtc) {
                // Session completely finished
                meetingLink = null;
                meetingScheduled = false;
            } else if (dtUtc.diff(nowUtc, 'minutes').minutes > 10) {
                // Session in future (>10 min away), hide link
                meetingLink = null;
                meetingScheduled = true;
            } else {
                // Session within 10 min or ongoing: show link
                meetingScheduled = true;
            }
        }

        return {
            ...s,
            local_start_time: localTime,
            payment_status: s.payment_status || null,
            meeting_link: meetingLink,
            meeting_scheduled: meetingScheduled
        };
    });

    return convertedSessions;
}
/**
 * Called when instructor accepts/rejects a session.
 * - If accept: updates session.status to 'accepted', sets amount, creates payment entry (pending).
 * - If reject: updates session.status to 'rejected'.
 *
 * Returns the updated session row (object) on success, otherwise null/false.
 */

// Update session status by instructor
export async function updateSessionStatusByInstructor(sessionId, instructorId, action, amount) {
    if (action === "accept") {
        // Use the transactional DB function
        const result = await acceptSessionWithPayment_transactional(sessionId, instructorId, amount);
        return result ? result.session : null;

    } else if (action === "reject") {
        const session = await rejectSession(sessionId, instructorId);
        return session || null;

    } else {
        return null;
    }
}


