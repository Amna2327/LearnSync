// services/studentService.js
import {
    getStudentDetails,
    insertStudentDetails,
    updateStudentDetails
} from "../databases/userDatabase.js";

// Get student profile
export async function getStudentDetailsService(studentId) {
    return await getStudentDetails(studentId);
}

// Create student profile (first time)
export async function createStudentProfileService(studentId, educationLevel, subjectTags) {
    return await insertStudentDetails(studentId, educationLevel, subjectTags);
}

// Update existing student profile
export async function updateStudentProfileService(studentId, educationLevel, subjectTags) {
    return await updateStudentDetails(studentId, educationLevel, subjectTags);
}
