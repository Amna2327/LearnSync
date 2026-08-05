// src/services/adminService.js
import { getPendingInstructors, getInstructorDetails, approveInstructorById, rejectInstructorById } from "../databases/userDatabase.js";

export async function getPendingInstructorsService() {
    const pending = await getPendingInstructors();

    // For each instructor, fetch their uploaded files/details
    const detailedPending = await Promise.all(
        pending.map(async (instr) => {
            const details = await getInstructorDetails(instr.id);
            return { ...instr, files: details || {} };
        })
    );

    return detailedPending;
}

export async function approveInstructorService(id) {
    const updatedInstructor = await approveInstructorById(id);
    if (!updatedInstructor) throw new Error("Instructor not found");
    return updatedInstructor;
}

export async function rejectInstructorService(id) {
    const updatedInstructor = await rejectInstructorById(id);
    if (!updatedInstructor) throw new Error("Instructor not found");
    return updatedInstructor;
}
