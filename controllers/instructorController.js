import { saveInstructorFiles } from "../services/instructorService.js";
import { getInstructorDetails } from "../databases/userDatabase.js";

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

