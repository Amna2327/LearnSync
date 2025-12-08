import { getInstructorDetails, insertInstructorDetails, updateInstructorDetails } from "../databases/userDatabase.js";

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
