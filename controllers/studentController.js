// controllers/studentController.js
import {
    getStudentDetailsService,
    createStudentProfileService,
    updateStudentProfileService,
    getStudentSessionsService
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
export async function getStudentSessionsForDashboard(req, res){
    try{
        const sessions = await getStudentSessionsService(req.user.id, req.user.time_zone);
        console.log("fetching sessions for student:", req.user.id, sessions);
        return res.status(200).json({sessions:sessions});
    }catch(err){
        console.error("Error in getStudentSessionsForDashboard:", err);
        return res.status(500).json({ error: "Server error while fetching sessions" });
    }

}