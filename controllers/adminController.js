// src/controllers/adminController.js
import {
    getPendingInstructorsService,
    approveInstructorService,
    rejectInstructorService
} from "../services/adminService.js";
import { getInstructorDetails } from "../databases/userDatabase.js";

// Existing functions (getPendingInstructors, approveInstructor, rejectInstructor) remain

export async function approveInstructor(req, res) {
    try {
        const { id } = req.params;
        const instructor = await approveInstructorService(id);
        return res.json({ message: "Instructor approved", instructor });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

export async function rejectInstructor(req, res) {
    try {
        const { id } = req.params;
        const instructor = await rejectInstructorService(id);
        return res.json({ message: "Instructor rejected", instructor });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}


// New: fetch full instructor details including uploaded files
export async function getInstructorFullDetails(req, res) {
    try {
        const { id } = req.params;
        const details = await getInstructorDetails(id);
        if (!details) return res.status(404).json({ error: "Instructor not found" });

        res.json(details);
    } catch (err) {
        console.error("Error fetching instructor details:", err);
        res.status(500).json({ error: "Failed to fetch instructor details" });
    }
}

export async function getPendingInstructors(req, res) {
    try {
        const instructors = await getPendingInstructorsService();
        return res.json(instructors);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

