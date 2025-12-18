import { saveInstructorFiles, getTaggedInstructorInfo, getInstructorSessionsService } from "../services/instructorService.js";
import { getInstructorDetails } from "../databases/userDatabase.js";
import { updateSessionStatusByInstructor } from "../services/instructorService.js";
// import { getMaxListeners } from "events";

export async function getInstructorProfile(req, res) {
    try {
        const instructorId = req.user.id; // From JWT

        const details = await getInstructorDetails(instructorId);

        res.status(200).json({
            id: instructorId,
            status: req.user.status,
            certifications: details?.certifications || [],
            demo_material: details?.demo_material || [],
            subject_tags: details?.subject_tags || [],
            education_level_tags: details?.education_level_tags || []
        });

    } catch (err) {
        console.error("Error fetching instructor profile:", err);
        res.status(500).json({ error: "Failed to load instructor profile" });
    }
}

export async function uploadInstructorFiles(req, res) {
    try {
        const instructorId = req.user.id;
        if (!instructorId) throw new Error("Instructor not found");

        // Files
        const certificationsFiles = req.files["certifications"] || [];
        const demoMaterialFiles = req.files["demo_material"] || [];

        const certificationsUrls = certificationsFiles.map(f => `/uploads/${f.filename}`);
        const demoMaterialUrls = demoMaterialFiles.map(f => `/uploads/${f.filename}`);

        // Extra fields from form
        const { subject_tags, education_level_tags } = req.body;

        // Convert comma-separated strings to arrays
        const subjectsArray = subject_tags ? subject_tags.split(",").map(s => s.trim()) : [];
        const educationLevelsArray = education_level_tags ? education_level_tags.split(",").map(s => s.trim()) : [];

        // Call service to update DB
        await saveInstructorFiles(
            instructorId,
            certificationsUrls,
            demoMaterialUrls,
            subjectsArray,
            educationLevelsArray
        );

        res.status(200).json({ message: "Instructor profile updated successfully" });
    } catch (err) {
        console.error("Error uploading instructor files:", err);
        res.status(500).json({ error: "Failed to upload instructor profile" });
    }
}

export async function filterInstructors(req, res) {
    try {
        const { subject_tags, time_zone } = req.body;

        // Convert comma-separated string into array
        let subjectsArray = [];
        if (subject_tags) {
            subjectsArray = subject_tags
                .split(",")
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        // Fetch instructors from DB
        const result = await getTaggedInstructorInfo(time_zone, subjectsArray);

        console.log("Controller - filterInstructors result:", result.rows);

        // Map rows to frontend-friendly format
        const instructors = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email,
            time_zone: row.time_zone,
            subject_tags: row.subject_tags || [],
            education_level_tags: row.education_level_tags || [],
            demo_material: row.demo_material || [] // include demo material links
        }));

        res.status(200).json({ instructors });

    } catch (err) {
        console.error("Error filtering instructors:", err);
        res.status(500).json({ error: "Failed to fetch instructors" });
    }
}


export async function getInstructorSessionsForDashboard(req, res) {
    try {
        const sessions = await getInstructorSessionsService(req.user.id, req.user.time_zone);
        console.log("fetching sessions for instructor: ", req.user.id, sessions);
        return res.status(200).json({ sessions: sessions });
    } catch (err) {
        console.error("Error in getInstructorSessionsForDashboard:", err);
        return res.status(500).json({ error: "Server error while fetching sessions" });
    }

}

// instructorController.js (add / replace handleSessionRequest)
export async function handleSessionRequest(req, res) {
    try {
        const instructorId = req.user.id;
        const { session_id, action, amount } = req.body;

        if (!session_id || !action || (action === "accept" && (!amount || amount <= 0))) {
            return res.status(400).json({ success: false, error: "Missing required fields or invalid amount" });
        }

        const updated = await updateSessionStatusByInstructor(session_id, instructorId, action, amount);

        if (!updated) {
            return res.status(404).json({ success: false, error: "Session not found or you are not authorized" });
        }

        res.json({ success: true, message: `Session ${action}ed successfully` });

    } catch (err) {
        console.error("Error in handleSessionRequest:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
}
