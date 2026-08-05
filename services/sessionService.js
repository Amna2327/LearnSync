// import { saveSessionToDatabase } from "../databases/sessionDatabase.js";

// export async function saveSessionInfo(desc, student_id, instructor_id, start_time, duration_minutes) {
//     const utc_time = new Date(start_time).toISOString();
//     return await saveSessionToDatabase(desc, student_id, instructor_id, utc_time, duration_minutes);
// }

import { DateTime } from "luxon";
import { saveSessionToDatabase } from "../databases/sessionDatabase.js";

export async function saveSessionInfo(desc, student_id, instructor_id, start_time_str, duration_minutes, userTimeZone) { // 🟥
    // Parse the user's local datetime in their timezone
    const dt = DateTime.fromISO(start_time_str, { zone: userTimeZone }); // 🟥

    // Convert to UTC
    const utc_time = dt.toUTC().toISO(); // 🟥 "2025-12-12T09:00:00.000Z"

    return await saveSessionToDatabase(desc, student_id, instructor_id, utc_time, duration_minutes); // 🟥
}
