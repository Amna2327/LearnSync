import { saveSessionInfo } from "../services/sessionService.js";
export async function saveSession(req, res) {
    try {
        const { desc, instructor_id, start_time, duration_minutes } = req.body;
        const student_id = req.user.id;
        const userTimeZone = req.user.time_zone; // 🟥 get user's timezone

        console.log("SessionController.js: Saving session with data:", { desc, student_id, instructor_id, start_time, duration_minutes, userTimeZone }); // 🔴 debug

        const saved = await saveSessionInfo(desc, student_id, instructor_id, start_time, duration_minutes, userTimeZone);
        if (!saved) {
            return res.status(400).json({ success: false, message: "Failed to save session" });
        }
        return res.json({ success: true });
    } catch (err) {
        console.error("Error in saveSession:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}