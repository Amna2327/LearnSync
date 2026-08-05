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
        if (!instructorId) {
            return res.status(401).json({ error: "Instructor not found. Please log in again." });
        }

        console.log("Upload request received for instructor:", instructorId);
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        // Files (handle both single file and array)
        const certificationsFiles = Array.isArray(req.files["certifications"]) 
            ? req.files["certifications"] 
            : (req.files["certifications"] ? [req.files["certifications"]] : []);
        
        const demoMaterialFiles = Array.isArray(req.files["demo_material"]) 
            ? req.files["demo_material"] 
            : (req.files["demo_material"] ? [req.files["demo_material"]] : []);

        const certificationsUrls = certificationsFiles.map(f => `/uploads/${f.filename}`);
        const demoMaterialUrls = demoMaterialFiles.map(f => `/uploads/${f.filename}`);

        // Extra fields from form
        const { subject_tags, education_level_tags } = req.body;

        console.log("Parsed data:", {
            certifications: certificationsUrls.length,
            demoMaterials: demoMaterialUrls.length,
            subject_tags,
            education_level_tags
        });

        // Validate required fields
        if (!subject_tags || subject_tags.trim() === '') {
            return res.status(400).json({ error: "Please select at least one subject" });
        }

        if (!education_level_tags || education_level_tags.trim() === '') {
            return res.status(400).json({ error: "Please select at least one education level" });
        }

        // Convert comma-separated strings to arrays
        const subjectsArray = subject_tags.split(",").map(s => s.trim()).filter(s => s.length > 0);
        const educationLevelsArray = education_level_tags.split(",").map(s => s.trim()).filter(s => s.length > 0);

        if (subjectsArray.length === 0) {
            return res.status(400).json({ error: "Please select at least one subject" });
        }

        if (educationLevelsArray.length === 0) {
            return res.status(400).json({ error: "Please select at least one education level" });
        }

        // Call service to update DB
        await saveInstructorFiles(
            instructorId,
            certificationsUrls,
            demoMaterialUrls,
            subjectsArray,
            educationLevelsArray
        );

        console.log("Instructor profile saved successfully");
        res.status(200).json({ 
            message: "Instructor profile updated successfully! Your profile is pending admin approval." 
        });
    } catch (err) {
        console.error("Error uploading instructor files:", err);
        console.error("Error stack:", err.stack);
        res.status(500).json({ 
            error: err.message || "Failed to upload instructor profile. Please try again." 
        });
    }
}

export async function filterInstructors(req, res) {
    try {
        const { subject_tags, time_zone } = req.body;

        // Convert comma-separated string into array
        let subjectsArray = [];

        if (Array.isArray(subject_tags)) {
            // Already an array from frontend
            subjectsArray = subject_tags;
        } 
        else if (typeof subject_tags === "string" && subject_tags.trim() !== "") {
            // If still a comma string
            subjectsArray = subject_tags
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
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
