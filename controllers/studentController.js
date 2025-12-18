// controllers/studentController.js
import {
    getStudentDetailsService,
    createStudentProfileService,
    updateStudentProfileService,
    getStudentSessionsService,
    payNowForSession
} from "../services/studentService.js";

/**
 * GET /student/details
 * Returns { exists: boolean, profile: {...} }
 * Pure fetch, does NOT update anything.
 */
export async function getStudentDetailsForDashboard(req, res) {
    try {
        const details = await getStudentDetailsService(req.user.id);
        if (!details) {
            return res.json({ exists: false, profile: null });
        }
        return res.json({ exists: true, profile: details });
    } catch (err) {
        console.error("Error in getStudentDetailsForDashboard:", err);
        return res.status(500).json({ error: "Server error fetching profile" });
    }
}

/**
 * POST /student/profile
 * Called only when student submits the form (create or explicit update).
 * This will create profile if none exists, otherwise it will update.
 */
export async function saveStudentProfile(req, res) {
    try {
        let { education_level, subject_tags } = req.body;

        // basic validation
        if (!education_level || !subject_tags) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // convert comma string to array if needed
        if (typeof subject_tags === "string") {
            subject_tags = subject_tags.split(",").map(s => s.trim()).filter(Boolean);
        }

        const existing = await getStudentDetailsService(req.user.id);

        if (!existing) {
            await createStudentProfileService(req.user.id, education_level, subject_tags);
            return res.json({ message: "Profile created" });
        } else {
            await updateStudentProfileService(req.user.id, education_level, subject_tags);
            return res.json({ message: "Profile updated" });
        }
    } catch (err) {
        console.error("Error in saveStudentProfile:", err);
        return res.status(500).json({ error: "Server error while saving profile" });
    }
}
export async function getStudentSessionsForDashboard(req, res) {
    try {
        const sessions = await getStudentSessionsService(req.user.id, req.user.time_zone);
        console.log("fetching sessions for student:", req.user.id, sessions);
        return res.status(200).json({ sessions: sessions });
    } catch (err) {
        console.error("Error in getStudentSessionsForDashboard:", err);
        return res.status(500).json({ error: "Server error while fetching sessions" });
    }

}

/**
 * POST /student/pay_session
 * Body: { session_id }
 * Marks payment as success, schedules meeting, updates session status.
 */

export async function payForSession(req, res) {
    try {
        const studentId = req.user.id;
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ success: false, message: "Missing session_id" });
        }

        // FIXED: pass studentId first, sessionId second
        const result = await payNowForSession(studentId, session_id);

        if (result.success) {
            return res.json({
                success: true,
                message: "Payment successful and session scheduled",
                zoom_link: result.meeting?.link // FIXED: get actual Zoom link
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.error || "Payment failed"
            });
        }
    } catch (err) {
        console.error("Error in payForSession:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
