// services/zoomService.js
import axios from "axios";
import * as accountManager from "./accountManager.js";
import { DateTime } from "luxon";

export async function createMeeting(session, start_time) {

    const startTimeUTC = DateTime.fromSQL(session.start_time, { zone: 'utc' }).toFormat("yyyy-LL-dd HH:mm:ss");
    console.log("SESSION SCHEDULED FOR:  ", start_time);
    console.log("UTC string equivalent: ", startTimeUTC)
    const durationMinutes = session.duration_minutes;

    console.log("DURATION: ", session.duration_minutes)
    // 1️⃣ Pick an available Zoom account
    const freeAccount = await accountManager.getAvailableAccount(startTimeUTC, durationMinutes);
    if (!freeAccount) {
        console.log("ACCOUNTS AINT ACCOUNTING, No Zoom accounts available right now.");
        return { message: "No Zoom accounts available right now." };
    }

    // 2️⃣ Get access token
    const token = await accountManager.getAccessToken(freeAccount);
    console.log("Account ID  ", freeAccount.id)
    // 3️⃣ Prepare Zoom meeting data
    const meetingData = {
        topic: session.description || "LearnSync Class",
        type: 2, // Scheduled meeting
        start_time: start_time,
        duration: durationMinutes,
        settings: {
            join_before_host: true,
            waiting_room: false
        }
    };

    // 4️⃣ Call Zoom API
    const response = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        meetingData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    const zoomMeeting = response.data;

    // 5️⃣ Return a meeting object (to be inserted into DB elsewhere)
    return {
        link: zoomMeeting.join_url,
        zoom_account_id: freeAccount.id,
    };
};
