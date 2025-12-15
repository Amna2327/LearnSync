import { getInstructorDetails, insertInstructorDetails, updateInstructorDetails, getInstructorsByTags, getInstructorSessions } from "../databases/userDatabase.js";
import { DateTime } from "luxon";

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

    const convertedSessions = sessions.map(s => {
        console.log("[DEBUG] Raw session start_time type:", typeof s.start_time, s.start_time);

        // Convert to Luxon DateTime — use fromJSDate if it's a Date object
        const dt = (s.start_time instanceof Date) 
                   ? DateTime.fromJSDate(s.start_time, { zone: 'utc' })
                   : DateTime.fromISO(s.start_time, { zone: 'utc' });

        console.log("[DEBUG] Luxon DateTime valid?:", dt.isValid, dt.toString());

        const localTime = dt.setZone(userTimeZone).toFormat("yyyy-LL-dd HH:mm");

        console.log(`[DEBUG] Session ${s.session_id}: UTC=${s.start_time}, Local(${userTimeZone})=${localTime}`);

        return { ...s, local_start_time: localTime };
    });

    return convertedSessions;
}
